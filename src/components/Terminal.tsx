import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { WebglAddon } from '@xterm/addon-webgl';
import '@xterm/xterm/css/xterm.css';
import { Box, IconButton, Paper, useTheme } from '@mui/material';
import { Close, Remove, DragHandle } from '@mui/icons-material';
import { eventBus } from '../services/EventBus';
import { logger } from '../services/LogService';

interface TerminalProps {
  onClose: () => void;
  onMinimize: () => void;
}

const Terminal: React.FC<TerminalProps> = ({ onClose, onMinimize }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const terminalRef = useRef<HTMLDivElement>(null);
  const commandBufferRef = useRef('');
  const [terminal, setTerminal] = useState<XTerm | null>(null);
  const [fitAddon, setFitAddon] = useState<FitAddon | null>(null);
  const [height, setHeight] = useState(300);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
    setStartHeight(height);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaY = startY - e.clientY;
      const newHeight = Math.min(Math.max(startHeight + deltaY, 100), window.innerHeight - 100);
      setHeight(newHeight);
      fitAddon?.fit();
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startY, startHeight, fitAddon]);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Consolas, monospace',
      theme: isDarkMode ? {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
        cursorAccent: '#1e1e1e',
        selectionBackground: '#264f78',
        black: '#1e1e1e',
        red: '#f44747',
        green: '#6a9955',
        yellow: '#d7ba7d',
        blue: '#569cd6',
        magenta: '#c586c0',
        cyan: '#4dc9b0',
        white: '#d4d4d4',
        brightBlack: '#808080',
        brightRed: '#f44747',
        brightGreen: '#6a9955',
        brightYellow: '#d7ba7d',
        brightBlue: '#569cd6',
        brightMagenta: '#c586c0',
        brightCyan: '#4dc9b0',
        brightWhite: '#d4d4d4'
      } : {
        background: '#ffffff',
        foreground: '#333333',
        cursor: '#333333',
        cursorAccent: '#ffffff',
        selectionBackground: '#add6ff',
        black: '#000000',
        red: '#cd3131',
        green: '#00bc00',
        yellow: '#949800',
        blue: '#0451a5',
        magenta: '#bc05bc',
        cyan: '#0598bc',
        white: '#555555',
        brightBlack: '#666666',
        brightRed: '#cd3131',
        brightGreen: '#14ce14',
        brightYellow: '#b5ba00',
        brightBlue: '#0451a5',
        brightMagenta: '#bc05bc',
        brightCyan: '#0598bc',
        brightWhite: '#a5a5a5'
      },
      convertEol: true,
      scrollback: 1000,
      rightClickSelectsWord: true,
      allowTransparency: true
    });

    const newFitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    let webglAddon: WebglAddon | null = null;

    term.loadAddon(newFitAddon);
    term.loadAddon(webLinksAddon);

    term.open(terminalRef.current);

    try {
      webglAddon = new WebglAddon();
      term.loadAddon(webglAddon);
      webglAddon.onContextLoss(() => {
        webglAddon?.dispose();
      });
    } catch (e) {
      console.warn('WebGL addon could not be loaded', e);
    }

    setTimeout(() => {
      try {
        newFitAddon.fit();
      } catch (e) {
        console.warn('Failed to fit terminal:', e);
      }
    }, 0);

    term.write('Desktop Agent Terminal\r\nType "help" for available commands\r\n\r\n$ ');

    term.attachCustomKeyEventHandler((event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'c' && term.hasSelection()) {
        const selection = term.getSelection();
        if (selection) {
          navigator.clipboard.writeText(selection);
        }
        return false;
      }
      
      if (event.ctrlKey && event.key === 'v') {
        navigator.clipboard.readText().then(text => {
          text.split('').forEach(char => {
            if (char === '\n') {
              term.write('\r');
            } else {
              term.write(char);
            }
            commandBufferRef.current += char;
          });
        });
        return false;
      }

      if (event.ctrlKey && event.key === 'l') {
        term.clear();
        term.write('\r\n$ ');
        commandBufferRef.current = '';
        return false;
      }

      return true;
    });

    terminalRef.current.addEventListener('contextmenu', (e: MouseEvent) => {
      e.preventDefault();
      if (term.hasSelection()) {
        const selection = term.getSelection();
        if (selection) {
          navigator.clipboard.writeText(selection);
        }
      }
    });

    term.onData((data) => {
      if (data === '\r') {
        const command = commandBufferRef.current.trim();
        if (command) {
          term.write('\r\n');
          if (command === 'clear' || command === 'cls') {
            term.clear();
            term.write('$ ');
          } else {
            window.electronAPI.runCommand(command).then((output: string) => {
              if (output) {
                term.write(output.replace(/\n/g, '\r\n'));
              }
              term.write('\r\n$ ');
            }).catch((error: Error) => {
              term.write(`\r\nError: ${error.message}\r\n$ `);
            });
          }
        } else {
          term.write('\r\n$ ');
        }
        commandBufferRef.current = '';
      } else if (data === '\u007f') {
        if (commandBufferRef.current.length > 0) {
          commandBufferRef.current = commandBufferRef.current.slice(0, -1);
          term.write('\b \b');
        }
      } else if (data === '\u0003') {
        if (term.hasSelection()) {
          const selection = term.getSelection();
          if (selection) {
            navigator.clipboard.writeText(selection);
          }
        } else {
          term.write('^C\r\n$ ');
          commandBufferRef.current = '';
        }
      } else {
        commandBufferRef.current += data;
        term.write(data);
      }
    });

    const handleResize = () => {
      try {
        newFitAddon.fit();
      } catch (e) {
        console.warn('Failed to resize terminal:', e);
      }
    };

    window.addEventListener('resize', handleResize);
    setTerminal(term);
    setFitAddon(newFitAddon);

    return () => {
      window.removeEventListener('resize', handleResize);
      webglAddon?.dispose();
      term.dispose();
    };
  }, [isDarkMode]);

  useEffect(() => {
    if (!terminal) return;

    const terminalTheme = isDarkMode ? {
      background: '#1e1e1e',
      foreground: '#d4d4d4',
      cursor: '#d4d4d4',
      cursorAccent: '#1e1e1e',
      selectionBackground: '#264f78',
      black: '#1e1e1e',
      red: '#f44747',
      green: '#6a9955',
      yellow: '#d7ba7d',
      blue: '#569cd6',
      magenta: '#c586c0',
      cyan: '#4dc9b0',
      white: '#d4d4d4',
      brightBlack: '#808080',
      brightRed: '#f44747',
      brightGreen: '#6a9955',
      brightYellow: '#d7ba7d',
      brightBlue: '#569cd6',
      brightMagenta: '#c586c0',
      brightCyan: '#4dc9b0',
      brightWhite: '#d4d4d4'
    } : {
      background: '#ffffff',
      foreground: '#333333',
      cursor: '#333333',
      cursorAccent: '#ffffff',
      selectionBackground: '#add6ff',
      black: '#000000',
      red: '#cd3131',
      green: '#00bc00',
      yellow: '#949800',
      blue: '#0451a5',
      magenta: '#bc05bc',
      cyan: '#0598bc',
      white: '#555555',
      brightBlack: '#666666',
      brightRed: '#cd3131',
      brightGreen: '#14ce14',
      brightYellow: '#b5ba00',
      brightBlue: '#0451a5',
      brightMagenta: '#bc05bc',
      brightCyan: '#0598bc',
      brightWhite: '#a5a5a5'
    };

    terminal.options.theme = terminalTheme;
  }, [isDarkMode, terminal]);

  return (
    <Paper
      elevation={3}
      sx={{
        width: '100%',
        height: `${height}px`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: isDarkMode ? '#1e1e1e' : '#ffffff',
        border: '1px solid',
        borderColor: isDarkMode ? '#333' : '#e0e0e0',
        transition: isDragging ? 'none' : 'height 0.2s',
        position: 'absolute',
        bottom: 0,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: isDarkMode ? '#252526' : '#f5f5f5',
          borderBottom: '1px solid',
          borderColor: isDarkMode ? '#333' : '#e0e0e0',
          px: 1,
          py: 0.5,
          cursor: isDragging ? 'row-resize' : 'default',
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          color: isDarkMode ? '#d4d4d4' : '#333333', 
          fontSize: '0.9rem' 
        }}>
          <DragHandle 
            sx={{ 
              fontSize: 18, 
              cursor: 'row-resize',
              color: 'text.secondary',
              '&:hover': {
                color: 'text.primary'
              }
            }} 
            onMouseDown={handleMouseDown}
          />
          Terminal
        </Box>
        <Box>
          <IconButton size="small" onClick={onMinimize} sx={{ color: isDarkMode ? '#d4d4d4' : '#333333' }}>
            <Remove fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={onClose} sx={{ color: isDarkMode ? '#d4d4d4' : '#333333' }}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      <Box
        ref={terminalRef}
        sx={{
          flex: 1,
          bgcolor: isDarkMode ? '#1e1e1e' : '#ffffff',
          '& .xterm': {
            padding: '4px',
          },
        }}
      />
    </Paper>
  );
};

export default Terminal; 
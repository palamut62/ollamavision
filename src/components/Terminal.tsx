import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { WebglAddon } from '@xterm/addon-webgl';
import '@xterm/xterm/css/xterm.css';
import { Box, IconButton, Paper } from '@mui/material';
import { Close, Remove, DragHandle } from '@mui/icons-material';
import { eventBus } from '../services/EventBus';
import { logger } from '../services/LogService';

interface TerminalProps {
  onClose: () => void;
  onMinimize: () => void;
}

const Terminal: React.FC<TerminalProps> = ({ onClose, onMinimize }) => {
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
      theme: {
        background: '#1e1e1e',
        foreground: '#ffffff',
        cursor: '#ffffff',
        cursorAccent: '#000000',
        selectionBackground: '#264f78',
        black: '#000000',
        red: '#ee4444',
        green: '#44ee44',
        yellow: '#eeee44',
        blue: '#4444ee',
        magenta: '#ee44ee',
        cyan: '#44eeee',
        white: '#eeeeee',
        brightBlack: '#666666',
        brightRed: '#ff4444',
        brightGreen: '#44ff44',
        brightYellow: '#ffff44',
        brightBlue: '#4444ff',
        brightMagenta: '#ff44ff',
        brightCyan: '#44ffff',
        brightWhite: '#ffffff'
      },
      convertEol: true,
      cols: 120,
      rows: 30,
      scrollback: 1000,
      rightClickSelectsWord: true,
      allowTransparency: true
    });

    const newFitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    const webglAddon = new WebglAddon();

    term.loadAddon(newFitAddon);
    term.loadAddon(webLinksAddon);
    try {
      term.loadAddon(webglAddon);
    } catch (e) {
      console.warn('WebGL addon could not be loaded', e);
    }

    term.open(terminalRef.current);
    newFitAddon.fit();

    // Kopyalama ve yapıştırma için event listener'lar
    term.attachCustomKeyEventHandler((event: KeyboardEvent) => {
      // Ctrl+C (Kopyalama)
      if (event.ctrlKey && event.key === 'c' && term.hasSelection()) {
        const selection = term.getSelection();
        if (selection) {
          navigator.clipboard.writeText(selection);
        }
        return false;
      }
      
      // Ctrl+V (Yapıştırma)
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

      // Ctrl+L (Temizleme)
      if (event.ctrlKey && event.key === 'l') {
        term.clear();
        term.write('\r\n$ ');
        commandBufferRef.current = '';
        return false;
      }

      return true;
    });

    // Sağ tık menüsü için event listener
    terminalRef.current.addEventListener('contextmenu', (e: MouseEvent) => {
      e.preventDefault();
      if (term.hasSelection()) {
        const selection = term.getSelection();
        if (selection) {
          navigator.clipboard.writeText(selection);
        }
      }
    });

    term.write('Desktop Agent Terminal\r\n\r\n$ ');

    term.onData((data) => {
      if (data === '\r') { // Enter tuşu
        const command = commandBufferRef.current.trim();
        if (command) {
          term.write('\r\n');
          if (command === 'clear' || command === 'cls') {
            term.clear();
            term.write('$ ');
          } else {
            // Komutu çalıştır
            window.electronAPI.runCommand(command).then((output) => {
              if (output) {
                term.write(output.replace(/\n/g, '\r\n'));
              }
              term.write('\r\n$ ');
            }).catch((error) => {
              term.write(`\r\nError: ${error}\r\n$ `);
            });
          }
        } else {
          term.write('\r\n$ ');
        }
        commandBufferRef.current = '';
      } else if (data === '\u007f') { // Backspace
        if (commandBufferRef.current.length > 0) {
          commandBufferRef.current = commandBufferRef.current.slice(0, -1);
          term.write('\b \b');
        }
      } else if (data === '\u0003') { // Ctrl+C
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
      newFitAddon.fit();
    };

    window.addEventListener('resize', handleResize);
    setTerminal(term);
    setFitAddon(newFitAddon);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  return (
    <Paper
      elevation={3}
      sx={{
        width: '100%',
        height: `${height}px`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: '#1e1e1e',
        border: '1px solid #333',
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
          bgcolor: '#252526',
          borderBottom: '1px solid #333',
          px: 1,
          py: 0.5,
          cursor: isDragging ? 'row-resize' : 'default',
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          color: '#d4d4d4', 
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
          <IconButton size="small" onClick={onMinimize} sx={{ color: '#d4d4d4' }}>
            <Remove fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={onClose} sx={{ color: '#d4d4d4' }}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      <Box
        ref={terminalRef}
        sx={{
          flex: 1,
          bgcolor: '#1e1e1e',
          '& .xterm': {
            padding: '4px',
          },
        }}
      />
    </Paper>
  );
};

export default Terminal; 
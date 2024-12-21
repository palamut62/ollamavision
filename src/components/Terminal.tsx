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
  const [terminal, setTerminal] = useState<XTerm | null>(null);
  const [fitAddon, setFitAddon] = useState<FitAddon | null>(null);
  const commandBufferRef = useRef<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [height, setHeight] = useState(300);
  const dragStartRef = useRef<{ y: number; height: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      y: e.clientY,
      height: height
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;

    const windowHeight = window.innerHeight;
    const mouseY = e.clientY;
    const statusBarHeight = 22; // StatusBar yüksekliği
    const maxY = windowHeight - statusBarHeight;
    
    // Alt sınır sabit kalacak şekilde yükseklik hesaplama
    const bottomY = dragStartRef.current.y + dragStartRef.current.height;
    const newHeight = bottomY - mouseY;
    
    // Minimum ve maksimum yükseklik sınırları
    const constrainedHeight = Math.min(800, Math.max(200, newHeight));
    
    if (mouseY >= 0 && mouseY <= maxY - 200) { // En az 200px yükseklik kalacak şekilde
      setHeight(constrainedHeight);
      fitAddon?.fit();
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Consolas, monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
        selectionBackground: '#264f78',
      },
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

    term.write('Desktop Agent Terminal\r\n$ ');

    // Log mesajlarını dinle
    const unsubscribeLog = eventBus.on('terminal-log', (message: string) => {
      term.write(message);
      term.write('$ ');
    });

    term.onData((data) => {
      if (data === '\r') { // Enter tuşu
        const command = commandBufferRef.current.trim();
        if (command) {
          if (command === 'clear' || command === 'cls') {
            term.clear();
            term.write('$ ');
          } else {
            // Komutu çalıştır
            window.electronAPI.runCommand(command).then((output) => {
              term.write('\r\n' + output + '\r\n$ ');
              logger.info(`Command executed: ${command}`);
            }).catch((error) => {
              term.write('\r\n' + error + '\r\n$ ');
              logger.error(`Command failed: ${command} - ${error}`);
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

    // Başlangıç mesajı
    logger.info('Terminal started');

    return () => {
      window.removeEventListener('resize', handleResize);
      unsubscribeLog();
      term.dispose();
      logger.info('Terminal closed');
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
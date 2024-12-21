import React from 'react';
import { Box } from '@mui/material';
import Terminal from './Terminal';

interface TerminalManagerProps {
  isVisible: boolean;
  onClose: () => void;
}

const TerminalManager: React.FC<TerminalManagerProps> = ({ isVisible, onClose }) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: '22px', // StatusBar yüksekliği
        left: 0,
        right: 0,
        zIndex: 999,
        visibility: isVisible ? 'visible' : 'hidden',
      }}
    >
      {isVisible && (
        <Terminal
          onClose={onClose}
          onMinimize={onClose}
        />
      )}
    </Box>
  );
};

export default TerminalManager; 
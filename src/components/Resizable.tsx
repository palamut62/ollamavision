import React, { useState, useCallback, useEffect } from 'react';
import { Box } from '@mui/material';

interface ResizableProps {
  children: React.ReactNode;
  width: number;
  minWidth?: number;
  maxWidth?: number;
  onWidthChange?: (width: number) => void;
}

const Resizable: React.FC<ResizableProps> = ({
  children,
  width: initialWidth,
  minWidth = 200,
  maxWidth = 600,
  onWidthChange
}) => {
  const [width, setWidth] = useState(initialWidth);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const newWidth = e.clientX;
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setWidth(newWidth);
      onWidthChange?.(newWidth);
    }
  }, [isDragging, minWidth, maxWidth, onWidthChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: `${width}px`,
        minWidth: `${minWidth}px`,
        maxWidth: `${maxWidth}px`,
        height: '100%',
        transition: isDragging ? 'none' : 'width 0.2s',
      }}
    >
      {children}
      <Box
        onMouseDown={handleMouseDown}
        sx={{
          position: 'absolute',
          top: 0,
          right: -3,
          width: 6,
          height: '100%',
          cursor: 'col-resize',
          backgroundColor: 'transparent',
          '&:hover': {
            backgroundColor: 'primary.main',
            opacity: 0.2,
          },
          '&:active': {
            backgroundColor: 'primary.main',
            opacity: 0.4,
          },
          zIndex: 1000,
        }}
      />
    </Box>
  );
};

export default Resizable; 
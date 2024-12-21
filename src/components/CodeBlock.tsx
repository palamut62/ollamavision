import React, { useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-sql';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useTheme } from '@mui/material/styles';

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'python' }) => {
  const theme = useTheme();
  const codeRef = useRef<HTMLPreElement>(null);
  const isDarkMode = theme.palette.mode === 'dark';

  useEffect(() => {
    if (codeRef.current) {
      const cleanCode = code.replace(/^```\w*\n|\n```$/g, '');
      codeRef.current.textContent = cleanCode;
      Prism.highlightElement(codeRef.current);
    }
  }, [code, language]);

  const handleCopyClick = async () => {
    try {
      const cleanCode = code.replace(/^```\w*\n|\n```$/g, '');
      await navigator.clipboard.writeText(cleanCode);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <Box sx={{ 
      position: 'relative',
      my: 2,
      '&:hover .copy-button': {
        opacity: 1
      }
    }}>
      <IconButton
        onClick={handleCopyClick}
        className="copy-button"
        size="small"
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          opacity: 0,
          transition: 'opacity 0.2s',
          bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          '&:hover': {
            bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'
          }
        }}
      >
        <ContentCopyIcon sx={{ fontSize: 16 }} />
      </IconButton>
      <pre
        ref={codeRef}
        style={{
          margin: 0,
          padding: '1rem',
          borderRadius: '4px',
          backgroundColor: isDarkMode ? '#1e1e1e' : '#f5f5f5',
          overflow: 'auto'
        }}
      >
        <code className={`language-${language}`} />
      </pre>
    </Box>
  );
};

export default CodeBlock; 
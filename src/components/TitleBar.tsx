import React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import MinimizeIcon from '@mui/icons-material/Remove';
import MaximizeIcon from '@mui/icons-material/CropSquare';
import CloseIcon from '@mui/icons-material/Close';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import Tooltip from '@mui/material/Tooltip';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';

const TitleBar: React.FC = () => {
  const { user } = useAuthStore();
  const { mode, toggleTheme } = useThemeStore();

  return (
    <Box
      sx={{
        height: '30px',
        bgcolor: 'background.paper',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        WebkitAppRegion: 'drag',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
      }}
    >
      <Box sx={{ 
        pl: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <img 
          src="logo.png" 
          alt="Ollama Logo" 
          style={{ 
            width: '16px', 
            height: '16px',
            objectFit: 'contain'
          }} 
        />
        <Box sx={{ fontSize: '0.8rem' }}>Ollama Visualizer</Box>
      </Box>

      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: 2,
        pr: 1
      }}>
        {user && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.5,
            fontSize: '0.75rem',
            color: 'text.secondary'
          }}>
            <PersonOutlineIcon sx={{ fontSize: 16 }} />
            {user.username}
          </Box>
        )}

        <Box sx={{ 
          display: 'flex', 
          WebkitAppRegion: 'no-drag'
        }}>
          <Tooltip title={`Switch to ${mode === 'light' ? 'Dark' : 'Light'} Mode`}>
            <IconButton
              size="small"
              onClick={toggleTheme}
              sx={{ 
                borderRadius: 0, 
                height: '30px',
                width: '40px',
                '& .MuiSvgIcon-root': {
                  fontSize: '16px',
                  color: mode === 'light' ? 'text.primary' : '#ffd700'
                },
                '&:hover': {
                  '& .MuiSvgIcon-root': {
                    color: mode === 'light' ? 'primary.main' : '#ffeb3b'
                  }
                }
              }}
            >
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>
          <IconButton
            size="small"
            onClick={() => window.electronAPI.minimizeWindow()}
            sx={{ 
              borderRadius: 0, 
              height: '30px',
              width: '40px',
              '& .MuiSvgIcon-root': {
                fontSize: '16px'
              }
            }}
          >
            <MinimizeIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => window.electronAPI.maximizeWindow()}
            sx={{ 
              borderRadius: 0, 
              height: '30px',
              width: '40px',
              '& .MuiSvgIcon-root': {
                fontSize: '14px'
              }
            }}
          >
            <MaximizeIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => window.electronAPI.closeWindow()}
            sx={{ 
              borderRadius: 0, 
              height: '30px',
              width: '40px',
              '& .MuiSvgIcon-root': {
                fontSize: '16px'
              },
              '&:hover': {
                bgcolor: '#e81123'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default TitleBar;

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import { useAuthStore } from '@/store/authStore';
import { OllamaManager } from '@/services/OllamaManager';
import { eventBus } from '@/services/EventBus';
import SettingsDialog from './SettingsDialog';

const MenuBar: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<{
    [key: string]: HTMLElement | null;
  }>({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { logout } = useAuthStore();

  const handleClick = (event: React.MouseEvent<HTMLElement>, menuId: string) => {
    setAnchorEl(prev => ({
      ...prev,
      [menuId]: event.currentTarget
    }));
  };

  const handleClose = (menuId: string) => {
    setAnchorEl(prev => ({
      ...prev,
      [menuId]: null
    }));
  };

  const handleLogout = () => {
    logout();
    handleClose('file');
  };

  const handleRefreshModels = async () => {
    try {
      eventBus.emit('refresh-models');
    } catch (error) {
      console.error('Failed to refresh models:', error);
    }
    handleClose('view');
  };

  const handleOpenAbout = () => {
    eventBus.emit('open-about-dialog');
    handleClose('help');
  };

  const handleOpenOllamaWebsite = () => {
    window.electronAPI.openExternal('https://ollama.ai');
    handleClose('help');
  };

  const handleOpenSettings = () => {
    setSettingsOpen(true);
    handleClose('file');
  };

  const menuItems = {
    file: [
      { label: 'Settings', icon: <SettingsIcon fontSize="small" />, onClick: handleOpenSettings },
      { type: 'divider' },
      { label: 'Exit', icon: <LogoutIcon fontSize="small" />, onClick: handleLogout }
    ],
    view: [
      { label: 'Refresh Models', icon: <RefreshIcon fontSize="small" />, onClick: handleRefreshModels },
      { type: 'divider' },
      { label: 'Clear All Chats', icon: <DeleteIcon fontSize="small" /> }
    ],
    help: [
      { label: 'Ollama Website', onClick: handleOpenOllamaWebsite },
      { type: 'divider' },
      { label: 'About', icon: <InfoIcon fontSize="small" />, onClick: handleOpenAbout }
    ]
  };

  return (
    <>
      <Box sx={{ 
        height: '24px',
        bgcolor: 'background.paper',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        display: 'flex',
        alignItems: 'center',
        px: 1,
        fontSize: '0.8rem'
      }}>
        {Object.entries(menuItems).map(([menuId, items]) => (
          <React.Fragment key={menuId}>
            <Box
              onClick={(e) => handleClick(e, menuId)}
              sx={{
                px: 1,
                py: 0.5,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.08)'
                }
              }}
            >
              <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                {menuId}
              </Typography>
            </Box>
            <Menu
              anchorEl={anchorEl[menuId]}
              open={Boolean(anchorEl[menuId])}
              onClose={() => handleClose(menuId)}
              onClick={() => handleClose(menuId)}
              PaperProps={{
                sx: {
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                  minWidth: 180
                }
              }}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
            >
              {items.map((item, index) => (
                item.type === 'divider' ? (
                  <Divider key={`divider-${index}`} sx={{ my: 0.5 }} />
                ) : (
                  <MenuItem 
                    key={item.label}
                    onClick={item.onClick}
                    sx={{ 
                      py: 0.5,
                      fontSize: '0.85rem'
                    }}
                  >
                    {item.icon && (
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        {item.icon}
                      </ListItemIcon>
                    )}
                    <ListItemText>{item.label}</ListItemText>
                  </MenuItem>
                )
              ))}
            </Menu>
          </React.Fragment>
        ))}
      </Box>

      <SettingsDialog 
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
};

export default MenuBar; 
import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import Switch from '@mui/material/Switch';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageIcon from '@mui/icons-material/Storage';
import ComputerIcon from '@mui/icons-material/Computer';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import type { DetailedSystemInfo } from '@/types/electron';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import Alert from '@mui/material/Alert';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onClose }) => {
  const { mode, toggleTheme } = useThemeStore();
  const { user, updateProfile, updatePassword } = useAuthStore();
  const [systemInfo, setSystemInfo] = useState<DetailedSystemInfo | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadSystemInfo();
      // Profil bilgilerini yükle
      if (user) {
        setUsername(user.username);
        setEmail(user.email);
      }
    }
  }, [open, user]);

  const loadSystemInfo = async () => {
    try {
      const info = await window.electronAPI.getSystemInfo();
      setSystemInfo(info);
    } catch (error) {
      console.error('Failed to get system info:', error);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    // Reset error and success messages
    setError(null);
    setSuccess(null);
  };

  const handleProfileUpdate = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (!username.trim()) {
        setError('Kullanıcı adı boş olamaz');
        return;
      }

      const success = await updateProfile(username, email);
      if (success) {
        setSuccess('Profil başarıyla güncellendi');
      } else {
        setError('Profil güncellenirken bir hata oluştu');
      }
    } catch (error) {
      setError('Profil güncellenirken bir hata oluştu');
    }
  };

  const handlePasswordUpdate = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (!currentPassword || !newPassword || !confirmPassword) {
        setError('Tüm alanları doldurun');
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('Yeni şifreler eşleşmiyor');
        return;
      }

      if (newPassword.length < 6) {
        setError('Yeni şifre en az 6 karakter olmalıdır');
        return;
      }

      const success = await updatePassword(currentPassword, newPassword);
      if (success) {
        setSuccess('Şifre başarıyla güncellendi');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError('Mevcut şifre yanlış');
      }
    } catch (error) {
      setError('Şifre güncellenirken bir hata oluştu');
    }
  };

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 480,
          height: 'auto',
          maxHeight: 600,
          bgcolor: 'background.paper',
          '& .MuiDialog-paper': {
            margin: 0
          }
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        height: 56,
        p: '0 24px'
      }}>
        <Typography 
          component="span" 
          sx={{ 
            fontSize: 16,
            lineHeight: '24px',
            fontWeight: 500,
            color: 'text.primary'
          }}
        >
          Settings
        </Typography>
      </DialogTitle>

      <Tabs 
        value={activeTab} 
        onChange={handleTabChange}
        sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          minHeight: 42,
          px: 3,
          '& .MuiTab-root': {
            minHeight: 42,
            fontSize: '0.85rem',
            textTransform: 'none'
          }
        }}
      >
        <Tab label="Settings" />
        <Tab label="Profile" />
      </Tabs>

      <DialogContent sx={{ p: 0 }}>
        {activeTab === 0 ? (
          <List disablePadding>
            {/* Tema Ayarı */}
            <ListItem 
              sx={{ 
                height: 72,
                px: 3,
                py: 0
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {mode === 'light' ? (
                  <DarkModeIcon sx={{ 
                    color: 'text.primary',
                    fontSize: 20 
                  }} />
                ) : (
                  <LightModeIcon sx={{ 
                    color: '#ffd700',
                    fontSize: 20 
                  }} />
                )}
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontWeight: 500,
                      fontSize: 14,
                      lineHeight: '20px',
                      mb: 0.5
                    }}
                  >
                    {mode === 'light' ? 'Dark Mode' : 'Light Mode'}
                  </Typography>
                }
                secondary={
                  <Typography 
                    variant="body2" 
                    sx={{
                      color: 'text.secondary',
                      fontSize: 12,
                      lineHeight: '16px'
                    }}
                  >
                    {mode === 'light' 
                      ? 'Switch to dark theme for better eye comfort in low light conditions' 
                      : 'Switch to light theme for better visibility in bright conditions'
                    }
                  </Typography>
                }
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  checked={mode === 'dark'}
                  onChange={toggleTheme}
                  sx={{
                    width: 42,
                    height: 26,
                    padding: 0,
                    '& .MuiSwitch-switchBase': {
                      padding: 0,
                      margin: '2px',
                      '&.Mui-checked': {
                        transform: 'translateX(16px)',
                        color: mode === 'dark' ? '#ffd700' : 'primary.main',
                        '& + .MuiSwitch-track': {
                          backgroundColor: mode === 'dark' ? '#ffd700' : 'primary.main',
                          opacity: 1
                        }
                      }
                    },
                    '& .MuiSwitch-thumb': {
                      width: 22,
                      height: 22
                    },
                    '& .MuiSwitch-track': {
                      borderRadius: 13,
                      opacity: 0.3
                    }
                  }}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />

            {/* Sistem Bilgileri */}
            <ListItem sx={{ px: 3, py: 2 }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  color: 'text.secondary',
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                SYSTEM INFORMATION
              </Typography>
            </ListItem>

            {/* CPU Bilgisi */}
            {systemInfo && (
              <>
                <ListItem sx={{ px: 3, py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <MemoryIcon sx={{ fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontSize: 13 }}>
                        {systemInfo.cpu.model}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {systemInfo.cpu.cores} Cores @ {(systemInfo.cpu.speed / 1000).toFixed(2)} GHz
                      </Typography>
                    }
                  />
                </ListItem>

                {/* RAM Bilgisi */}
                <ListItem sx={{ px: 3, py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <StorageIcon sx={{ fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontSize: 13 }}>
                        Memory
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {formatBytes(systemInfo.memory.used)} Used / {formatBytes(systemInfo.memory.total)} Total
                      </Typography>
                    }
                  />
                </ListItem>

                {/* İşletim Sistemi Bilgisi */}
                <ListItem sx={{ px: 3, py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <ComputerIcon sx={{ fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontSize: 13 }}>
                        {systemInfo.os.platform} {systemInfo.os.arch}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {systemInfo.os.release} ({systemInfo.os.hostname})
                      </Typography>
                    }
                  />
                </ListItem>

                {/* Çalışma Süresi */}
                <ListItem sx={{ px: 3, py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <AccountTreeIcon sx={{ fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontSize: 13 }}>
                        System Uptime
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {formatUptime(systemInfo.os.uptime)}
                      </Typography>
                    }
                  />
                </ListItem>
              </>
            )}
          </List>
        ) : (
          <Box sx={{ p: 3 }}>
            {/* Profil Bilgileri */}
            <Typography 
              variant="subtitle2" 
              sx={{ 
                color: 'text.secondary',
                fontSize: 12,
                fontWeight: 600,
                mb: 2
              }}
            >
              PROFILE INFORMATION
            </Typography>

            {(error || success) && (
              <Alert 
                severity={error ? "error" : "success"} 
                sx={{ mb: 2, fontSize: '0.8rem' }}
              >
                {error || success}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              variant="contained"
              onClick={handleProfileUpdate}
              sx={{ mt: 2, mb: 3 }}
            >
              Update Profile
            </Button>

            <Divider sx={{ my: 2 }} />

            {/* Şifre Değiştirme */}
            <Typography 
              variant="subtitle2" 
              sx={{ 
                color: 'text.secondary',
                fontSize: 12,
                fontWeight: 600,
                mb: 2
              }}
            >
              CHANGE PASSWORD
            </Typography>

            <TextField
              fullWidth
              type={showCurrentPassword ? 'text' : 'password'}
              label="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              margin="normal"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      edge="end"
                    >
                      {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              type={showNewPassword ? 'text' : 'password'}
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              margin="normal"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                    >
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              type={showConfirmPassword ? 'text' : 'password'}
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              variant="contained"
              onClick={handlePasswordUpdate}
              sx={{ mt: 2 }}
            >
              Change Password
            </Button>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        borderTop: '1px solid',
        borderColor: 'divider',
        height: 64,
        p: '0 24px',
        justifyContent: 'flex-end'
      }}>
        <Button 
          onClick={onClose}
          variant="contained"
          sx={{ 
            minWidth: 100,
            height: 36,
            textTransform: 'none',
            fontSize: 14,
            fontWeight: 500
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog; 
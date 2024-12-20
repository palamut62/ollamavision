import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Alert from '@mui/material/Alert';
import { useAuthStore } from '@/store/authStore';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';

interface LoginFormProps {
  onLoginSuccess: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [tab, setTab] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, register, isLoading, error } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    const success = await (tab === 0 ? 
      login(username, password) : 
      register(username, password)
    );

    if (success) {
      onLoginSuccess();
    }
  };

  return (
    <Card 
      sx={{ 
        minWidth: 300, 
        maxWidth: 360,
        backgroundColor: 'background.paper',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        borderRadius: 1,
        overflow: 'hidden'
      }}
    >
      <Box sx={{ 
        p: 2, 
        textAlign: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        bgcolor: 'primary.dark'
      }}>
        <img 
          src="logo.png" 
          alt="Ollama Logo" 
          style={{ 
            width: '32px', 
            height: '32px',
            marginBottom: '8px'
          }} 
        />
        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
          Ollama Visualizer
        </Typography>
      </Box>

      <CardContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={tab} 
            onChange={(_, newValue) => setTab(newValue)}
            variant="fullWidth"
            sx={{
              minHeight: 36,
              '& .MuiTab-root': {
                fontSize: '0.8rem',
                minHeight: 36,
                textTransform: 'none'
              }
            }}
          >
            <Tab label="Sign In" />
            <Tab label="Sign Up" />
          </Tabs>
        </Box>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            margin="dense"
            size="small"
            disabled={isLoading}
            error={!username}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutlineIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '0.85rem',
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />
          
          <TextField
            fullWidth
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="dense"
            size="small"
            disabled={isLoading}
            error={!password}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '0.85rem',
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mt: 1,
                py: 0,
                fontSize: '0.75rem',
                '& .MuiAlert-icon': {
                  fontSize: '1rem'
                }
              }}
            >
              {error}
            </Alert>
          )}

          <Button
            fullWidth
            type="submit"
            variant="contained"
            sx={{ 
              mt: 2,
              py: 1,
              fontSize: '0.85rem',
              fontWeight: 500,
              textTransform: 'none',
              boxShadow: '0 2px 8px rgba(0, 122, 204, 0.25)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0, 122, 204, 0.35)',
              }
            }}
            disabled={isLoading || !username || !password}
          >
            {isLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              tab === 0 ? 'Sign In' : 'Sign Up'
            )}
          </Button>

          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block',
              textAlign: 'center',
              mt: 2,
              color: 'text.secondary',
              fontSize: '0.75rem'
            }}
          >
            {tab === 0 ? 
              'Need an account? Switch to Sign Up.' : 
              'Already have an account? Switch to Sign In.'}
          </Typography>
        </form>
      </CardContent>
    </Card>
  );
};

export default LoginForm; 
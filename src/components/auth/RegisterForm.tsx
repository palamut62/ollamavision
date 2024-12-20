import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { databaseService } from '../../services/DatabaseService';
import { useStore } from '../../store/useStore';

interface RegisterFormProps {
  onToggleForm: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleForm }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const setUser = useStore(state => state.setUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password || !confirmPassword) {
      setError('Tüm alanları doldurun');
      return;
    }

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    setIsLoading(true);
    try {
      const user = await databaseService.createUser(username, password);
      if (user) {
        setUser(user);
      } else {
        setError('Bu kullanıcı adı zaten kullanılıyor');
      }
    } catch (err) {
      setError('Kayıt olurken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card 
      sx={{ 
        minWidth: 300, 
        maxWidth: 400,
        backgroundColor: 'background.paper',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        borderRadius: 2,
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
            width: '48px', 
            height: '48px',
            marginBottom: '8px'
          }} 
        />
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          Ollama Visualizer'a Hoş Geldiniz
        </Typography>
      </Box>

      <CardContent>
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2,
                fontSize: '0.8rem',
                '& .MuiAlert-icon': {
                  fontSize: '1.2rem'
                }
              }}
            >
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Kullanıcı Adı"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            margin="normal"
            required
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutlineIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />

          <TextField
            fullWidth
            type="password"
            label="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />

          <TextField
            fullWidth
            type="password"
            label="Şifre Tekrar"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
            required
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={isLoading}
            sx={{ 
              mt: 3,
              mb: 1,
              py: 1.2,
              fontSize: '0.9rem',
              fontWeight: 500,
              textTransform: 'none',
              boxShadow: '0 2px 8px rgba(0, 122, 204, 0.25)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0, 122, 204, 0.35)',
              }
            }}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Kayıt Ol'
            )}
          </Button>

          <Button
            onClick={onToggleForm}
            variant="text"
            fullWidth
            disabled={isLoading}
            sx={{ 
              mt: 1,
              fontSize: '0.8rem',
              color: 'text.secondary',
              '&:hover': {
                color: 'primary.main'
              }
            }}
          >
            Zaten hesabınız var mı? Giriş yapın
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default RegisterForm;

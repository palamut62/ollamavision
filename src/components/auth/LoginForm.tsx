import React, { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { databaseService } from '../../services/DatabaseService';
import { useStore } from '../../store/useStore';

interface LoginFormProps {
  onToggleForm: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onToggleForm }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const setUser = useStore(state => state.setUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const user = await databaseService.loginUser(username, password);
      if (user) {
        setUser(user);
      } else {
        setError('Kullanıcı adı veya şifre hatalı');
      }
    } catch (err) {
      setError('Giriş yapılırken bir hata oluştu');
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        width: '100%',
        maxWidth: 400,
      }}
    >
      <Typography variant="h5" align="center" gutterBottom>
        Giriş Yap
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        label="Kullanıcı Adı"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        fullWidth
      />

      <TextField
        label="Şifre"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        fullWidth
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        sx={{ mt: 2 }}
      >
        Giriş Yap
      </Button>

      <Button
        onClick={onToggleForm}
        variant="text"
        fullWidth
        sx={{ mt: 1 }}
      >
        Hesabınız yok mu? Kayıt olun
      </Button>
    </Box>
  );
};

export default LoginForm;

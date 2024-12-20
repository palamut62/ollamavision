import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import RefreshIcon from '@mui/icons-material/Refresh';
import { OllamaManager } from '../services/OllamaManager';

const OllamaControlPanel: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const status = await OllamaManager.checkOllamaStatus();
      setIsRunning(status);
      setError(null);
    } catch (err) {
      setError('Ollama durumu kontrol edilemedi');
    } finally {
      setIsChecking(false);
    }
  };

  const startOllama = async () => {
    setIsChecking(true);
    try {
      const success = await OllamaManager.startOllama();
      if (success) {
        setIsRunning(true);
        setError(null);
      } else {
        setError('Ollama başlatılamadı');
      }
    } catch (err) {
      setError('Ollama başlatılırken hata oluştu');
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000); // Her 5 saniyede bir kontrol et
    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
      <Typography variant="h6" gutterBottom>
        Ollama Kontrol Paneli
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: isRunning ? 'success.main' : 'error.main',
            }}
          />
          <Typography>
            Durum: {isRunning ? 'Çalışıyor' : 'Durduruldu'}
          </Typography>
        </Box>

        {isChecking ? (
          <CircularProgress size={24} />
        ) : (
          <>
            <Button
              variant="contained"
              color={isRunning ? 'error' : 'success'}
              startIcon={isRunning ? <StopIcon /> : <PlayArrowIcon />}
              onClick={isRunning ? undefined : startOllama}
              disabled={isRunning}
            >
              {isRunning ? 'Durdur' : 'Başlat'}
            </Button>

            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={checkStatus}
            >
              Yenile
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
};

export default OllamaControlPanel;

import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircleIcon from '@mui/icons-material/Circle';
import IconButton from '@mui/material/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import InfoIcon from '@mui/icons-material/Info';
import LinkIcon from '@mui/icons-material/Link';
import WarningIcon from '@mui/icons-material/Warning';
import DownloadIcon from '@mui/icons-material/Download';
import Tooltip from '@mui/material/Tooltip';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Link from '@mui/material/Link';
import { eventBus } from '../services/EventBus';
import { OllamaManager } from '../services/OllamaManager';
import LinearProgress from '@mui/material/LinearProgress';
import CancelIcon from '@mui/icons-material/Cancel';
import TerminalIcon from '@mui/icons-material/Terminal';
import TerminalManager from './TerminalManager';
import { logger } from '../services/LogService';

const StatusBar: React.FC = () => {
  const [ollamaStatus, setOllamaStatus] = useState<'running' | 'stopped' | 'not-installed'>('stopped');
  const [isStarting, setIsStarting] = useState(false);
  const [modelCount, setModelCount] = useState(0);
  const [installDialogOpen, setInstallDialogOpen] = useState(false);
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, message: '', type: 'success' });
  const [downloadStatus, setDownloadStatus] = useState<{
    modelName: string;
    progress: number;
  } | null>(null);
  const [isTerminalVisible, setIsTerminalVisible] = useState(false);

  useEffect(() => {
    checkOllamaInstallation();
    const interval = setInterval(checkOllamaStatus, 5000);

    // About dialog event listener'ı ekle
    const unsubscribeAbout = eventBus.on('open-about-dialog', () => {
      setAboutDialogOpen(true);
    });

    // Download progress listener'ı ekle
    const unsubscribeDownload = eventBus.on('download-progress', (data) => {
      if (data === null) {
        setDownloadStatus(null);
        return;
      }
      const { modelName, progress } = data;
      setDownloadStatus({ modelName, progress });
    });

    return () => {
      clearInterval(interval);
      unsubscribeAbout();
      unsubscribeDownload();
    };
  }, []);

  const checkOllamaInstallation = async () => {
    try {
      // PowerShell komutu ile Ollama'nın kurulu olup olmadığını kontrol et
      const command = 'Get-Command ollama -ErrorAction SilentlyContinue';
      const result = await window.electronAPI.runCommand(command);
      
      if (!result) {
        setOllamaStatus('not-installed');
      } else {
        checkOllamaStatus();
      }
    } catch {
      setOllamaStatus('not-installed');
    }
  };

  const checkOllamaStatus = async () => {
    try {
      const isRunning = await window.electronAPI.checkOllamaStatus();
      setOllamaStatus(isRunning ? 'running' : 'stopped');
      
      if (isRunning) {
        // Model sayısını güncelle
        const models = await OllamaManager.listModels();
        setModelCount(models.length);
      }
      
      return isRunning;
    } catch {
      setOllamaStatus('stopped');
      return false;
    }
  };

  const waitForOllama = async (maxAttempts = 10): Promise<boolean> => {
    for (let i = 0; i < maxAttempts; i++) {
      const isRunning = await checkOllamaStatus();
      if (isRunning) {
        console.log('Ollama başarıyla başlatıldı');
        eventBus.emit('ollama-started');
        return true;
      }
      console.log(`Ollama bekleniyor... Deneme ${i + 1}/${maxAttempts}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return false;
  };

  const handleStartOllama = async () => {
    if (isStarting) return;
    
    setIsStarting(true);
    try {
      // Check current status first
      const currentStatus = await checkOllamaStatus();
      if (currentStatus) {
        const message = 'Ollama is already running!';
        setNotification({
          show: true,
          message,
          type: 'success'
        });
        logger.info(message);
        return;
      }

      // Try to start Ollama
      await window.electronAPI.startOllama();
      
      // Wait for Ollama to start
      const isRunning = await waitForOllama();
      
      if (isRunning) {
        const message = 'Ollama started successfully!';
        setNotification({
          show: true,
          message,
          type: 'success'
        });
        logger.success(message);
      } else {
        throw new Error('Failed to start Ollama or took too long');
      }
    } catch (error: any) {
      console.error('Failed to start Ollama:', error);
      const message = 'Failed to start Ollama. Please try starting it manually.';
      setNotification({
        show: true,
        message,
        type: 'error'
      });
      logger.error(message);
    } finally {
      setIsStarting(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  const handleOpenOllamaWebsite = () => {
    window.electronAPI.openExternal('https://ollama.ai');
  };

  const handleOpenDeveloperWebsite = () => {
    window.electronAPI.openExternal('https://umutcelik.online');
  };

  const handleCancelDownload = async () => {
    if (downloadStatus) {
      try {
        await OllamaManager.cancelDownload();
        setDownloadStatus(null);
        logger.info(`Download cancelled for model: ${downloadStatus.modelName}`);
      } catch (error: any) {
        logger.error(`Failed to cancel download: ${error.message}`);
      }
    }
  };

  const handleToggleTerminal = () => {
    setIsTerminalVisible(!isTerminalVisible);
  };

  return (
    <>
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column'
      }}>
        {downloadStatus && (
          <Box sx={{ 
            height: '22px', 
            width: '100%',
            bgcolor: 'background.paper',
            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 1,
              flex: 1
            }}>
              <DownloadIcon sx={{ fontSize: 14, color: 'primary.main' }} />
              <Typography variant="caption" sx={{ minWidth: 100 }}>
                {downloadStatus.modelName}
              </Typography>
              <Box sx={{ 
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <LinearProgress 
                  variant="determinate" 
                  value={downloadStatus.progress} 
                  sx={{
                    flex: 1,
                    height: 4,
                    borderRadius: 1,
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                    '& .MuiLinearProgress-bar': {
                      transition: 'transform 0.1s linear',
                      borderRadius: 1
                    }
                  }}
                />
                <Typography variant="caption" sx={{ minWidth: 45, textAlign: 'right' }}>
                  {downloadStatus.progress.toFixed(1)}%
                </Typography>
                <IconButton
                  size="small"
                  onClick={handleCancelDownload}
                  sx={{
                    padding: 0.5,
                    '&:hover': {
                      bgcolor: 'error.dark',
                      '& .MuiSvgIcon-root': {
                        color: 'white'
                      }
                    }
                  }}
                >
                  <CancelIcon sx={{ 
                    fontSize: 16, 
                    color: 'error.main',
                    transition: 'color 0.2s'
                  }} />
                </IconButton>
              </Box>
            </Box>
          </Box>
        )}
        <Box sx={{ 
          height: '22px',
          bgcolor: 'background.paper',
          borderTop: downloadStatus ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          alignItems: 'center',
          px: 2,
          gap: 2,
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CircleIcon 
                sx={{ 
                  fontSize: 8,
                  color: ollamaStatus === 'running' ? '#4caf50' : 
                         ollamaStatus === 'stopped' ? '#f44336' : '#ff9800'
                }} 
              />
              <Typography variant="caption">
                Ollama: {
                  ollamaStatus === 'running' ? 'Running' : 
                  ollamaStatus === 'stopped' ? 'Stopped' : 'Not Installed'
                }
              </Typography>
              {ollamaStatus === 'stopped' && (
                <Tooltip title="Start Ollama">
                  <IconButton
                    size="small"
                    onClick={handleStartOllama}
                    disabled={isStarting}
                    sx={{ 
                      ml: 1,
                      width: 16,
                      height: 16,
                      '& .MuiSvgIcon-root': {
                        fontSize: 14,
                        color: '#4caf50'
                      },
                      '&:hover .MuiSvgIcon-root': {
                        color: '#66bb6a'
                      }
                    }}
                  >
                    {isStarting ? (
                      <CircularProgress size={14} />
                    ) : (
                      <PlayArrowIcon />
                    )}
                  </IconButton>
                </Tooltip>
              )}
              {ollamaStatus === 'not-installed' && (
                <>
                  <WarningIcon 
                    sx={{ 
                      fontSize: 14, 
                      color: 'warning.main',
                      ml: 1
                    }} 
                  />
                  <Typography 
                    variant="caption" 
                    color="warning.main"
                    sx={{ ml: 0.5 }}
                  >
                    Ollama not installed
                  </Typography>
                  <Tooltip title="Download Ollama">
                    <IconButton
                      size="small"
                      onClick={handleOpenOllamaWebsite}
                      sx={{ 
                        ml: 1,
                        width: 16,
                        height: 16,
                        '& .MuiSvgIcon-root': {
                          fontSize: 14
                        }
                      }}
                    >
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>

            {ollamaStatus === 'running' && (
              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                Loaded Models: {modelCount}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Terminal">
              <IconButton
                size="small"
                onClick={handleToggleTerminal}
                sx={{ 
                  width: 16,
                  height: 16,
                  '& .MuiSvgIcon-root': {
                    fontSize: 14
                  }
                }}
              >
                <TerminalIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Developer">
              <IconButton
                size="small"
                onClick={handleOpenDeveloperWebsite}
                sx={{ 
                  width: 16,
                  height: 16,
                  '& .MuiSvgIcon-root': {
                    fontSize: 14
                  }
                }}
              >
                <LinkIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="About">
              <IconButton
                size="small"
                onClick={() => setAboutDialogOpen(true)}
                sx={{ 
                  width: 16,
                  height: 16,
                  '& .MuiSvgIcon-root': {
                    fontSize: 14
                  }
                }}
              >
                <InfoIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      <Dialog 
        open={installDialogOpen} 
        onClose={() => setInstallDialogOpen(false)}
      >
        <DialogTitle>
          Ollama Not Installed
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Ollama is not installed on your system. You need to install Ollama to use this application.
          </Typography>
          <Typography variant="body2">
            You can download and install Ollama from the official website.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInstallDialogOpen(false)}>
            Close
          </Button>
          <Button 
            onClick={handleOpenOllamaWebsite} 
            variant="contained" 
            color="primary"
          >
            Go to Ollama Website
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={aboutDialogOpen} 
        onClose={() => setAboutDialogOpen(false)}
      >
        <DialogTitle>
          About Ollama Visualizer
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Version: 1.0.0
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            This application is a user interface designed to manage and interact with Ollama models.
          </Typography>
          <Typography variant="body2">
            Developer: palamut62
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAboutDialogOpen(false)}>
            Close
          </Button>
          <Button 
            onClick={handleOpenDeveloperWebsite} 
            variant="contained" 
            color="primary"
          >
            Developer
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={notification.show} 
        autoHideDuration={3000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.type} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      <TerminalManager 
        isVisible={isTerminalVisible} 
        onClose={() => setIsTerminalVisible(false)} 
      />
    </>
  );
};

export default StatusBar;

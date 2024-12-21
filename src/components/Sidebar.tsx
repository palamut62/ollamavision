import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Delete';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import type { ModelInfo, SystemInfo } from '../types/electron';
import { useChatStore } from '../store/chatStore';
import { eventBus } from '../services/EventBus';
import { OllamaManager } from '../services/OllamaManager';
import { logger } from '../services/LogService';
import DownloadIcon from '@mui/icons-material/Download';
import CodeIcon from '@mui/icons-material/Code';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import ImageIcon from '@mui/icons-material/Image';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageIcon from '@mui/icons-material/Storage';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Resizable from './Resizable';

// Model tipini belirle
const getModelType = (modelName: string): 'code' | 'vision' | 'text' => {
  const lowerName = modelName.toLowerCase();
  
  if (lowerName.includes('code') || 
      lowerName.includes('starcoder') || 
      lowerName.includes('deepseek-coder') ||
      lowerName.includes('wizard-coder') ||
      lowerName.includes('phind')) {
    return 'code';
  }
  
  if (lowerName.includes('vision') || 
      lowerName.includes('llava') ||
      lowerName.includes('bakllava') ||
      lowerName.includes('cogvlm')) {
    return 'vision';
  }
  
  return 'text';
};

// Model ikonunu getir
const getModelIcon = (modelName: string) => {
  const type = getModelType(modelName);
  
  switch (type) {
    case 'code':
      return <CodeIcon sx={{ fontSize: 20 }} />;
    case 'vision':
      return <ImageIcon sx={{ fontSize: 20 }} />;
    case 'text':
      return <TextFieldsIcon sx={{ fontSize: 20 }} />;
  }
};

interface SystemInfoState {
  cpuUsage?: number;
  totalMemory?: number;
  freeMemory?: number;
  usedMemory?: number;
}

const Sidebar: React.FC = () => {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfoState | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Performans metriklerini hesaplama
  const calculatePerformanceMetrics = React.useMemo(() => {
    return (modelSize: number | undefined, systemInfo: any) => {
      if (!modelSize || !systemInfo) {
        return { ramScore: 0, cpuScore: 0, totalScore: 0 };
      }

      const totalRam = systemInfo?.memory?.total || 0;
      const cpuCores = systemInfo?.cpu?.cores || 0;

      // RAM skoru hesaplama
      let ramScore = 0;
      if (totalRam > 0) {
        const ramGB = totalRam / (1024 * 1024 * 1024);
        const modelGB = modelSize / (1024 * 1024 * 1024);
        const ramUsageRatio = modelGB / (ramGB * 0.7);
        ramScore = Math.max(0, Math.min(100, (1 - Math.pow(ramUsageRatio, 1.5)) * 100));
      }

      // CPU skoru hesaplama
      const cpuScore = Math.min(100, ((cpuCores / 4) * 50) + (cpuCores >= 8 ? 30 : 0) + (cpuCores >= 16 ? 20 : 0));

      // Toplam skor
      const totalScore = Math.round((ramScore * 0.75 + cpuScore * 0.25));

      return { ramScore, cpuScore, totalScore };
    };
  }, []);

  const { 
    selectedModel,
    setSelectedModel,
    clearMessages
  } = useChatStore();

  useEffect(() => {
    // İlk yükleme
    fetchModels();

    // Ollama başlatıldığında modelleri güncelle
    const unsubscribeOllama = eventBus.on('ollama-started', () => {
      logger.info('Ollama started, updating models');
      fetchModels();
    });

    // Model yenileme eventi için listener ekle
    const unsubscribeRefresh = eventBus.on('refresh-models', () => {
      logger.info('Refreshing models');
      fetchModels();
    });

    // İndirme ilerlemesi için listener ekle
    const unsubscribeDownload = eventBus.on('download-progress', (data) => {
      if (data === null) {
        setDownloadProgress({});
      } else {
        const { modelName, progress } = data;
        setDownloadProgress(prev => ({
          ...prev,
          [modelName]: progress
        }));
      }
    });

    // Sistem bilgilerini al
    const loadSystemInfo = async () => {
      try {
        const detailedInfo = await window.electronAPI.getSystemInfo();
        const systemInfo = {
          cpuUsage: 0, // CPU kullanımı ayrı bir event ile geliyor
          totalMemory: detailedInfo.memory.total,
          freeMemory: detailedInfo.memory.free,
          usedMemory: detailedInfo.memory.used
        };
        setSystemInfo(systemInfo);
      } catch (error) {
        console.error('Failed to get system info:', error);
      }
    };

    // Sistem bilgilerini dinle
    const removeSystemInfoListener = window.electronAPI.onSystemInfo((info: SystemInfo) => {
      setSystemInfo(prev => {
        // CPU kullanımı -1 ise önceki değeri koru
        const cpuUsage = info.cpuUsage && info.cpuUsage >= 0 ? info.cpuUsage : prev?.cpuUsage;
        
        return {
          ...prev,
          cpuUsage,
          totalMemory: info.totalMemory,
          freeMemory: info.freeMemory
        };
      });
    });

    // İlk yükleme
    loadSystemInfo();

    // Periyodik güncelleme
    const systemInfoInterval = setInterval(loadSystemInfo, 5000);

    return () => {
      clearInterval(systemInfoInterval);
      unsubscribeOllama();
      unsubscribeRefresh();
      unsubscribeDownload();
      removeSystemInfoListener();
    };
  }, []);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const isRunning = await window.electronAPI.checkOllamaStatus();
      
      if (!isRunning) {
        setModels([]);
        return;
      }

      const models = await OllamaManager.getAllModels();
      
      // Modelleri sırala: Önce yüklü olanlar, sonra diğerleri
      const sortedModels = models.sort((a, b) => {
        if (a.isInstalled && !b.isInstalled) return -1;
        if (!a.isInstalled && b.isInstalled) return 1;
        return a.name.localeCompare(b.name);
      });
      
      setModels(sortedModels);
    } catch (error: any) {
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>, modelName: string) => {
    e.stopPropagation();
    setModelToDelete(modelName);
    setDeleteDialogOpen(true);
    logger.info('Preparing to delete model');
  };

  const handleDeleteConfirm = async () => {
    if (!modelToDelete) return;

    setIsDeleting(true);
    try {
      const success = await OllamaManager.deleteModel(modelToDelete);
      if (success) {
        logger.success('Model deleted successfully');
        // If the deleted model was selected, clear it
        if (selectedModel === modelToDelete) {
          setSelectedModel(null);
          clearMessages();
        }
        // Refresh model list
        await fetchModels();
      } else {
        logger.error('Failed to delete model');
      }
    } catch (error: any) {
      logger.error('Error deleting model');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setModelToDelete(null);
    }
  };

  const formatBytes = (bytes: number | undefined) => {
    if (!bytes) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  };

  const handleModelSelect = async (modelName: string) => {
    // If same model is selected, cancel
    if (selectedModel === modelName) return;

    logger.info('Selecting model');
    // Clear previous chat
    clearMessages();
    
    // Select new model
    setSelectedModel(modelName);
  };

  const handleDownloadClick = async (e: React.MouseEvent<HTMLButtonElement>, modelName: string) => {
    e.stopPropagation();
    
    // If already downloading, cancel it
    if (downloadProgress[modelName] !== undefined) {
      try {
        await OllamaManager.cancelDownload();
        setDownloadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[modelName];
          return newProgress;
        });
        logger.info('Download cancelled');
      } catch (error: any) {
        logger.error('Failed to cancel download');
      }
      return;
    }

    try {
      logger.info('Starting model download');
      const success = await OllamaManager.downloadModel(modelName);
      if (success) {
        logger.success('Model downloaded successfully');
        // Refresh model list
        await fetchModels();
      }
    } catch (error: any) {
      logger.error('Failed to download model');
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[modelName];
        return newProgress;
      });
    }
  };

  const handleCancelDownload = async (e: React.MouseEvent, modelName: string) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Cancelling download for:', modelName);
    await OllamaManager.cancelDownload();
    setDownloadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[modelName];
      return newProgress;
    });
  };

  // Modelleri filtrele
  const filteredModels = models.filter(model => 
    model.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Resizable width={250} minWidth={200} maxWidth={400}>
      <Box sx={{ 
        height: '100%',
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            MODELS
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              ),
              sx: {
                fontSize: '0.8rem',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.12)'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.2)'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main'
                }
              }
            }}
          />
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : filteredModels.length === 0 ? (
          <Box sx={{ 
            p: 2, 
            textAlign: 'center',
            color: 'text.secondary'
          }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {models.length === 0 ? 'No models available' : 'No models found'}
            </Typography>
            {models.length === 0 && (
              <Typography variant="caption">
                Make sure Ollama is running
              </Typography>
            )}
          </Box>
        ) : (
          <List sx={{ flex: 1, overflow: 'auto' }} dense>
            {filteredModels.map((model) => (
              <ListItem 
                key={model.name} 
                disablePadding
                secondaryAction={
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={(e) => handleDeleteClick(e, model.name)}
                    sx={{ 
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      '&:hover': { 
                        color: 'error.main' 
                      }
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                }
                sx={{
                  '&:hover .MuiIconButton-root': {
                    opacity: 1
                  }
                }}
              >
                <ListItemButton
                  selected={selectedModel === model.name}
                  onClick={() => handleModelSelect(model.name)}
                  sx={{
                    '&.Mui-selected': {
                      bgcolor: 'primary.dark',
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {getModelIcon(model.name)}
                  </ListItemIcon>
                  <ListItemText 
                    primary={model.name}
                    secondary={
                      <Box component="div" sx={{ mt: 0.5 }}>
                        <Box component="div" sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1
                        }}>
                          <Typography 
                            component="div"
                            variant="caption" 
                            sx={{ 
                              color: 'text.secondary',
                              fontSize: '0.7rem',
                              minWidth: 'fit-content'
                            }}
                          >
                            {formatBytes(model.size)}
                          </Typography>
                        </Box>
                      </Box>
                    }
                    primaryTypographyProps={{ 
                      variant: 'body2',
                      component: 'div',
                      sx: { 
                        fontWeight: selectedModel === model.name ? 'bold' : 'normal'
                      }
                    }}
                    secondaryTypographyProps={{
                      component: 'div'
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}

        <Box sx={{ 
          p: 2, 
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          bgcolor: 'background.paper'
        }}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            SYSTEM INFO
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <MemoryIcon sx={{ mr: 1, fontSize: 20 }} />
            <Typography variant="body2">
              CPU: {systemInfo?.cpuUsage !== undefined && systemInfo.cpuUsage >= 0 
                ? `${systemInfo.cpuUsage.toFixed(1)}%` 
                : 'Calculating...'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <StorageIcon sx={{ mr: 1, fontSize: 20 }} />
            <Typography variant="body2">
              RAM: {systemInfo ? `${formatBytes(systemInfo.freeMemory)} free of ${formatBytes(systemInfo.totalMemory)}` : 'N/A'}
            </Typography>
          </Box>
        </Box>

        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>
            Delete Model
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2">
              Are you sure you want to delete {modelToDelete}? This will remove the model from your computer.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setDeleteDialogOpen(false)} 
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteConfirm} 
              color="error" 
              disabled={isDeleting}
            >
              {isDeleting ? (
                <CircularProgress size={20} />
              ) : (
                'Delete'
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Resizable>
  );
};

export default Sidebar;

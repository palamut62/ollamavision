import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CircularProgress from '@mui/material/CircularProgress';
import { OllamaManager, ModelInfo } from '../services/OllamaManager';
import { useStore } from '../store/useStore';

const ModelManager: React.FC = () => {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [pulling, setPulling] = useState(false);
  const { selectedModel, setSelectedModel } = useStore();

  const loadModels = async () => {
    setLoading(true);
    try {
      const modelList = await OllamaManager.listModels();
      setModels(modelList);
    } catch (error) {
      console.error('Model listesi yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const handleDeleteModel = async (modelName: string) => {
    if (window.confirm(`${modelName} modelini silmek istediğinizden emin misiniz?`)) {
      try {
        const success = await OllamaManager.deleteModel(modelName);
        if (success) {
          if (selectedModel === modelName) {
            setSelectedModel('');
          }
          await loadModels();
        }
      } catch (error) {
        console.error('Model silinemedi:', error);
      }
    }
  };

  const handlePullModel = async () => {
    if (!newModelName.trim()) return;

    setPulling(true);
    try {
      const success = await OllamaManager.pullModel(newModelName);
      if (success) {
        setOpenDialog(false);
        setNewModelName('');
        await loadModels();
      }
    } catch (error) {
      console.error('Model indirilemedi:', error);
    } finally {
      setPulling(false);
    }
  };

  const formatSize = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  };

  return (
    <Box>
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        <Typography variant="h6">Modeller</Typography>
        <Button
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          variant="contained"
          size="small"
        >
          Model Ekle
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <List>
          {models.map((model) => (
            <ListItem
              key={model.name}
              button
              selected={selectedModel === model.name}
              onClick={() => setSelectedModel(model.name)}
            >
              <ListItemText
                primary={model.name}
                secondary={`Boyut: ${formatSize(model.size)} • Güncelleme: ${new Date(model.modified_at).toLocaleDateString()}`}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => handleDeleteModel(model.name)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Yeni Model Ekle</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Model Adı"
            fullWidth
            variant="outlined"
            value={newModelName}
            onChange={(e) => setNewModelName(e.target.value)}
            disabled={pulling}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={pulling}>
            İptal
          </Button>
          <Button
            onClick={handlePullModel}
            variant="contained"
            disabled={!newModelName.trim() || pulling}
          >
            {pulling ? <CircularProgress size={24} /> : 'İndir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ModelManager;

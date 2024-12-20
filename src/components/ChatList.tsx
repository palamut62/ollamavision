import React, { useState } from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import ChatIcon from '@mui/icons-material/Chat';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { useChatStore } from '../store/chatStore';
import { formatDate } from '../utils/dateUtils';

interface ChatListProps {
  modelName: string;
  onClose?: () => void;
}

const ChatList: React.FC<ChatListProps> = ({ modelName, onClose }) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  const { 
    chats, 
    selectedChatId,
    createNewChat,
    selectChat,
    deleteChat,
    setIsChatOpen,
    setSelectedModel
  } = useChatStore();

  // Seçili modele ait sohbetleri filtrele
  const modelChats = chats.filter(chat => chat.modelName === modelName);

  const handleNewChat = () => {
    if (!modelName) return;
    createNewChat(modelName);
  };

  const handleDeleteClick = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    setChatToDelete(chatId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (chatToDelete) {
      await deleteChat(chatToDelete);
      if (modelChats.length <= 1) {
        setIsChatOpen(false);
      }
    }
    setDeleteDialogOpen(false);
    setChatToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setChatToDelete(null);
  };

  const handleClose = () => {
    setIsChatOpen(false);
    setSelectedModel(null);
    if (onClose) onClose();
  };

  return (
    <Box sx={{ 
      width: 250, 
      bgcolor: 'background.paper',
      borderRight: '1px solid rgba(255, 255, 255, 0.12)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Box sx={{ 
        p: 2, 
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="subtitle2" color="primary">
          CHATS
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton 
            size="small" 
            onClick={handleNewChat}
            sx={{ 
              width: 24, 
              height: 24,
              '& .MuiSvgIcon-root': { fontSize: 16 }
            }}
          >
            <AddIcon />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={handleClose}
            sx={{ 
              width: 24, 
              height: 24,
              '& .MuiSvgIcon-root': { fontSize: 16 }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <List sx={{ flex: 1, overflow: 'auto' }} dense>
        {modelChats.length === 0 ? (
          <Box sx={{ 
            p: 2, 
            textAlign: 'center',
            color: 'text.secondary',
            fontSize: '0.8rem'
          }}>
            No chats yet.
            <br />
            Click the + button to start a new chat.
          </Box>
        ) : (
          modelChats.map((chat) => (
            <ListItem 
              key={chat.id} 
              disablePadding
              secondaryAction={
                <IconButton 
                  edge="end" 
                  size="small"
                  onClick={(e) => handleDeleteClick(e, chat.id)}
                  sx={{ 
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    '&:hover': { 
                      color: 'error.main' 
                    }
                  }}
                >
                  <DeleteIcon sx={{ fontSize: 18 }} />
                </IconButton>
              }
              sx={{
                '&:hover .MuiIconButton-root': {
                  opacity: 1
                }
              }}
            >
              <ListItemButton
                selected={selectedChatId === chat.id}
                onClick={() => selectChat(chat.id)}
                sx={{
                  '&.Mui-selected': {
                    bgcolor: 'primary.dark',
                  }
                }}
              >
                <ChatIcon sx={{ mr: 1, fontSize: 20 }} />
                <ListItemText
                  primary={chat.title || 'New Chat'}
                  secondary={formatDate(chat.createdAt)}
                  primaryTypographyProps={{ 
                    variant: 'body2',
                    sx: { 
                      fontWeight: selectedChatId === chat.id ? 'bold' : 'normal',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }
                  }}
                  secondaryTypographyProps={{ 
                    variant: 'caption',
                    sx: { fontSize: '0.7rem' }
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))
        )}
      </List>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Chat
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete this chat? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatList; 
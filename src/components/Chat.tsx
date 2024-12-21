import React, { useState, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import CircularProgress from '@mui/material/CircularProgress';
import { useChatStore } from '../store/chatStore';
import { OllamaManager } from '../services/OllamaManager';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

interface FormattedResponse {
  description: string;
  code: string;
  list: string[];
  table: string[][];
}

const Chat: React.FC = () => {
  const { 
    selectedModel,
    selectedChatId,
    chats,
    addMessageToChat,
    setIsChatOpen,
    setSelectedModel
  } = useChatStore();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedChat = chats.find(chat => chat.id === selectedChatId);
  const messages = selectedChat?.messages || [];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const renderFormattedResponse = (content: string) => {
    try {
      const response = JSON.parse(content) as FormattedResponse;
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2,
          width: '100%'
        }}>
          {/* Açıklama */}
          {response.description && (
            <Typography 
              variant="body1" 
              sx={{ whiteSpace: 'pre-wrap' }}
            >
              {response.description}
            </Typography>
          )}

          {/* Kod */}
          {response.code && (
            <Box sx={{ 
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Box sx={{ 
                p: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                bgcolor: 'background.default'
              }}>
                <Typography variant="caption" color="text.secondary">
                  Python
                </Typography>
                <Typography 
                  variant="caption" 
                  onClick={() => {
                    const code = response.code.replace(/^```python\s*|\s*```$/g, '').trim();
                    navigator.clipboard.writeText(code);
                  }}
                  sx={{ 
                    cursor: 'pointer',
                    color: 'text.secondary',
                    '&:hover': { color: 'primary.main' }
                  }}
                >
                  Kopyala
                </Typography>
              </Box>
              <Box sx={{ 
                p: 2,
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                whiteSpace: 'pre-wrap',
                overflowX: 'auto',
                bgcolor: 'background.paper'
              }}>
                <code>
                  {response.code.replace(/^```python\s*|\s*```$/g, '').trim()}
                </code>
              </Box>
            </Box>
          )}

          {/* Liste */}
          {response.list && response.list.length > 0 && (
            <Box component="ul" sx={{ pl: 3, m: 0 }}>
              {response.list.map((item, index) => (
                <li key={index}>
                  <Typography variant="body1">{item}</Typography>
                </li>
              ))}
            </Box>
          )}

          {/* Tablo */}
          {response.table && response.table.length > 0 && (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {response.table[0].map((header, index) => (
                      <TableCell key={index} sx={{ fontWeight: 600 }}>
                        {header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {response.table.slice(1).map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      );
    } catch (error) {
      return (
        <Typography variant="body1">
          {content}
        </Typography>
      );
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedModel || !selectedChatId || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Add user message
      await addMessageToChat(selectedChatId, { 
        role: 'user', 
        content: userMessage 
      });

      // Get AI response
      const response = await OllamaManager.generateResponse(
        selectedModel,
        userMessage,
        messages.map(m => m.content)
      );

      // Add AI response
      await addMessageToChat(selectedChatId, { 
        role: 'assistant', 
        content: response 
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      await addMessageToChat(selectedChatId, { 
        role: 'assistant', 
        content: JSON.stringify({
          description: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
          code: "",
          list: [],
          table: []
        })
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClose = () => {
    setIsChatOpen(false);
    setSelectedModel(null);
  };

  if (!selectedChat) {
    return null;
  }

  return (
    <Box sx={{ 
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      p: 2
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2
      }}>
        <Typography variant="h6">
          {selectedChat.title}
        </Typography>
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

      <Box sx={{ 
        flex: 1,
        overflow: 'auto',
        mb: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}>
        {messages.map((message, index) => (
          <Box
            key={index}
            sx={{
              p: 2,
              borderRadius: 2,
              maxWidth: '80%',
              alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
              bgcolor: message.role === 'user' ? 'primary.dark' : 'background.paper',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            {message.role === 'user' ? (
              <Typography variant="body1">{message.content}</Typography>
            ) : (
              renderFormattedResponse(message.content)
            )}
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>

      <Box sx={{ 
        display: 'flex',
        gap: 1,
        alignItems: 'flex-start'
      }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Bir mesaj yazın..."
          disabled={isLoading}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'background.paper'
            }
          }}
        />
        <IconButton 
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          color="primary"
          sx={{ 
            p: '10px',
            position: 'relative',
            width: 40,
            height: 40,
            '&.Mui-disabled': {
              bgcolor: 'action.disabledBackground'
            }
          }}
        >
          {isLoading ? (
            <CircularProgress
              size={24}
              sx={{
                color: 'primary.main',
                position: 'absolute'
              }}
            />
          ) : (
            <SendIcon />
          )}
        </IconButton>
      </Box>
    </Box>
  );
};

export default Chat;

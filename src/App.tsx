import React, { useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import GlobalStyles from '@mui/material/GlobalStyles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import TitleBar from '@/components/TitleBar';
import MenuBar from '@/components/MenuBar';
import Sidebar from '@/components/Sidebar';
import ChatList from '@/components/ChatList';
import StatusBar from '@/components/StatusBar';
import Chat from '@/components/Chat';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import LoginForm from '@/components/LoginForm';

const App: React.FC = () => {
  const { 
    selectedModel, 
    isChatOpen,
    loadChats 
  } = useChatStore();

  const { isLoggedIn } = useAuthStore();
  const { mode } = useThemeStore();

  const theme = createTheme({
    palette: {
      mode,
      background: {
        default: mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
        paper: mode === 'dark' ? '#252526' : '#ffffff',
      },
      primary: {
        main: '#007acc',
      },
    },
    typography: {
      fontFamily: '"Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
      fontSize: 12,
      h1: { fontSize: '1.8rem' },
      h2: { fontSize: '1.6rem' },
      h3: { fontSize: '1.4rem' },
      h4: { fontSize: '1.2rem' },
      h5: { fontSize: '1.1rem' },
      h6: { fontSize: '1rem' },
      subtitle1: { fontSize: '0.9rem' },
      subtitle2: { fontSize: '0.8rem' },
      body1: { fontSize: '0.85rem' },
      body2: { fontSize: '0.8rem' },
      button: { fontSize: '0.8rem' },
      caption: { fontSize: '0.7rem' },
      overline: { fontSize: '0.7rem' }
    },
    components: {
      MuiTextField: {
        defaultProps: {
          size: 'small'
        }
      },
      MuiButton: {
        defaultProps: {
          size: 'small'
        }
      },
      MuiIconButton: {
        defaultProps: {
          size: 'small'
        }
      }
    }
  });

  useEffect(() => {
    if (isLoggedIn) {
      loadChats();
    }
  }, [isLoggedIn, loadChats]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          '*': {
            transition: 'background-color 0.2s, color 0.2s, border-color 0.2s'
          },
          '*::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
            backgroundColor: 'transparent'
          },
          '*::-webkit-scrollbar-thumb': {
            backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            borderRadius: '4px',
            transition: 'background-color 0.2s',
            '&:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'
            }
          },
          '*::-webkit-scrollbar-track': {
            backgroundColor: 'transparent'
          },
          '*::-webkit-scrollbar-corner': {
            backgroundColor: 'transparent'
          }
        }}
      />
      <Box sx={{ 
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <TitleBar />
        {isLoggedIn && <MenuBar />}
        {isLoggedIn ? (
          <Box sx={{ 
            flex: 1,
            display: 'flex',
            overflow: 'hidden'
          }}>
            <Sidebar />
            {selectedModel && <ChatList modelName={selectedModel} />}
            {isChatOpen && <Chat />}
          </Box>
        ) : (
          <Box sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <LoginForm onLoginSuccess={() => {}} />
          </Box>
        )}
        <StatusBar />
      </Box>
    </ThemeProvider>
  );
};

export default App;

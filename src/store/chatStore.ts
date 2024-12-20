import { create } from 'zustand';
import type { ChatMessage } from '../services/OllamaManager';
import { databaseService, type Chat } from '../services/DatabaseService';
import { OllamaManager } from '../services/OllamaManager';

interface ChatState {
  selectedModel: string | null;
  selectedChatId: string | null;
  chats: Chat[];
  isChatOpen: boolean;
  
  // Model seçimi
  setSelectedModel: (model: string | null) => void;
  
  // Chat yönetimi
  createNewChat: (modelName: string) => Promise<void>;
  selectChat: (chatId: string) => void;
  deleteChat: (chatId: string) => Promise<void>;
  addMessageToChat: (chatId: string, message: ChatMessage) => Promise<void>;
  loadChats: () => Promise<void>;
  clearMessages: () => void;
  
  // UI durumu
  setIsChatOpen: (isOpen: boolean) => void;
}

// Başlık oluşturma yardımcı fonksiyonu
const generateTitle = (content: string): string => {
  // Mesajı kısalt ve başlık olarak kullan
  const maxLength = 50;
  let title = content.split('\n')[0].trim(); // İlk satırı al
  
  // Başlığı kısalt
  if (title.length > maxLength) {
    title = title.substring(0, maxLength) + '...';
  }
  
  return title;
};

export const useChatStore = create<ChatState>((set, get) => ({
  selectedModel: null,
  selectedChatId: null,
  chats: [],
  isChatOpen: false,

  setSelectedModel: async (model) => {
    const currentModel = get().selectedModel;
    
    // Eğer önceki model varsa ve yeni model farklıysa, önceki modeli kapat
    if (currentModel && currentModel !== model) {
      await OllamaManager.shutdownModel(currentModel);
    }

    // Sadece model seçimini güncelle, yeni sohbet oluşturma
    set({ selectedModel: model });
  },

  createNewChat: async (modelName) => {
    try {
      const chat = await databaseService.createChat(modelName);
      if (chat) {
        set(state => ({
          chats: [chat, ...state.chats],
          selectedChatId: chat.id,
          isChatOpen: true
        }));
      }
    } catch (error) {
      console.error('Yeni sohbet oluşturulamadı:', error);
      set({ selectedModel: null, isChatOpen: false });
    }
  },

  addMessageToChat: async (chatId, message) => {
    try {
      const savedMessage = await databaseService.addMessage(chatId, message.role, message.content);
      if (savedMessage) {
        const chat = get().chats.find(c => c.id === chatId);
        
        // Eğer bu kullanıcının ilk mesajı ise başlığı güncelle
        if (chat && message.role === 'user') {
          const messages = await databaseService.getMessages(chatId);
          const userMessages = messages.filter(m => m.role === 'user');
          
          // Eğer bu ilk kullanıcı mesajı ise
          if (userMessages.length <= 1) {
            const title = generateTitle(message.content);
            await databaseService.updateChatTitle(chatId, title);
            
            set(state => ({
              chats: state.chats.map(c => 
                c.id === chatId 
                  ? { 
                      ...c, 
                      title: title,
                      messages: [...(c.messages || []), message] 
                    }
                  : c
              )
            }));
            return;
          }
        }

        // Normal mesaj ekleme
        set(state => ({
          chats: state.chats.map(c => 
            c.id === chatId 
              ? { ...c, messages: [...(c.messages || []), message] }
              : c
          )
        }));
      }
    } catch (error) {
      console.error('Mesaj kaydedilemedi:', error);
    }
  },

  selectChat: async (chatId) => {
    try {
      const messages = await databaseService.getMessages(chatId);
      set(state => ({
        selectedChatId: chatId,
        isChatOpen: true,
        chats: state.chats.map(chat => 
          chat.id === chatId ? { ...chat, messages } : chat
        )
      }));
    } catch (error) {
      console.error('Sohbet mesajları yüklenemedi:', error);
    }
  },

  loadChats: async () => {
    try {
      const chats = await databaseService.getChats();
      set({ chats });
    } catch (error) {
      console.error('Sohbetler yüklenemedi:', error);
    }
  },

  clearMessages: () => {
    set(state => ({
      chats: state.chats.map(chat => ({
        ...chat,
        messages: []
      }))
    }));
  },

  setIsChatOpen: (isOpen) => set({ isChatOpen: isOpen }),

  deleteChat: async (chatId: string) => {
    try {
      const success = await databaseService.deleteChat(chatId);
      if (success) {
        // Eğer silinen chat seçili ise, seçimi kaldır
        if (get().selectedChatId === chatId) {
          set({ selectedChatId: null, isChatOpen: false });
        }
        
        // Chat listesinden sil
        set(state => ({
          chats: state.chats.filter(chat => chat.id !== chatId)
        }));
      }
    } catch (error) {
      console.error('Sohbet silinemedi:', error);
    }
  },
})); 
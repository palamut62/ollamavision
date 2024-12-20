import { DatabaseService as DB } from '../db/database';
import type { ChatMessage } from './OllamaManager';
import type { DBChat } from '../db/database';
import { supabase } from '@/lib/supabase';

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface Chat {
  id: string;
  userId: string;
  modelName: string;
  title: string;
  createdAt: string;
  messages?: ChatMessage[];
}

class DatabaseService {
  private db: DB;
  private currentUser: User | null = null;

  constructor() {
    this.db = new DB();
  }

  async loginUser(username: string, password: string): Promise<User | null> {
    try {
      const user = await this.db.loginUser(username, password);
      if (user) {
        this.currentUser = {
          id: user.id,
          username: user.username,
          email: user.email
        };
      }
      return this.currentUser;
    } catch (error) {
      console.error('Failed to sign in:', error);
      return null;
    }
  }

  async createUser(username: string, password: string): Promise<User | null> {
    try {
      const user = await this.db.createUser(username, password);
      if (user) {
        this.currentUser = {
          id: user.id,
          username: user.username,
          email: user.email
        };
      }
      return this.currentUser;
    } catch (error) {
      console.error('Failed to create user:', error);
      return null;
    }
  }

  async createChat(modelName: string): Promise<Chat | null> {
    if (!this.currentUser) {
      console.error('User not signed in');
      return null;
    }

    try {
      const result = await this.db.createChat(this.currentUser.id, modelName);
      if (!result) return null;
      
      return {
        id: result.id,
        userId: result.user_id,
        modelName: result.model_name,
        title: result.title || 'New Chat',
        createdAt: result.created_at,
        messages: []
      };
    } catch (error) {
      console.error('Failed to create chat:', error);
      return null;
    }
  }

  async getChats(): Promise<Chat[]> {
    if (!this.currentUser) {
      console.error('User not signed in');
      return [];
    }

    try {
      const chats = await this.db.getChats(this.currentUser.id);
      return chats.map(chat => ({
        id: chat.id,
        userId: chat.user_id,
        modelName: chat.model_name,
        title: chat.title || 'New Chat',
        createdAt: chat.created_at,
        messages: []
      }));
    } catch (error) {
      console.error('Failed to get chats:', error);
      return [];
    }
  }

  async getMessages(chatId: string): Promise<ChatMessage[]> {
    try {
      const messages = await this.db.getMessages(chatId);
      return messages.map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content
      }));
    } catch (error) {
      console.error('Failed to get messages:', error);
      return [];
    }
  }

  async addMessage(chatId: string, role: string, content: string): Promise<ChatMessage | null> {
    try {
      const result = await this.db.addMessage(chatId, role, content);
      if (!result) return null;

      return {
        role: result.role as 'system' | 'user' | 'assistant',
        content: result.content
      };
    } catch (error) {
      console.error('Failed to add message:', error);
      return null;
    }
  }

  async updateChatTitle(chatId: string, title: string): Promise<boolean> {
    try {
      await this.db.updateChatTitle(chatId, title);
      return true;
    } catch (error) {
      console.error('Failed to update chat title:', error);
      return false;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  async deleteChat(chatId: string): Promise<boolean> {
    try {
      return await this.db.deleteChat(chatId);
    } catch (error) {
      console.error('Failed to delete chat:', error);
      return false;
    }
  }

  async updateProfile(userId: string, username: string, email: string): Promise<User | null> {
    try {
      // Önce kullanıcı adının başkası tarafından kullanılıp kullanılmadığını kontrol et
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .neq('id', userId)
        .single();

      if (existingUser) {
        console.error('Username is already taken');
        return null;
      }

      // Kullanıcı bilgilerini güncelle
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({ username, email })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Failed to update profile:', error);
        return null;
      }

      // Mevcut kullanıcı bilgilerini güncelle
      if (updatedUser) {
        this.currentUser = {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email
        };
      }

      return this.currentUser;
    } catch (error) {
      console.error('Failed to update profile:', error);
      return null;
    }
  }

  async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      // Mevcut şifreyi kontrol et
      const { data: user } = await supabase
        .from('users')
        .select('password')
        .eq('id', userId)
        .single();

      if (!user) {
        console.error('User not found');
        return false;
      }

      const isValid = await window.electronAPI.comparePassword(currentPassword, user.password);
      if (!isValid) {
        console.error('Current password is incorrect');
        return false;
      }

      // Yeni şifreyi hashle
      const hashedPassword = await window.electronAPI.hashPassword(newPassword);

      // Şifreyi güncelle
      const { error } = await supabase
        .from('users')
        .update({ password: hashedPassword })
        .eq('id', userId);

      if (error) {
        console.error('Failed to update password:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to update password:', error);
      return false;
    }
  }
}

export const databaseService = new DatabaseService();

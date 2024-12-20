import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export interface DBUser {
  id: string;
  email: string;
  username: string;
  password: string;
  created_at: string;
}

export interface DBChat {
  id: string;
  user_id: string;
  model_name: string;
  title: string;
  created_at: string;
}

export interface DBMessage {
  id: string;
  chat_id: string;
  role: string;
  content: string;
  created_at: string;
}

export class DatabaseService {
  async createUser(username: string, password: string): Promise<DBUser | null> {
    try {
      // Check username
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();

      if (existingUser) {
        console.error('Username is already taken');
        return null;
      }

      // Hash password
      const hashedPassword = await window.electronAPI.hashPassword(password);
      const email = `${username}@temp.com`;
      const userId = uuidv4();

      // Insert into users table
      const { data: userData, error: dbError } = await supabase
        .from('users')
        .insert([{
          id: userId,
          email,
          username,
          password: hashedPassword
        }])
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        return null;
      }

      return userData;
    } catch (error) {
      console.error('Failed to create user:', error);
      return null;
    }
  }

  async loginUser(username: string, password: string): Promise<DBUser | null> {
    try {
      // Find user
      const { data: user, error } = await supabase
        .from('users')
        .select()
        .eq('username', username)
        .single();

      if (error || !user) {
        console.error('User not found');
        return null;
      }

      // Check password
      const isValid = await window.electronAPI.comparePassword(password, user.password);
      if (!isValid) {
        console.error('Invalid password');
        return null;
      }

      return user;
    } catch (error) {
      console.error('Failed to sign in:', error);
      return null;
    }
  }

  async createChat(userId: string, modelName: string): Promise<DBChat | null> {
    try {
      const { data, error } = await supabase
        .from('chats')
        .insert([{ user_id: userId, model_name: modelName, title: 'New Chat' }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to create chat:', error);
      return null;
    }
  }

  async getChats(userId: string): Promise<DBChat[]> {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select()
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get chats:', error);
      return [];
    }
  }

  async getMessages(chatId: string): Promise<DBMessage[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select()
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get messages:', error);
      return [];
    }
  }

  async addMessage(chatId: string, role: string, content: string): Promise<DBMessage | null> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{ chat_id: chatId, role, content }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to add message:', error);
      return null;
    }
  }

  async updateChatTitle(chatId: string, title: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chats')
        .update({ title })
        .eq('id', chatId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update chat title:', error);
    }
  }

  async deleteChat(chatId: string): Promise<boolean> {
    try {
      // Delete messages first
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('chat_id', chatId);

      if (messagesError) throw messagesError;

      // Then delete chat
      const { error: chatError } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);

      if (chatError) throw chatError;

      return true;
    } catch (error) {
      console.error('Failed to delete chat:', error);
      return false;
    }
  }
}

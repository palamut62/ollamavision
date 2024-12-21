import { eventBus } from './EventBus';
import { logger } from './LogService';
import type { ModelInfo } from '../types/electron';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class OllamaManager {
  private static readonly API_URL = 'http://127.0.0.1:11434/api';
  private static readonly DEFAULT_SYSTEM_MESSAGE = 'Sen bir Python programlama uzmanısın. Yanıtlarını aşağıdaki formatta vermelisin:\n\n' +
    'Yanıtını JSON formatında ver ve şu alanları kullan:\n' +
    '- description: Ana açıklama metni\n' +
    '- code: Varsa kod örneği (```python ile başla```)\n' +
    '- list: Varsa liste maddeleri (her madde - ile başlamalı)\n' +
    '- table: Varsa tablo verileri (başlık satırı gerekli)\n\n' +
    'Örnek:\n' +
    '{"description": "Açıklama metni", "code": "```python\\nprint(\'Örnek\')\\n```", "list": ["- Madde 1"], "table": [["Başlık"], ["Değer"]]}';

  private static isDownloading = false;
  private static currentModelName: string | null = null;

  static async startOllama(): Promise<boolean> {
    try {
      return await window.electronAPI.startOllama();
    } catch (error) {
      console.error('Failed to start Ollama:', error);
      return false;
    }
  }

  static async checkOllamaStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_URL}/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  static async listModels(): Promise<ModelInfo[]> {
    try {
      const models = await window.electronAPI.listModels();
      logger.info('Retrieved installed models list');
      return models;
    } catch (error: any) {
      logger.error(`Failed to list models: ${error.message}`);
      return [];
    }
  }

  static async getAvailableModels(): Promise<ModelInfo[]> {
    const defaultModels = [
      { name: 'llama2', description: 'Meta\'s Llama 2 model' },
      { name: 'codellama', description: 'Meta\'s Code Llama model' },
      { name: 'mistral', description: 'Mistral AI 7B model' },
      { name: 'mixtral', description: 'Mistral AI\'s Mixtral 8x7B model' },
      { name: 'neural-chat', description: 'Intel\'s neural chat model' },
      { name: 'phi', description: 'Microsoft\'s Phi-2 model' }
    ];

    return defaultModels.map(model => ({
      name: model.name,
      description: model.description,
      size: 0,
      digest: '',
      modified_at: new Date().toISOString(),
      isInstalled: false
    }));
  }

  static async getAllModels(): Promise<ModelInfo[]> {
    try {
      // Yüklü modelleri al
      const response = await fetch('http://127.0.0.1:11434/api/tags');
      if (!response.ok) throw new Error('Failed to fetch models');
      const data = await response.json() as { models: ModelInfo[] };
      const installedModels = data.models || [];

      // Model açıklamalarını ekle
      const modelsWithDescriptions = installedModels.map(model => ({
        ...model,
        description: model.name,
        isInstalled: true
      }));

      // Modelleri alfabetik sırala
      return modelsWithDescriptions.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error listing models:', error);
      return [];
    }
  }

  static async shutdownModel(modelName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_URL}/show`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: modelName,
          command: 'stop'
        }),
      });

      if (response.ok) {
        console.log(`${modelName} modeli kapatıldı`);
        if (this.currentModelName === modelName) {
          this.currentModelName = null;
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error(`${modelName} modeli kapatılırken hata:`, error);
      return false;
    }
  }

  static async deleteModel(modelName: string): Promise<boolean> {
    try {
      const response = await fetch(`http://127.0.0.1:11434/api/delete`, {
        method: 'DELETE',
        body: JSON.stringify({ name: modelName }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete model');
      }

      logger.success(`Model ${modelName} deleted successfully`);
      return true;
    } catch (error: any) {
      logger.error(`Failed to delete model ${modelName}: ${error.message}`);
      return false;
    }
  }

  static async downloadModel(modelName: string): Promise<boolean> {
    if (this.isDownloading) {
      logger.warning('Another model is currently being downloaded');
      return false;
    }

    this.isDownloading = true;
    this.currentModelName = modelName;
    logger.info(`Starting download of model: ${modelName}`);

    try {
      const response = await fetch(`http://127.0.0.1:11434/api/pull`, {
        method: 'POST',
        body: JSON.stringify({ name: modelName }),
      });

      if (!response.ok) {
        throw new Error('Failed to start model download');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        const lines = text.split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            
            if (data.status === 'success') {
              logger.success(`Model ${modelName} downloaded successfully`);
              eventBus.emit('download-progress', null);
              return true;
            }

            if (data.total && data.completed) {
              const progress = (data.completed / data.total) * 100;
              eventBus.emit('download-progress', {
                modelName,
                progress
              });
            }

            if (data.error) {
              throw new Error(data.error);
            }
          } catch (error) {
            if (error instanceof SyntaxError) continue;
            throw error;
          }
        }
      }

      return true;
    } catch (error: any) {
      logger.error(`Failed to download model ${modelName}: ${error.message}`);
      return false;
    } finally {
      this.isDownloading = false;
      this.currentModelName = null;
      eventBus.emit('download-progress', null);
    }
  }

  static async cancelDownload(): Promise<void> {
    if (!this.isDownloading || !this.currentModelName) {
      logger.warning('No active download to cancel');
      return;
    }

    try {
      await this.deleteModel(this.currentModelName);
      logger.info(`Download cancelled for model: ${this.currentModelName}`);
    } catch (error: any) {
      logger.error(`Failed to cancel download: ${error.message}`);
    } finally {
      this.isDownloading = false;
      this.currentModelName = null;
      eventBus.emit('download-progress', null);
    }
  }

  static async generateResponse(model: string, prompt: string, context: string[] = []): Promise<string> {
    try {
      if (this.currentModelName && this.currentModelName !== model) {
        await this.shutdownModel(this.currentModelName);
      }
      this.currentModelName = model;

      const messages: ChatMessage[] = [
        { role: 'system', content: this.DEFAULT_SYSTEM_MESSAGE },
        ...context.map((msg, index) => ({
          role: index % 2 === 0 ? 'user' as const : 'assistant' as const,
          content: msg
        })),
        { role: 'user', content: prompt }
      ];

      const response = await fetch(`${this.API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
          }
        }),
      });

      if (!response.ok) {
        throw new Error('API yanıt vermedi');
      }

      const data = await response.json();
      let content = data.message?.content || '';

      // JSON formatını bul ve temizle
      content = content.replace(/```json\s*|\s*```/g, '');
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        try {
          const parsedContent = JSON.parse(jsonMatch[0]);
          
          // Kod bloğunu düzelt
          if (parsedContent.code) {
            parsedContent.code = parsedContent.code
              .replace(/\\n/g, '\n')
              .replace(/^```python\s*|\s*```$/g, '')
              .trim();
            parsedContent.code = '```python\n' + parsedContent.code + '\n```';
          }

          // Liste öğelerini düzelt
          if (Array.isArray(parsedContent.list)) {
            parsedContent.list = parsedContent.list.map((item: string) => 
              item.startsWith('- ') ? item : '- ' + item
            );
          }

          return JSON.stringify({
            description: parsedContent.description || '',
            code: parsedContent.code || '',
            list: Array.isArray(parsedContent.list) ? parsedContent.list : [],
            table: Array.isArray(parsedContent.table) ? parsedContent.table : []
          }, null, 2);
        } catch (error) {
          console.error('JSON parse hatası:', error);
        }
      }

      // JSON parse edilemezse veya bulunamazsa
      return JSON.stringify({
        description: content,
        code: '',
        list: [],
        table: []
      }, null, 2);

    } catch (error) {
      console.error('Yanıt üretilemedi:', error);
      return JSON.stringify({
        description: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
        code: '',
        list: [],
        table: []
      }, null, 2);
    }
  }
}

import { eventBus } from './EventBus';
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

  private static currentModel: string | null = null;
  private static downloadController: AbortController | null = null;

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
      const response = await fetch(`${this.API_URL}/tags`);
      if (!response.ok) throw new Error('Failed to get model list');
      
      const data = await response.json();
      return (data.models || []).map((model: any) => ({
        name: model.name,
        size: model.size || 0,
        digest: model.digest || '',
        modified_at: model.modified_at || new Date().toISOString(),
        isInstalled: true
      }));
    } catch (error) {
      console.error('Failed to get model list:', error);
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
      const isRunning = await this.checkOllamaStatus();
      if (!isRunning) {
        console.log('Ollama is not running, returning empty model list');
        return [];
      }

      const installedModels = await this.listModels();
      const installedNames = new Set(installedModels.map(m => m.name));

      const availableModels = await this.getAvailableModels();
      const allModels = availableModels.map(model => ({
        ...model,
        isInstalled: installedNames.has(model.name)
      }));

      installedModels.forEach(model => {
        if (!allModels.some(m => m.name === model.name)) {
          allModels.push({
            ...model,
            isInstalled: true
          });
        }
      });

      return allModels.sort((a, b) => {
        if (a.isInstalled && !b.isInstalled) return -1;
        if (!a.isInstalled && b.isInstalled) return 1;
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error('Failed to get all models:', error);
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
        if (this.currentModel === modelName) {
          this.currentModel = null;
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
      // Önce modeli kapat
      await this.shutdownModel(modelName);

      const response = await fetch(`${this.API_URL}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: modelName }),
      });

      return response.ok;
    } catch (error) {
      console.error('Model silinemedi:', error);
      return false;
    }
  }

  static async downloadModel(modelName: string): Promise<boolean> {
    try {
      // Eğer zaten indirme varsa, iptal et
      if (this.downloadController) {
        await this.cancelDownload();
        return false;
      }

      // İndirme başlangıcını bildir
      console.log(`Starting download for model: ${modelName}`);
      eventBus.emit('download-progress', { modelName, progress: 0 });
      
      // İndirmeyi başlat
      const success = await this.pullModel(modelName, (progress) => {
        console.log(`Download progress for ${modelName}: ${progress}%`);
        eventBus.emit('download-progress', { modelName, progress });
      });

      if (!success) {
        console.log(`Download failed or cancelled for model: ${modelName}`);
        eventBus.emit('download-progress', null);
        return false;
      }

      // İndirme başarılı olduğunda biraz bekle ve progress'i temizle
      console.log(`Download completed for model: ${modelName}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      eventBus.emit('download-progress', null);
      return true;
    } catch (error) {
      console.error('Failed to download model:', error);
      eventBus.emit('download-progress', null);
      return false;
    }
  }

  static async cancelDownload() {
    if (this.downloadController) {
      console.log('Cancelling download...');
      
      try {
        // Önce mevcut indirmeyi iptal et
        this.downloadController.abort();
        
        // İptal edildiğinde progress'i hemen temizle
        eventBus.emit('download-progress', null);
        
        // Ollama API'sine iptal isteği gönder
        const response = await fetch(`${this.API_URL}/pull`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'cancel'
          })
        });

        if (!response.ok) {
          throw new Error('Failed to send cancel request to Ollama API');
        }

        console.log('Download cancelled successfully');
      } catch (error) {
        console.error('Error cancelling download:', error);
        throw error;
      } finally {
        this.downloadController = null;
      }
    }
  }

  static async pullModel(modelName: string, onProgress?: (progress: number) => void): Promise<boolean> {
    try {
      // Create new abort controller
      this.downloadController = new AbortController();
      const signal = this.downloadController.signal;

      // İptal edildiğinde reject edecek bir promise oluştur
      const abortPromise = new Promise((_, reject) => {
        signal.addEventListener('abort', () => {
          reject(new Error('Download cancelled'));
        });
      });

      // Fetch işlemini bir promise'a dönüştür
      const fetchPromise = fetch(`${this.API_URL}/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: modelName,
          stream: true
        }),
        signal
      });

      // Her iki promise'ı da race ettir
      const response = await Promise.race([fetchPromise, abortPromise]) as Response;

      if (!response.body) {
        eventBus.emit('download-progress', null);
        return false;
      }

      const reader = response.body.getReader();

      try {
        while (true) {
          // Her okuma işleminde iptal kontrolü yap
          if (signal.aborted) {
            await reader.cancel();
            eventBus.emit('download-progress', null);
            return false;
          }

          const { done, value } = await reader.read();
          if (done) break;

          const text = new TextDecoder().decode(value);
          const lines = text.split('\n').filter(Boolean);

          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              
              if (data.status === 'pulling manifest') {
                onProgress?.(1);
                eventBus.emit('download-progress', { modelName, progress: 1 });
              }
              else if (data.total && data.completed) {
                const progress = Math.min(95, Math.round((data.completed / data.total) * 100));
                onProgress?.(progress);
                eventBus.emit('download-progress', { modelName, progress });
              }
              else if (data.status === 'success') {
                onProgress?.(100);
                eventBus.emit('download-progress', { modelName, progress: 100 });
                await new Promise(resolve => setTimeout(resolve, 1000));
                eventBus.emit('download-progress', null);
                return true;
              }
              else if (data.error) {
                console.error('Download error:', data.error);
                eventBus.emit('download-progress', null);
                return false;
              }
            } catch (e) {
              console.error('Error parsing progress:', e);
            }
          }
        }
      } finally {
        // Reader'ı temizle
        await reader.cancel();
        if (signal.aborted) {
          eventBus.emit('download-progress', null);
        }
      }

      return true;
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message === 'Download cancelled') {
        console.log('Download cancelled');
        eventBus.emit('download-progress', null);
        return false;
      }
      console.error('Failed to pull model:', error);
      eventBus.emit('download-progress', null);
      return false;
    } finally {
      this.downloadController = null;
    }
  }

  static async generateResponse(model: string, prompt: string, context: string[] = []): Promise<string> {
    try {
      if (this.currentModel && this.currentModel !== model) {
        await this.shutdownModel(this.currentModel);
      }
      this.currentModel = model;

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

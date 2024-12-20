const OLLAMA_API = 'http://localhost:11434/api';

export interface ModelInfo {
  name: string;
  size: number;
  digest: string;
}

export class OllamaService {
  static async getModels(): Promise<ModelInfo[]> {
    try {
      const response = await fetch(`${OLLAMA_API}/tags`);
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Model listesi alınamadı:', error);
      return [];
    }
  }

  static async generateResponse(model: string, prompt: string): Promise<string> {
    try {
      const response = await fetch(`${OLLAMA_API}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
        }),
      });

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Yanıt üretilemedi:', error);
      throw new Error('Model yanıt üretemedi. Lütfen tekrar deneyin.');
    }
  }

  static async deleteModel(model: string): Promise<void> {
    try {
      await fetch(`${OLLAMA_API}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: model }),
      });
    } catch (error) {
      console.error('Model silinemedi:', error);
      throw new Error('Model silinemedi. Lütfen tekrar deneyin.');
    }
  }

  static async checkStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${OLLAMA_API}/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

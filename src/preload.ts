import { contextBridge, ipcRenderer } from 'electron';
import { DetailedSystemInfo, ModelInfo, SystemInfo } from './types/electron';

// Electron API'sini window nesnesine ekle
contextBridge.exposeInMainWorld('electronAPI', {
  // Sistem bilgileri
  getSystemInfo: () => ipcRenderer.invoke('get-system-info') as Promise<DetailedSystemInfo>,
  checkOllamaStatus: () => ipcRenderer.invoke('check-ollama-status'),
  onSystemInfo: (callback: (info: SystemInfo) => void) => {
    const listener = (_: any, info: SystemInfo) => callback(info);
    ipcRenderer.on('system-info', listener);
    return () => {
      ipcRenderer.removeListener('system-info', listener);
    };
  },

  // Ollama yönetimi
  startOllama: () => ipcRenderer.invoke('start-ollama'),
  listModels: () => ipcRenderer.invoke('list-models') as Promise<ModelInfo[]>,

  // Terminal komutları
  runCommand: (command: string) => ipcRenderer.invoke('run-command', command) as Promise<string>
}); 
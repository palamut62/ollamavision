import { contextBridge, ipcRenderer } from 'electron';
import { DetailedSystemInfo, ModelInfo, SystemInfo } from './types/electron';

// Electron API'sini window nesnesine ekle
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    on: (channel: string, func: (...args: any[]) => void) => {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
    removeListener: (channel: string, func: (...args: any[]) => void) => {
      ipcRenderer.removeListener(channel, (event, ...args) => func(...args));
    }
  }
});

// Mevcut electronAPI'yi güncelle
contextBridge.exposeInMainWorld('electronAPI', {
  getSystemInfo: () => ipcRenderer.invoke('get-system-info') as Promise<DetailedSystemInfo>,
  checkOllamaStatus: () => ipcRenderer.invoke('check-ollama-status'),
  onSystemInfo: (callback: (info: SystemInfo) => void) => {
    const listener = (_: any, info: SystemInfo) => callback(info);
    ipcRenderer.on('system-info', listener);
    return () => {
      ipcRenderer.removeListener('system-info', listener);
    };
  },
  startOllama: () => ipcRenderer.invoke('start-ollama'),
  listModels: () => ipcRenderer.invoke('list-models') as Promise<ModelInfo[]>
}); 
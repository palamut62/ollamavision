import { contextBridge, ipcRenderer, shell } from 'electron';
import type { SystemInfo, ElectronAPI } from '../src/types/electron';

const electronAPI: ElectronAPI = {
  // Pencere kontrolleri
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  
  // Sistem bilgileri
  onSystemInfo: (callback: (data: SystemInfo) => void) => {
    const wrappedCallback = (_event: any, value: SystemInfo) => callback(value);
    ipcRenderer.on('system-info', wrappedCallback);
    return () => {
      ipcRenderer.removeListener('system-info', wrappedCallback);
    };
  },
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  
  // Ollama yönetimi
  startOllama: () => ipcRenderer.invoke('start-ollama'),
  listModels: () => ipcRenderer.invoke('ollama-list-models'),
  checkOllamaStatus: () => ipcRenderer.invoke('ollama-check-status'),

  // Şifreleme işlemleri
  hashPassword: (password: string) => ipcRenderer.invoke('hash-password', password),
  comparePassword: (password: string, hash: string) => ipcRenderer.invoke('compare-password', password, hash),

  // Terminal komutları
  runCommand: (command: string) => ipcRenderer.invoke('run-command', command),

  // Harici bağlantılar
  openExternal: (url: string) => shell.openExternal(url)
};

// Tip kontrolü yap
const api: ElectronAPI = electronAPI;

contextBridge.exposeInMainWorld('electronAPI', api);

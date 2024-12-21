import { IpcRenderer } from 'electron';

export interface SystemInfo {
  cpuUsage?: number;
  totalMemory?: number;
  freeMemory?: number;
}

export interface DetailedSystemInfo {
  cpu: {
    model: string;
    speed: number;
    cores: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
  };
  os: {
    platform: string;
    arch: string;
    hostname: string;
    release: string;
    username: string;
    uptime: number;
  };
  network: any;
}

export interface ModelInfo {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
  description?: string;
  isInstalled?: boolean;
  tags?: string[];
}

export interface ElectronAPI {
  // Pencere kontrolleri
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  
  // Sistem bilgileri
  onSystemInfo: (callback: (data: SystemInfo) => void) => () => void;
  getSystemInfo: () => Promise<DetailedSystemInfo>;
  
  // Ollama yönetimi
  startOllama: () => Promise<boolean>;
  listModels: () => Promise<ModelInfo[]>;
  checkOllamaStatus: () => Promise<boolean>;

  // Şifreleme işlemleri
  hashPassword: (password: string) => Promise<string>;
  comparePassword: (password: string, hash: string) => Promise<boolean>;

  // Terminal komutları
  runCommand: (command: string) => Promise<string>;

  // Harici bağlantılar
  openExternal: (url: string) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: {
      // Sistem bilgileri
      getSystemInfo: () => Promise<DetailedSystemInfo>;
      checkOllamaStatus: () => Promise<boolean>;
      onSystemInfo: (callback: (info: SystemInfo) => void) => (() => void);

      // Ollama yönetimi
      startOllama: () => Promise<boolean>;
      listModels: () => Promise<ModelInfo[]>;

      // Terminal komutları
      runCommand: (command: string) => Promise<string>;
    };
  }
}

export {}; 
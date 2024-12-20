import { app, BrowserWindow, ipcMain, session } from 'electron';
import * as path from 'path';
import * as isDev from 'electron-is-dev';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as bcrypt from 'bcrypt';
import fetch from 'node-fetch-commonjs';

const execAsync = promisify(exec);
const SALT_ROUNDS = 10;
const OLLAMA_API = 'http://127.0.0.1:11434/api';

// GPU hızlandırmayı devre dışı bırak
app.disableHardwareAcceleration();

let mainWindow: BrowserWindow | null = null;
let ollamaProcess: string | null = null;
let systemInfoInterval: NodeJS.Timeout | null = null;

let lastCpuInfo = os.cpus();
let lastCpuInfoTime = Date.now();

function getCpuUsage(): number {
  const currentCpuInfo = os.cpus();
  const currentTime = Date.now();
  const timeDifference = currentTime - lastCpuInfoTime;

  let totalUsage = 0;

  for (let i = 0; i < currentCpuInfo.length; i++) {
    const currentCore = currentCpuInfo[i];
    const lastCore = lastCpuInfo[i];

    const currentTotal = Object.values(currentCore.times).reduce((a, b) => a + b, 0);
    const lastTotal = Object.values(lastCore.times).reduce((a, b) => a + b, 0);

    const totalDiff = currentTotal - lastTotal;
    const idleDiff = currentCore.times.idle - lastCore.times.idle;

    const usage = (1 - idleDiff / totalDiff) * 100;
    totalUsage += usage;
  }

  lastCpuInfo = currentCpuInfo;
  lastCpuInfoTime = currentTime;

  return totalUsage / currentCpuInfo.length;
}

// Ollama işlemini bul ve sonlandır
async function killOllama() {
  try {
    if (process.platform === 'win32') {
      // Windows'ta ollama.exe işlemini bul ve sonlandır
      await execAsync('taskkill /F /IM ollama.exe', { shell: 'powershell.exe' });
      console.log('Ollama başarıyla kapatıldı');
    } else {
      // Linux/Mac için
      await execAsync('pkill ollama');
      console.log('Ollama başarıyla kapatıldı');
    }
  } catch (error) {
    console.error('Ollama kapatılırken hata:', error);
  }
}

// Uygulama kaynaklarını temizle
function cleanup() {
  if (systemInfoInterval) {
    clearInterval(systemInfoInterval);
    systemInfoInterval = null;
  }
  mainWindow = null;
}

// Şifreleme işlemleri
ipcMain.handle('hash-password', async (_event, password: string) => {
  return bcrypt.hash(password, SALT_ROUNDS);
});

ipcMain.handle('compare-password', async (_event, password: string, hash: string) => {
  return bcrypt.compare(password, hash);
});

// Ollama yönetimi
ipcMain.handle('start-ollama', async () => {
  try {
    // Önce Ollama'nın çalışıp çalışmadığını kontrol et
    try {
      const response = await fetch(`${OLLAMA_API}/tags`);
      if (response.ok) {
        console.log('Ollama zaten çalışıyor');
        return true;
      }
    } catch {
      // Ollama çalışmıyor, başlatmaya devam et
    }

    // Windows'ta PowerShell ile arka planda çalıştır
    const { stdout } = await execAsync('Start-Process ollama -ArgumentList "serve" -WindowStyle Hidden -PassThru | Select-Object -ExpandProperty Id', {
      shell: 'powershell.exe'
    });
    
    // Process ID'yi sakla
    ollamaProcess = stdout.trim();
    console.log('Ollama başlatıldı, PID:', ollamaProcess);
    return true;
  } catch (error) {
    console.error('Ollama başlatılamadı:', error);
    return false;
  }
});

// Ollama API istekleri
ipcMain.handle('ollama-list-models', async () => {
  try {
    const response = await fetch(`${OLLAMA_API}/tags`);
    const data = await response.json() as { models: Array<{
      name: string;
      size: number;
      digest: string;
      modified_at: string;
    }> };
    return data.models || [];
  } catch (error) {
    console.error('Model listesi alınamadı:', error);
    return [];
  }
});

ipcMain.handle('ollama-check-status', async () => {
  try {
    const response = await fetch(`${OLLAMA_API}/tags`);
    return response.ok;
  } catch {
    return false;
  }
});

// Terminal komutu çalıştırma
ipcMain.handle('run-command', async (_event, command: string) => {
  try {
    const { stdout } = await execAsync(command);
    return stdout.trim();
  } catch (error) {
    console.error('Komut çalıştırma hatası:', error);
    return '';
  }
});

// Sistem bilgilerini al
ipcMain.handle('get-system-info', () => {
  const cpus = os.cpus();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const platform = os.platform();
  const arch = os.arch();
  const hostname = os.hostname();
  const release = os.release();
  const userInfo = os.userInfo();
  const uptime = os.uptime();
  const networkInterfaces = os.networkInterfaces();

  return {
    cpu: {
      model: cpus[0].model,
      speed: cpus[0].speed,
      cores: cpus.length
    },
    memory: {
      total: totalMemory,
      free: freeMemory,
      used: totalMemory - freeMemory
    },
    os: {
      platform,
      arch,
      hostname,
      release,
      username: userInfo.username,
      uptime
    },
    network: networkInterfaces
  };
});

function createWindow() {
  // Content Security Policy'yi ayarla
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self';" +
          `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''};` +
          "style-src 'self' 'unsafe-inline';" +
          "img-src 'self' data: blob:;" +
          "font-src 'self' data:;" +
          "connect-src 'self' ws: wss: http://127.0.0.1:* http://localhost:* https://*.supabase.co;" +
          "worker-src 'self' blob:;"
        ]
      }
    });
  });

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false
    },
    frame: false,
  });

  mainWindow.loadURL(
    isDev
      ? 'http://localhost:5173'
      : `file://${path.join(__dirname, '../dist/index.html')}`
  );

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Pencere kapatıldığında
  mainWindow.on('closed', () => {
    cleanup();
  });

  // Sistem bilgilerini periyodik olarak gönder
  systemInfoInterval = setInterval(() => {
    if (!mainWindow) return;

    const systemInfo = {
      cpuUsage: getCpuUsage(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
    };
    mainWindow.webContents.send('system-info', systemInfo);
  }, 1000);
}

// Electron hazır olduğunda
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Uygulama kapanırken
app.on('window-all-closed', async () => {
  cleanup();
  // Ollama'yı kapat
  await killOllama();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Uygulama temiz bir şekilde kapatılırken
app.on('before-quit', async (event) => {
  event.preventDefault();
  cleanup();
  await killOllama();
  app.exit();
});

// Pencere kontrolü
ipcMain.on('minimize-window', () => {
  mainWindow?.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow?.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('close-window', () => {
  mainWindow?.close();
});
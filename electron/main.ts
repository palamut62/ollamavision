import { app, BrowserWindow, ipcMain, session } from 'electron';
import * as path from 'path';
import * as isDev from 'electron-is-dev';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as bcrypt from 'bcrypt';
import fetch from 'node-fetch-commonjs';
import type { ModelInfo } from '../src/types/electron';

const execAsync = promisify(exec);
const execPromise = promisify(exec);
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
  try {
    const currentCpuInfo = os.cpus();
    const currentTime = Date.now();
    const timeDifference = currentTime - lastCpuInfoTime;

    if (timeDifference < 100) {
      return -1; // Çok sık ölçüm yapılıyorsa geçersiz değer döndür
    }

    let totalUsage = 0;
    let validCores = 0;

    for (let i = 0; i < currentCpuInfo.length; i++) {
      const currentCore = currentCpuInfo[i];
      const lastCore = lastCpuInfo[i];

      if (!currentCore || !lastCore) continue;

      const currentTotal = Object.values(currentCore.times).reduce((a, b) => a + b, 0);
      const lastTotal = Object.values(lastCore.times).reduce((a, b) => a + b, 0);

      const totalDiff = currentTotal - lastTotal;
      if (totalDiff <= 0) continue;

      const idleDiff = currentCore.times.idle - lastCore.times.idle;
      if (idleDiff < 0) continue;

      const usage = Math.min(100, Math.max(0, (1 - idleDiff / totalDiff) * 100));
      totalUsage += usage;
      validCores++;
    }

    lastCpuInfo = currentCpuInfo;
    lastCpuInfoTime = currentTime;

    return validCores > 0 ? totalUsage / validCores : -1;
  } catch (error) {
    console.error('CPU usage calculation error:', error);
    return -1;
  }
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

// Komut çalıştırma
ipcMain.handle('run-command', async (_, command: string) => {
  try {
    // Ollama komutlarını özel olarak işle
    if (command.startsWith('ollama')) {
      const parts = command.split(' ');
      const subCommand = parts[1];

      switch (subCommand) {
        case 'list':
          const models = await listModels();
          if (models.length === 0) {
            return 'No models found';
          }
          
          // Tablo genişlikleri
          const nameWidth = 30;
          const sizeWidth = 10;
          const modifiedWidth = 25;
          
          // Başlık satırı
          let output = '\r\n';
          output += 'NAME'.padEnd(nameWidth) + 'SIZE'.padEnd(sizeWidth) + 'MODIFIED\r\n';
          output += '─'.repeat(nameWidth + sizeWidth + modifiedWidth) + '\r\n';
          
          // Model bilgileri
          models.forEach(model => {
            const name = model.name.padEnd(nameWidth);
            const size = formatBytes(model.size).padEnd(sizeWidth);
            const modified = new Date(model.modified_at).toLocaleString();
            output += `${name}${size}${modified}\r\n`;
          });
          
          return output;

        case 'pull':
          if (parts.length < 3) return 'Usage: ollama pull <model>';
          const modelName = parts[2];
          
          try {
            console.log(`Starting download of model: ${modelName}`);
            const response = await fetch('http://127.0.0.1:11434/api/pull', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ 
                name: modelName
              })
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Failed to start download: ${response.statusText}\n${errorText}`);
            }

            // Stream'i text olarak oku ve satır satır işle
            const text = await response.text();
            const lines = text.split('\n').filter(Boolean);
            let lastProgress = -1;

            for (const line of lines) {
              try {
                const data = JSON.parse(line);
                
                if (data.status) {
                  process.stdout.write(`\r${data.status}`);
                }
                
                if (data.total && data.completed) {
                  const progress = Math.round((data.completed / data.total) * 100);
                  if (progress > lastProgress) {
                    lastProgress = progress;
                    process.stdout.write(`\rDownloading ${modelName}: ${progress}%`);
                  }
                }

                if (data.error) {
                  throw new Error(data.error);
                }
              } catch (e) {
                if (e instanceof SyntaxError) continue;
                throw e;
              }
            }

            // İndirme tamamlandığında sidebar'ı güncelle
            mainWindow?.webContents.send('refresh-models');
            return `\nModel ${modelName} has been downloaded successfully.`;
          } catch (error: any) {
            console.error('Download error:', error);
            if (error.message.includes('ECONNREFUSED')) {
              return 'Error: Could not connect to Ollama. Make sure Ollama is running.';
            }
            return `Error downloading model: ${error.message}`;
          }

        case 'rm':
        case 'remove':
          if (parts.length < 3) return 'Usage: ollama rm <model>';
          const modelToDelete = parts[2];
          const success = await deleteModel(modelToDelete);
          return success ? `Deleted ${modelToDelete}` : `Failed to delete ${modelToDelete}`;

        case 'run':
          if (parts.length < 3) return 'Usage: ollama run <model> [prompt]';
          const runModelName = parts[2];
          const prompt = parts.slice(3).join(' ');
          
          try {
            // Önce modelin yüklü olup olmadığını kontrol et
            const models = await listModels();
            const modelExists = models.some(m => m.name === runModelName);
            
            if (!modelExists) {
              // Model yüklü değil, indirmeyi başlat
              console.log(`Model '${runModelName}' is not installed. Starting download...`);
              
              try {
                const pullResponse = await fetch('http://127.0.0.1:11434/api/pull', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ 
                    name: runModelName
                  })
                });

                if (!pullResponse.ok) {
                  throw new Error(`Failed to download model: ${pullResponse.statusText}`);
                }

                const text = await pullResponse.text();
                const lines = text.split('\n').filter(Boolean);
                let lastStatus = '';

                for (const line of lines) {
                  try {
                    const data = JSON.parse(line);
                    
                    if (data.status) {
                      lastStatus = `Download status: ${data.status}`;
                      console.log(lastStatus);
                    }
                    
                    if (data.total && data.completed) {
                      const progress = Math.round((data.completed / data.total) * 100);
                      lastStatus = `Downloading ${runModelName}: ${progress}%`;
                      console.log(lastStatus);
                    }

                    if (data.error) {
                      throw new Error(data.error);
                    }
                  } catch (e) {
                    if (e instanceof SyntaxError) continue;
                    throw e;
                  }
                }

                // İndirme tamamlandığında sidebar'ı güncelle
                mainWindow?.webContents.send('refresh-models');
                return lastStatus || `Model ${runModelName} download started. Please wait for completion.`;
              } catch (pullError: any) {
                return `Failed to download model: ${pullError.message}`;
              }
            }

            console.log(`Running model ${runModelName} with prompt: ${prompt || 'default greeting'}`);
            
            const response = await fetch('http://127.0.0.1:11434/api/generate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: runModelName,
                prompt: prompt || 'Hello! How can I help you today?',
                stream: false,
                options: {
                  temperature: 0.7,
                  top_p: 0.9
                }
              })
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Failed to run model: ${response.statusText}\n${errorText}`);
            }

            const data = await response.json() as { response: string };
            return data.response || 'No response from model';
          } catch (error: any) {
            console.error('Error running model:', error);
            if (error.message.includes('ECONNREFUSED')) {
              return 'Error: Could not connect to Ollama. Make sure Ollama is running.';
            }
            return `Error running model: ${error.message}`;
          }

        default:
          return `Unknown ollama command: ${subCommand}\nAvailable commands: list, pull, rm, run`;
      }
    }

    // Diğer komutlar için normal işlem
    const shell = process.platform === 'win32' ? 'powershell.exe' : '/bin/bash';
    const { stdout, stderr } = await execPromise(command, { shell });
    return stdout || stderr;
  } catch (error: any) {
    return `Error: ${error.message}`;
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

// Byte formatlama yardımcı fonksiyonu
function formatBytes(bytes: number | undefined): string {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

// Ollama API fonksiyonları
async function listModels(): Promise<ModelInfo[]> {
  try {
    const response = await fetch('http://127.0.0.1:11434/api/tags');
    if (!response.ok) throw new Error('Failed to fetch models');
    const data = await response.json() as { models: ModelInfo[] };
    return data.models || [];
  } catch (error) {
    console.error('Error listing models:', error);
    return [];
  }
}

async function deleteModel(modelName: string): Promise<boolean> {
  try {
    const response = await fetch('http://127.0.0.1:11434/api/delete', {
      method: 'DELETE',
      body: JSON.stringify({ name: modelName }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error deleting model:', error);
    return false;
  }
}

import React from 'react';
import { useTheme } from '@mui/material/styles';
import './HelpPage.css';

interface HelpPageProps {
  onClose: () => void;
}

const HelpPage: React.FC<HelpPageProps> = ({ onClose }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <div className={`help-page ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="help-header">
        <h1>Desktop Agent Help</h1>
        <button onClick={onClose} className="close-button">×</button>
      </div>
      
      <div className="help-content">
        <section>
          <h2>🚀 Getting Started</h2>
          <p>Desktop Agent is a desktop application that allows you to manage and use Ollama models.</p>
        </section>

        <section>
          <h2>📋 Terminal Commands</h2>
          <div className="command-table">
            <table>
              <thead>
                <tr>
                  <th>Command</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>help</td>
                  <td>Show this help message</td>
                </tr>
                <tr>
                  <td>clear, cls</td>
                  <td>Clear terminal screen</td>
                </tr>
                <tr>
                  <td>ollama list</td>
                  <td>List installed models</td>
                </tr>
                <tr>
                  <td>ollama pull &lt;model&gt;</td>
                  <td>Download a new model</td>
                </tr>
                <tr>
                  <td>ollama rm &lt;model&gt;</td>
                  <td>Remove a model</td>
                </tr>
                <tr>
                  <td>ollama run &lt;model&gt;</td>
                  <td>Run a model</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2>🎯 Model Management</h2>
          <ul>
            <li>Select a model from the sidebar model list</li>
            <li>Click the trash icon to remove a model</li>
            <li>Models are automatically downloaded when needed</li>
            <li>Download progress is shown in the status bar</li>
          </ul>
        </section>

        <section>
          <h2>💬 Chat Interface</h2>
          <ul>
            <li>Select a model from the sidebar to start chatting</li>
            <li>Click "New Chat" to start a fresh conversation</li>
            <li>Previous chats are saved automatically</li>
            <li>Use Ctrl+Enter to send messages</li>
            <li>Code blocks are automatically formatted</li>
            <li>Click the copy button to copy code snippets</li>
          </ul>
        </section>

        <section>
          <h2>📊 System Information</h2>
          <ul>
            <li>CPU and RAM usage are shown in the sidebar</li>
            <li>System metrics are updated every 5 seconds</li>
            <li>Green dot: Ollama is running</li>
            <li>Red dot: Ollama is stopped</li>
            <li>Yellow dot: Ollama is not installed</li>
          </ul>
        </section>

        <section>
          <h2>⌨️ Keyboard Shortcuts</h2>
          <div className="shortcut-table">
            <h3>Terminal:</h3>
            <table>
              <tbody>
                <tr>
                  <td>Ctrl+C</td>
                  <td>Copy selected text / Cancel command</td>
                </tr>
                <tr>
                  <td>Ctrl+V</td>
                  <td>Paste text</td>
                </tr>
                <tr>
                  <td>Ctrl+L</td>
                  <td>Clear terminal screen</td>
                </tr>
              </tbody>
            </table>

            <h3>Chat:</h3>
            <table>
              <tbody>
                <tr>
                  <td>Ctrl+Enter</td>
                  <td>Send message</td>
                </tr>
                <tr>
                  <td>Ctrl+B</td>
                  <td>Bold text</td>
                </tr>
                <tr>
                  <td>Ctrl+I</td>
                  <td>Italic text</td>
                </tr>
                <tr>
                  <td>Ctrl+K</td>
                  <td>Code block</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2>🖥️ Window Controls</h2>
          <ul>
            <li>Drag the terminal header to resize</li>
            <li>Click minimize (-) to hide terminal</li>
            <li>Click close (×) to close terminal</li>
            <li>Terminal state is preserved when hidden</li>
          </ul>
        </section>

        <section>
          <h2>🔗 More Information</h2>
          <p>
            For more information, visit:
            <a href="https://github.com/ollama/ollama" target="_blank" rel="noopener noreferrer">
              https://github.com/ollama/ollama
            </a>
          </p>
        </section>
      </div>
    </div>
  );
};

export default HelpPage; 
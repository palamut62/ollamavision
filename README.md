﻿
# Ollama Desktop

A modern desktop application for managing and interacting with Ollama AI models, built with Electron, React, and TypeScript.

![Ollama Desktop Screenshot](ollama.png)

## Features

- 🤖 Easy management of Ollama AI models
- 💬 Interactive chat interface with AI models
- 🔄 Real-time system monitoring
- 🎨 Modern and intuitive user interface
- 🔒 Secure user authentication
- 💾 Local database integration
- 🌐 Multi-model support
- 📊 System resource monitoring

## Technologies

- Electron
- React
- TypeScript
- Material-UI
- Supabase
- SQLite
- Zustand

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Ollama CLI installed on your system

## Installation

1. Clone the repository
```bash
git clone https://github.com/palamut62/ollama-desktop.git
cd ollama-desktop
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory and add your Supabase credentials:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server
```bash
npm run dev
# or
yarn dev
```

## Building

To create a production build:
```bash
npm run build
# or
yarn build
```

## Features in Detail

### AI Model Management
- Install and remove Ollama models
- Real-time model status monitoring
- Easy model switching

### Chat Interface
- Multi-chat support
- Message history
- Code highlighting
- File sharing capabilities

### System Integration
- Real-time system resource monitoring
- Built-in terminal
- Custom window controls
- Dark/Light theme support

### Security
- User authentication
- Encrypted local storage
- Secure API communications

## Development

### Project Structure
```
ollama-desktop/
├── src/
│   ├── components/
│   ├── services/
│   ├── store/
│   ├── utils/
│   └── types/
├── electron/
├── public/
└── package.json
```

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build production version
- `npm run electron:dev` - Start Electron development
- `npm run electron:build` - Build Electron application

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

Umut Celik
- Twitter: [@palamut62](https://twitter.com/palamut62)
- GitHub: [@palamut62](https://github.com/palamut62)
- Website: [umutcelik.online](https://umutcelik.online)

Project Link: [https://github.com/palamut62/ollama-desktop](https://github.com/palamut62/ollama-desktop)

## Acknowledgments

- [Ollama](https://ollama.ai) for the amazing AI models
- [Electron](https://www.electronjs.org) for the desktop application framework
- [React](https://reactjs.org) for the UI library
- [Material-UI](https://mui.com) for the component library
- [Supabase](https://supabase.io) for the backend services

## Screenshots

### Main Interface
![Main Interface](screenshots/main.png)

### Chat Interface
![Chat Interface](screenshots/chat.png)

### Model Management
![Model Management](screenshots/models.png)

## Roadmap

- [ ] Voice interaction support
- [ ] Custom model training interface
- [ ] Plugin system
- [ ] Multi-language support
- [ ] Cloud sync
- [ ] Mobile companion app

## Support

If you like this project, please consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting new features
- 🤝 Contributing to the code
```


# GravityQA - AI-Native Test Automation Platform

<div align="center">

**A powerful macOS desktop application for automated mobile & web testing with AI intelligence**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11-green)](https://www.python.org/)
[![Electron](https://img.shields.io/badge/Electron-28-purple)](https://www.electronjs.org/)

</div>

---

## 🎯 Vision

GravityQA is a Mac-native desktop application that combines:
- **Appium Inspector** (built-in)
- **AI-powered test generation** (GPT-4V/Claude)
- **Code editor** (Monaco - VS Code engine)
- **Mobile, Web & API testing** in one unified platform
- **Local-first execution** (privacy & speed)

**Replace multiple tools with one:** Appium Inspector, Playwright CLI, test runners, and basic AI tools.

---

## ✨ Features

### 🚀 Current (MVP - In Progress)

✅ **Device Management**
- Android device/emulator detection (ADB)
- iOS simulator support (xcrun)
- Real-time device connection status
- Device screen mirroring (scrcpy)

✅ **Appium Inspector**
- Element tree viewer
- XPath generator with multiple strategies
- Tap-to-inspect
- Element highlighting
- Live screen preview

✅ **Code Editor**
- Monaco Editor (VS Code engine)
- Python, JavaScript, TypeScript support
- Syntax highlighting & autocomplete
- File tree navigation

✅ **Test Runner**
- Execute tests locally
- Real-time log streaming
- Live test visualization
- Screenshot capture

✅ **AI Console**
- GPT-4V / Claude 3.5 integration
- Autonomous app exploration
- AI-generated test code
- Learning from previous runs

📦 **Coming in Phase 2**
- Web testing (Playwright)
- API testing (REST/GraphQL)
- iOS real device support
- Video recording
- Learning system (ChromaDB)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│     macOS Desktop (Electron Shell)      │
├─────────────────────────────────────────┤
│  Frontend: React + TypeScript + Tailwind │
│  Backend: Python FastAPI + Node.js       │
│  Database: SQLite + ChromaDB             │
│  Storage: ~/Library/Application Support/ │
└─────────────────────────────────────────┘
```

**Tech Stack:**
- **Frontend:** Electron 28, React 18, TypeScript 5, TailwindCSS 3
- **Backend:** Python 3.11, FastAPI, Appium 2, Playwright
- **AI:** OpenAI/Anthropic SDKs, LangChain, ChromaDB
- **Database:** SQLite + SQLAlchemy

---

## 🛠️ Setup Instructions

### Prerequisites

1. **macOS** 12.0 or later
2. **Node.js** 18+ and npm
3. **Python** 3.11+
4. **Android SDK** (for Android testing)
5. **Xcode** (for iOS testing)

### Installation

```bash
# 1. Clone repository
cd /path/to/workspace
cd gravityqa

# 2. Install frontend dependencies
npm install

# 3. Install backend dependencies
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# 4. Install Appium globally
npm install -g appium
appium driver install uiautomator2
appium driver install xcuitest

# 5. Install ADB (Android SDK Platform Tools)
brew install --cask android-platform-tools

# 6. Install scrcpy (screen mirroring)
brew install scrcpy
```

### Configuration

Create `.env` file in `backend/` directory:

```bash
# AI Provider (choose one)
OPENAI_API_KEY=sk-...
# or
ANTHROPIC_API_KEY=sk-ant-...

DEFAULT_LLM_PROVIDER=openai  # openai, anthropic, local
DEFAULT_MODEL=gpt-4-vision-preview
```

### Running the Application

```bash
# Option 1: Run all services together
npm run dev

# Option 2: Run services separately

# Terminal 1: Backend
cd backend
source venv/bin/activate
python main.py

# Terminal 2: Frontend
npm run dev:frontend

# Terminal 3: Appium Server
npm run dev:appium

# Terminal 4: Electron
npm run dev:electron
```

The app will open automatically at `http://localhost:5173`

---

## 📁 Project Structure

```
gravityqa/
├── electron/              # Electron main process
│   ├── main.ts           # Window management
│   ├── preload.ts        # IPC bridge
│   └── ipc/              # IPC handlers
├── src/                  # React frontend
│   ├── components/
│   │   ├── device/       # Device management
│   │   ├── inspector/    # Appium Inspector
│   │   ├── editor/       # Code editor
│   │   ├── test-runner/  # Test execution
│   │   ├── ai/           # AI console
│   │   └── reports/      # Report viewer
│   ├── stores/           # Zustand state
│   └── services/         # API clients
├── backend/              # Python FastAPI
│   ├── main.py          # API entry point
│   ├── models/          # SQLAlchemy models
│   ├── api/             # API routes
│   └── services/
│       ├── mobile/      # Appium integration
│       ├── web/         # Playwright integration
│       ├── ai/          # AI agent logic
│       └── reporting/   # Report generation
├── appium-server/        # Node.js Appium service
└── playwright-service/   # Node.js Playwright service
```

---

## 🚦 Usage

### 1. Connect a Device

**Android Emulator:**
```bash
# List available emulators
emulator -list-avds

# Start an emulator
emulator -avd Pixel_6_Pro_API_34

# Verify connection
adb devices
```

**iOS Simulator:**
```bash
# List available simulators
xcrun simctl list devices

# Boot a simulator
xcrun simctl boot "iPhone 15 Pro"

# Open Simulator app
open -a Simulator
```

### 2. Upload & Install App

1. Go to **Devices** tab
2. Click on a connected device
3. Drag & drop your APK/IPA file
4. Click **Install App**
5. Wait for installation to complete

### 3. Start AI Testing

1. Go to **AI Console** tab
2. Select your app and device
3. Click **Start AI Exploration**
4. Watch AI autonomously test your app
5. View generated test code in **Code Editor**

### 4. Run Tests

1. Go to **Test Runner** tab
2. Select a test suite
3. Click **Run Tests**
4. View live execution and results

---

## 🤖 AI Features

### Autonomous Exploration

The AI agent:
1. 📸 **Captures screenshots** of each screen
2. 🔍 **Analyzes UI** using GPT-4V/Claude
3. 🎯 **Plans actions** (tap, input, swipe)
4. ⚡ **Executes tests** via Appium
5. 💾 **Generates code** (Python/JavaScript)
6. 🧠 **Learns patterns** for future runs

### Supported Actions

- ✅ Tap buttons/elements
- ✅ Enter text in input fields
- ✅ Swipe gestures
- ✅ Navigate between screens
- ✅ Validate assertions
- ✅ Detect errors/crashes

---

## 📊 Roadmap

### ✅ Phase 1: MVP (Days 1-45)
- [x] Project setup
- [x] Device management
- [x] Appium integration
- [ ] Appium Inspector
- [ ] Code editor (Monaco)
- [ ] Test runner
- [ ] Basic AI exploration
- [ ] Report generation

### 🔄 Phase 2: Advanced Features (Days 46-90)
- [ ] Web testing (Playwright)
- [ ] Learning system (ChromaDB)
- [ ] API testing
- [ ] iOS real device support
- [ ] Video recording
- [ ] Parallel execution

### 🚀 Phase 3: Enterprise (Days 91-180)
- [ ] Plugin architecture
- [ ] CI/CD integrations
- [ ] Cloud sync
- [ ] Team collaboration
- [ ] Performance testing
- [ ] Self-healing tests

---

## 🎨 Design Philosophy

**Developer-First:**
- Full code access and editability
- No vendor lock-in
- Local-first execution

**AI-Native:**
- Intelligent test generation
- Learning from failures
- Automatic selector optimization

**Modern UI:**
- Dark theme optimized
- Smooth animations
- Keyboard shortcuts
- Professional aesthetics

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📝 License

MIT License - see [LICENSE](LICENSE) for details

---

## 🙏 Acknowledgments

Built with:
- [Electron](https://www.electronjs.org/)
- [React](https://react.dev/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Appium](https://appium.io/)
- [Playwright](https://playwright.dev/)
- [OpenAI](https://openai.com/) / [Anthropic](https://www.anthropic.com/)

---

## 📧 Support

For questions or issues:
- Open an [issue](https://github.com/yourusername/gravityqa/issues)
- Email: support@gravityqa.com

---

<div align="center">

**Built with ❤️ for the QA community**

[Website](https://gravityqa.com) • [Docs](https://docs.gravityqa.com) • [Discord](https://discord.gg/gravityqa)

</div>

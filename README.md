# 🚀 GravityQA

> **AI-Native Mobile Test Automation Platform**  
> Premium Electron desktop application for automated Android/iOS testing with intelligent test generation and beautiful UI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Electron](https://img.shields.io/badge/Electron-191970?logo=Electron&logoColor=white)](https://www.electronjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://www.python.org/)

---

## ✨ Features

### 🎯 Core Capabilities
- **📱 Real Device Testing** - Connect and test on actual Android/iOS devices
- **🤖 AI-Powered Test Generation** - Intelligent test creation using GPT-4 Vision
- **🎬 Visual Recording** - Record user interactions and replay them automatically
- **📊 Flow Management** - Save, organize, and replay test flows
- **🔄 Smart Playback** - Adaptive timing and error handling during test execution
- **📦 APK Analysis** - Deep inspection of Android application packages
- **🎨 Premium UI** - Beautiful, modern interface with smooth animations

### 🛠️ Advanced Features
- **Device Management** - Multi-device support with real-time monitoring
- **Screenshot Capture** - Automated screen capture during testing
- **Touch Recording** - Precise tap and swipe gesture recording
- **Test Flow Export/Import** - Share test flows across teams
- **Live Device Preview** - Real-time device screen mirroring
- **APK Installation** - Automated app installation and management

---

## 🖼️ Screenshots

### Dashboard & Device Manager
*Premium dark-themed interface with glassmorphism effects*

### Inspector & Recording
*Visual test recording with real-time device preview*

### Flow Management
*Organize and manage your test flows*

### Test Playback
*Automated test execution with live feedback*

---

## 🏗️ Architecture

### Frontend
- **Framework**: React 18 + TypeScript
- **Desktop**: Electron (Cross-platform)
- **Styling**: Custom CSS with premium animations
- **State Management**: Zustand
- **Build Tool**: Vite

### Backend
- **Framework**: FastAPI (Python 3.11)
- **Mobile Automation**: Appium
- **Database**: SQLite
- **AI Integration**: OpenAI GPT-4 Vision API
- **Real-time**: WebSocket

### Mobile Testing
- **Android**: ADB (Android Debug Bridge)
- **iOS**: XCUITest / WebDriverAgent
- **Automation**: Appium Server
- **Device Bridge**: Custom Python service

---

## 📋 Prerequisites

### System Requirements
- **OS**: macOS (primary), Windows, or Linux
- **Node.js**: v18 or higher
- **Python**: 3.11+
- **ADB**: Android Debug Bridge installed
- **Appium**: Server installed globally

### For Android Testing
```bash
# Install Android SDK & Platform Tools
brew install --cask android-platform-tools

# Verify ADB
adb version
```

### For iOS Testing (macOS only)
```bash
# Install Xcode
xcode-select --install

# Install Appium dependencies
brew install carthage
brew install ios-deploy
```

---

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/FarazAhmedDev/gravityqa.git
cd gravityqa
```

### 2. Install Dependencies

#### Frontend
```bash
npm install
```

#### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configuration

Create `.env` file in `backend/`:
```env
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=sqlite:///./gravityqa.db
```

### 4. Run Application

#### Development Mode
```bash
# Terminal 1 - Start Backend
cd backend
source venv/bin/activate
python3 -m uvicorn main:app --reload --port 8000

# Terminal 2 - Start Appium
npm start

# Terminal 3 - Start Frontend
npm run dev
```

#### Production Build
```bash
# Build Electron app
npm run build:mac     # macOS
npm run build:win     # Windows
npm run build:linux   # Linux
```

---

## 📖 Usage Guide

### Step 1: Connect Device
1. Connect Android/iOS device via USB
2. Enable USB Debugging (Android) or Developer Mode (iOS)
3. Device will auto-detect in GravityQA

### Step 2: Upload & Install APK
1. Select your APK file
2. App will analyze package details
3. Auto-install on connected device

### Step 3: Record Test Flow
1. Launch app on device
2. Click "Start Recording"
3. Perform test actions (tap, swipe, etc.)
4. Click "Stop Recording"
5. Save test flow with a name

### Step 4: Replay Tests
1. Go to "Test Flows" tab
2. Select saved flow
3. Choose target device
4. Click "Play Flow"
5. Watch automated test execution

---

## 🗂️ Project Structure

```
gravityqa/
├── src/                          # Frontend React app
│   ├── components/               # UI components
│   │   ├── device/              # Device management
│   │   ├── flow/                # Flow management
│   │   ├── inspector/           # Inspector & recording
│   │   └── layout/              # Header, sidebar
│   ├── services/                # API clients
│   ├── stores/                  # State management
│   └── types/                   # TypeScript types
├── backend/                     # FastAPI backend
│   ├── api/                     # API endpoints
│   ├── models/                  # Database models
│   ├── schemas/                 # Pydantic schemas
│   └── services/                # Business logic
│       ├── ai/                  # AI services
│       ├── mobile/              # Mobile testing
│       └── playback/            # Test playback
├── electron/                    # Electron main process
├── appium-server/              # Appium server wrapper
└── scripts/                    # Build & setup scripts
```

---

## 🎨 Design System

### Color Palette
- **Primary**: `#58a6ff` (Blue)
- **Success**: `#3fb950` (Green)
- **Warning**: `#d29922` (Orange)
- **Danger**: `#f85149` (Red)
- **Background**: `#0d1117` (Dark)

### UI Features
- **Glassmorphism** - Frosted glass effects
- **Gradient Animations** - Smooth color transitions
- **Floating Particles** - Dynamic background elements
- **Mouse Parallax** - Interactive cursor effects
- **Premium Shadows** - Multi-layer depth

---

## 🔧 Technology Stack

| Category | Technology |
|----------|-----------|
| **Frontend Framework** | React 18 + TypeScript |
| **Desktop Platform** | Electron |
| **Build Tool** | Vite |
| **State Management** | Zustand |
| **Styling** | Custom CSS + Animations |
| **Backend Framework** | FastAPI (Python 3.11) |
| **Mobile Automation** | Appium |
| **Database** | SQLite |
| **AI/ML** | OpenAI GPT-4 Vision |
| **Real-time** | WebSocket |
| **APK Analysis** | androguard |
| **Device Control** | ADB, ios-deploy |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Appium** - Mobile automation framework
- **OpenAI** - GPT-4 Vision API
- **Electron** - Cross-platform desktop apps
- **FastAPI** - Modern Python web framework
- **React** - UI library

---

## 📧 Contact

**Faraz Ahmed**  
GitHub: [@FarazAhmedDev](https://github.com/FarazAhmedDev)

---

## 🗺️ Roadmap

- [ ] iOS device support enhancement
- [ ] Cloud device farm integration
- [ ] Video recording of test execution
- [ ] Advanced AI test generation
- [ ] Multi-language test report generation
- [ ] CI/CD pipeline integration
- [ ] Team collaboration features
- [ ] Performance metrics dashboard

---

<div align="center">

**⭐ Star this repo if you find it useful! ⭐**

Made with ❤️ by [Faraz Ahmed](https://github.com/FarazAhmedDev)

</div>

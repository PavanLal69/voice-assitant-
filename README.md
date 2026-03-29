# 🤖 KREO - Full Jarvis-Level AI Assistant

A complete AI assistant system with ChatGPT integration, face recognition, voice control, and futuristic UI.

## ✨ Features

### Core AI
- ✅ **ChatGPT Integration** - Real AI conversations via OpenAI API
- ✅ **Wake Word Detection** - Say "Hi Kreo" to activate
- ✅ **Voice Input/Output** - Natural speech interaction
- ✅ **Animated Avatar** - Morphing gradient blob that reacts to speech

### Security & Access
- ✅ **Face Recognition** - Python-based face verification
- ✅ **System Lock/Unlock** - Secure access control
- ✅ **Webcam Integration** - Live face scanning

### UI & Experience
- ✅ **Futuristic Dashboard** - Real-time system metrics
- ✅ **3D Blob (React)** - Three.js powered 3D avatar
- ✅ **Smooth Animations** - Professional transitions
- ✅ **Responsive Design** - Works on all devices

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up API Key

Create `.env` file:
```
OPENAI_KEY=sk-proj-your-key-here
```

### 3. Start AI Server

```bash
npm run ai
```

### 4. Open in Browser

Open `index.html` in Chrome/Edge

**That's it!** Say "Hi Kreo" when the dashboard loads.

## 📚 Full Documentation

- **Quick Start:** See `QUICK-START.md`
- **Complete Setup:** See `SETUP.md`
- **Architecture:** See `SETUP.md` for system architecture

## 🎯 Usage Flow

1. **Boot Screen** → Wait 3 seconds
2. **Lock Screen** → Click "INITIATE"
3. **Face Recognition** → Look at camera
4. **Dashboard** → Say **"Hi Kreo"** to activate
5. **Ask Questions** → KREO responds with AI

## 🏗️ Project Structure

```
├── index.html              # Main HTML interface
├── app.js                  # Frontend + Wake word + AI
├── style.css               # Styles + Blob animations
├── ai-server.js            # ChatGPT API server
├── server.js               # System metrics server
├── face-recognition.py     # Python face recognition
├── face-api.js             # Face recognition API
├── kreo-react/             # React + Three.js 3D version
└── kreo-voice/             # Standalone voice avatar
```

## 🔧 Tech Stack

| Component | Technology |
|-----------|-----------|
| AI Brain | ChatGPT API (OpenAI) |
| Frontend | HTML5 + JavaScript |
| 3D Avatar | React + Three.js |
| Voice | Web Speech API |
| Face Recognition | Python + OpenCV + face_recognition |
| Backend | Node.js + Express |

## 🎙️ Example Commands

- "Hi Kreo" → Activates AI
- "What's the weather?" → AI responds
- "Tell me a joke" → AI responds
- "What can you do?" → AI responds

## ⚠️ Important Notes

- **API Key Security:** Never commit `.env` file
- **Browser:** Use Chrome/Edge for best voice support
- **HTTPS Required:** Microphone access needs HTTPS or localhost
- **Python Setup:** Face recognition requires Python dependencies

## 📝 License

ISC


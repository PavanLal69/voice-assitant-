# 🚀 KREO - Full Jarvis-Level AI Assistant Setup

Complete setup guide for the KREO AI system.

## 📋 Prerequisites

- Node.js 18+ installed
- Python 3.8+ installed
- Webcam access
- OpenAI API key

## 🔧 Installation Steps

### 1. Install Node.js Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
OPENAI_KEY=sk-proj-your-actual-key-here
PORT=3000
```

**⚠️ IMPORTANT:** Never commit your `.env` file to git!

### 3. Install Python Dependencies

```bash
pip install -r requirements.txt
```

**Note:** Installing `dlib` and `face-recognition` may require additional system dependencies:
- **Windows:** Install Visual Studio Build Tools
- **macOS:** `brew install cmake`
- **Linux:** `sudo apt-get install cmake build-essential`

### 4. Set Up Face Recognition

First, capture your face:

```bash
python face-recognition.py capture
```

This will take a photo and save it as `user.jpg`.

## 🚀 Running the System

### Option 1: Basic HTML Version (Current)

1. **Start the AI server:**
   ```bash
   npm run ai
   ```

2. **Start the metrics server (optional):**
   ```bash
   npm start
   ```

3. **Open `index.html` in your browser**

### Option 2: React + Three.js 3D Version

1. **Navigate to React app:**
   ```bash
   cd kreo-react
   npm install
   npm start
   ```

2. **Start AI server in another terminal:**
   ```bash
   npm run ai
   ```

## 🎯 Features

### ✅ Implemented

- ✅ ChatGPT AI integration
- ✅ Wake word detection ("Hi Kreo")
- ✅ Voice input/output
- ✅ Face recognition (Python)
- ✅ Animated blob avatar
- ✅ System metrics dashboard
- ✅ Webcam integration

### 🔄 Architecture

```
Frontend (HTML/React)
    ↓
Wake Word → Voice Input → AI Backend (Node.js)
    ↓                          ↓
Face Recognition (Python) → ChatGPT API
    ↓
Dashboard Unlock
```

## 🎙️ Usage

1. **Boot Screen** → Wait 3 seconds
2. **Lock Screen** → Click "INITIATE"
3. **Face Recognition** → Look at camera (3 seconds)
4. **Dashboard** → Say "Hi Kreo" to activate AI
5. **Ask Questions** → KREO will respond with AI

## 🔐 Security Notes

- API keys are stored in `.env` (not committed to git)
- Face data stored locally only
- All processing happens on your machine

## 🐛 Troubleshooting

### AI Server Not Responding
- Check if `.env` file exists with `OPENAI_KEY`
- Verify API key is valid
- Check server is running on port 3000

### Face Recognition Not Working
- Ensure `user.jpg` exists
- Check webcam permissions
- Verify Python dependencies installed

### Voice Not Working
- Use Chrome or Edge browser
- Check microphone permissions
- Ensure HTTPS or localhost (required for mic access)

## 📁 Project Structure

```
├── index.html          # Main HTML interface
├── app.js              # Frontend JavaScript
├── style.css           # Styles
├── ai-server.js        # ChatGPT API server
├── server.js           # Metrics server
├── face-recognition.py # Python face recognition
├── face-api.js         # Face recognition API
├── kreo-react/         # React + Three.js version
└── kreo-voice/         # Standalone voice avatar
```

## 🚀 Next Steps

- [ ] Add offline speech recognition (Vosk)
- [ ] Integrate Coqui TTS for better voice
- [ ] Add more dashboard widgets
- [ ] Implement command system
- [ ] Add multi-user support

## 📝 License

ISC


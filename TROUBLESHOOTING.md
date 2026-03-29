# 🔧 KREO Troubleshooting Guide

## ❌ "Hi Kreo" Not Working - Common Issues

### 1. AI Server Not Running

**Problem:** Wake word works but AI doesn't respond

**Solution:**
```bash
# Check if server is running
npm run ai

# If not, start it:
npm run ai
```

**Check:** Open browser console (F12) and look for errors like "Failed to fetch"

---

### 2. Microphone Permission Denied

**Problem:** Status shows "Microphone permission denied"

**Solution:**
1. Click the lock icon in browser address bar
2. Allow microphone access
3. Refresh the page
4. Try again

**Note:** Microphone only works on:
- `localhost` (http://localhost)
- `127.0.0.1` (http://127.0.0.1)
- HTTPS sites

---

### 3. API Key Not Set

**Problem:** Server shows "API Key missing"

**Solution:**
1. Create `.env` file in project root
2. Add your API key:
   ```
   OPENAI_KEY=sk-proj-your-key-here
   ```
3. Restart the server

---

### 4. Speech Recognition Not Supported

**Problem:** Status shows "Speech recognition not supported"

**Solution:**
- Use **Chrome** or **Edge** browser
- Firefox and Safari have limited support
- Make sure you're using a recent browser version

---

### 5. Wake Word Not Detected

**Problem:** Saying "Hi Kreo" does nothing

**Checklist:**
- ✅ Microphone permission granted?
- ✅ Using Chrome/Edge?
- ✅ Status indicator shows "Listening for 'Hi Kreo'..."?
- ✅ Speaking clearly and loudly?
- ✅ Check browser console (F12) for errors

**Try:**
1. Click "🎤 Activate KREO" button (manual activation)
2. Check browser console for "Heard:" messages
3. Try saying "Hey Kreo" instead

---

### 6. AI Server Connection Error

**Problem:** "AI server is not running" message

**Solution:**
```bash
# 1. Install dependencies
npm install

# 2. Create .env file with API key
echo "OPENAI_KEY=your-key-here" > .env

# 3. Start AI server
npm run ai

# You should see:
# 🤖 KREO AI Server running on http://localhost:3000
# ✅ API Key loaded
```

---

### 7. Port Already in Use

**Problem:** "Port 3000 already in use"

**Solution:**
```bash
# Option 1: Kill process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill

# Option 2: Use different port
# Edit .env file:
PORT=3001
```

---

### 8. Voice Recognition Keeps Stopping

**Problem:** Recognition stops after a few seconds

**Solution:**
- This is normal behavior - it restarts automatically
- Check browser console for error messages
- Make sure microphone is not being used by another app

---

## 🧪 Testing Steps

### Step 1: Test AI Server
1. Click "🧪 Test AI Connection" button
2. Should say "AI server connection successful"

### Step 2: Test Microphone
1. Open browser console (F12)
2. Say "Hi Kreo"
3. Should see "🎤 Heard: hi kreo" in console

### Step 3: Test Full Flow
1. Say "Hi Kreo"
2. Wait for "Yes, I'm listening"
3. Say your question
4. Should get AI response

---

## 📊 Debug Information

### Check Browser Console (F12)

Look for:
- ✅ "Wake word detection active"
- ✅ "Heard: hi kreo"
- ✅ "Command received: [your question]"
- ✅ "AI Reply: [response]"

### Check Server Console

Look for:
- ✅ "🤖 KREO AI Server running"
- ✅ "✅ API Key loaded"
- ✅ POST requests to `/ask`

---

## 🆘 Still Not Working?

1. **Check all requirements:**
   - [ ] Node.js installed
   - [ ] Dependencies installed (`npm install`)
   - [ ] `.env` file created with API key
   - [ ] AI server running (`npm run ai`)
   - [ ] Using Chrome/Edge browser
   - [ ] Microphone permission granted

2. **Try manual activation:**
   - Click "🎤 Activate KREO" button
   - This bypasses wake word detection

3. **Check error messages:**
   - Browser console (F12)
   - Server terminal
   - Status indicator (top-right corner)

4. **Restart everything:**
   - Close browser
   - Stop server (Ctrl+C)
   - Restart server
   - Open browser again

---

## 💡 Quick Fixes

**Voice not working?**
→ Use the "🎤 Activate KREO" button instead

**AI not responding?**
→ Check if server is running: `npm run ai`

**Nothing happening?**
→ Check browser console (F12) for errors

**Permission denied?**
→ Allow microphone in browser settings


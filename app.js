function show(id) {
    document.querySelectorAll(".screen")
        .forEach(s => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

setTimeout(() => {
    show("lock");
}, 3000);

// Webcam function
async function startWebcam() {
    try {
        const video = document.getElementById("webcam");
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
    } catch (err) {
        console.error("Error accessing webcam:", err);
    }
}

// Voice assistant with blob reaction
function speak(text, onEnd) {
    if (!text || text.trim() === "") {
        console.warn("⚠️ Empty text provided to speak()");
        return;
    }

    console.log("🔊 Speaking:", text);
    
    // Stop any current speech
    window.speechSynthesis.cancel();
    
    const msg = new SpeechSynthesisUtterance(text);
    msg.rate = 0.9;
    msg.pitch = 1.1;
    msg.volume = 1.0;
    
    // Get voices - try multiple times if needed
    function setVoice() {
        const voices = window.speechSynthesis.getVoices();
        console.log("Available voices:", voices.length);
        
        // Try to find a good voice
        let preferredVoice = voices.find(v => 
            v.name.includes("Google") || 
            v.name.includes("Microsoft") ||
            v.name.includes("Zira") ||
            v.name.includes("David")
        );
        
        // Fallback to any English voice
        if (!preferredVoice) {
            preferredVoice = voices.find(v => v.lang.startsWith("en"));
        }
        
        // Fallback to default
        if (!preferredVoice && voices.length > 0) {
            preferredVoice = voices[0];
        }
        
        if (preferredVoice) {
            msg.voice = preferredVoice;
            console.log("✅ Using voice:", preferredVoice.name);
        } else {
            console.warn("⚠️ No voices available, using default");
        }
    }
    
    // Set voice immediately if available
    setVoice();
    
    // Also try when voices load (in case they're not ready yet)
    if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = setVoice;
    }
    
    // Blob reacts while speaking
    msg.onstart = () => {
        console.log("🎤 Speech started");
        const blob = document.querySelector(".blob");
        if (blob) {
            blob.style.filter = "brightness(1.3)";
            blob.style.transform = "scale(1.1)";
        }
    };
    
    msg.onend = () => {
        console.log("✅ Speech ended");
        const blob = document.querySelector(".blob");
        if (blob) {
            blob.style.filter = "brightness(1)";
            blob.style.transform = "scale(1)";
        }
        if (typeof onEnd === "function") {
            onEnd();
        }
    };
    
    msg.onerror = (event) => {
        console.error("❌ Speech error:", event.error);
        updateStatus("❌ Speech error: " + event.error);
    };
    
    // Actually speak
    try {
        window.speechSynthesis.speak(msg);
        console.log("✅ Speech synthesis started");
    } catch (err) {
        console.error("❌ Error starting speech:", err);
        updateStatus("❌ Error: " + err.message);
    }
}

// Wait for voices to load
let voicesLoaded = false;
window.speechSynthesis.onvoiceschanged = () => {
    voicesLoaded = true;
    const voices = window.speechSynthesis.getVoices();
    console.log("✅ Voices loaded:", voices.length, "voices available");
    if (voices.length > 0) {
        console.log("Sample voices:", voices.slice(0, 3).map(v => v.name));
    }
};

// Force load voices on page load
if (window.speechSynthesis.getVoices().length === 0) {
    // Trigger voices to load
    const dummy = new SpeechSynthesisUtterance("");
    window.speechSynthesis.speak(dummy);
    window.speechSynthesis.cancel();
}

// Check if AI server is running
async function checkAIServer() {
    try {
        const res = await fetch("http://localhost:3000/health");
        const data = await res.json();
        return data.status === "ok";
    } catch (err) {
        return false;
    }
}

// AI Chat Function
async function askKreo(text) {
    updateStatus("🤖 Thinking...");
    
    // Check if server is running first
    const serverRunning = await checkAIServer();
    if (!serverRunning) {
        const errorMsg = "AI server is not running. Please start it with: node server.js";
        console.error("❌", errorMsg);
        updateStatus("❌ AI server not running");
        speak("I'm having trouble connecting to my AI brain. Please start the AI server with node server.js.");
        return null;
    }

    try {
        const res = await fetch("http://localhost:3000/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text })
        });

        if (!res.ok) {
            // Try to get error details
            let errorMessage = `HTTP error! status: ${res.status}`;
            let errorDetails = null;
            try {
                const errorData = await res.json();
                errorMessage = errorData.error || errorData.message || errorMessage;
                errorDetails = errorData.details;
                console.error("Server error details:", errorData);
            } catch (e) {
                const errorText = await res.text();
                console.error("Server error response:", errorText);
                errorMessage = errorText || errorMessage;
            }
            
            // More specific error messages
            if (res.status === 401 || errorMessage.includes("API key") || errorMessage.includes("unauthorized")) {
                errorMessage = "Invalid API key. Please check your .env file and restart the server.";
            } else if (res.status === 429 || errorMessage.includes("rate limit")) {
                errorMessage = "Rate limit exceeded. Please wait a moment and try again.";
            } else if (res.status === 500) {
                errorMessage = "Server error. Check the server console for details.";
            }
            
            throw new Error(errorMessage);
        }

        const data = await res.json();
        console.log("📦 Full response data:", data);
        
        if (data.response) {
            updateStatus("💬 Speaking...");
            console.log("✅ AI Reply received:", data.response);

            let restarted = false;
            const restartWakeWord = () => {
                if (restarted) return;
                restarted = true;
                updateStatus("🎤 Listening for 'Hi Kreo'...");
                if (isListening) {
                    startWakeWord();
                }
            };

            const speakWithCallback = () => {
                speak(data.response, restartWakeWord);
            };
            
            // Ensure voices are loaded before speaking
            const voices = window.speechSynthesis.getVoices();
            if (voices.length === 0) {
                console.log("⏳ Waiting for voices to load...");
                window.speechSynthesis.onvoiceschanged = () => {
                    console.log("✅ Voices loaded, speaking now...");
                    speakWithCallback();
                };
            } else {
                // Voices are ready, speak immediately
                speakWithCallback();
            }

            // Fallback: restart wake word even if speech end doesn't fire
            const estimatedTime = Math.max(3000, (data.response.length / 100) * 3000);
            setTimeout(restartWakeWord, estimatedTime + 500);

            return data.response;
        } else if (data.error) {
            throw new Error(data.error);
        } else {
            console.error("❌ No reply in response:", data);
            throw new Error("No reply from AI");
        }
    } catch (err) {
        console.error("❌ AI Error:", err);
        console.error("Full error object:", err);
        const errorMsg = err.message || "Unknown error occurred";
        updateStatus("❌ AI Error: " + errorMsg);
        
        // More helpful error message
        if (errorMsg.includes("Failed to fetch") || errorMsg.includes("NetworkError")) {
            speak("I can't reach my AI server. Please make sure the server is running on port 3000.");
        } else if (errorMsg.includes("API key")) {
            speak("My API key is not configured. Please check the server settings.");
        } else {
            speak("I'm having trouble processing that. " + errorMsg);
        }
        return null;
    }
}

// Wake Word Detection
let recognition = null;
let isListening = false;
let isAwaitingCommand = false;
let statusElement = null;
let heardElement = null;
let commandTimeout = null;

// Create status indicator
function createStatusIndicator() {
    const main = document.querySelector(".main");
    if (main && !statusElement) {
        statusElement = document.createElement("div");
        statusElement.id = "kreo-status";
        statusElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: rgba(0, 255, 204, 0.2);
            border: 1px solid #00ffcc;
            color: #00ffcc;
            border-radius: 4px;
            z-index: 1000;
            font-size: 14px;
        `;
        statusElement.textContent = "🎤 Listening for 'Hi Kreo'...";
        document.body.appendChild(statusElement);

        heardElement = document.createElement("div");
        heardElement.id = "kreo-heard";
        heardElement.style.cssText = `
            position: fixed;
            top: 60px;
            right: 20px;
            padding: 8px 16px;
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid #00ffcc;
            color: #ffffff;
            border-radius: 4px;
            z-index: 1000;
            font-size: 12px;
            max-width: 280px;
        `;
        heardElement.textContent = "Heard: —";
        document.body.appendChild(heardElement);
    }
}

function updateStatus(text) {
    if (statusElement) {
        statusElement.textContent = text;
    }
    console.log("📢 Status:", text);
}

function updateHeard(text) {
    if (heardElement) {
        heardElement.textContent = `Heard: ${text || "—"}`;
    }
}

function initWakeWord() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        updateStatus("❌ Speech recognition not supported in this browser");
        console.error("Speech recognition not supported");
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        updateStatus("🎤 Listening for 'Hi Kreo'...");
        updateHeard("...");
    };

    recognition.onresult = (event) => {
        // Process all results, not just the last one
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript.toLowerCase().trim();
            console.log("🎤 Heard:", transcript);

            // Check for wake word - be more flexible with matching
            const wakeWords = [
                "hi kreo",
                "hey kreo",
                "hi krio",
                "hey krio",
                "hi creo",
                "hey creo",
                "kreo",
                "krio",
                "creo"
            ];
            const isWakeWord = wakeWords.some(word => transcript.includes(word));
            updateHeard(transcript);
            
            if (isWakeWord && !isAwaitingCommand) {
                console.log("✅ WAKE WORD DETECTED!");
                isAwaitingCommand = true;
                // Pause wake-word listening while capturing a command
                isListening = false;
                if (commandTimeout) {
                    clearTimeout(commandTimeout);
                }
                
                const blob = document.querySelector(".blob");
                if (blob) {
                    blob.style.animation = "blobMorph 2s infinite ease-in-out";
                    blob.style.filter = "brightness(1.3)";
                }
                
                updateStatus("✅ Wake word detected! Listening for command...");
                
                // Stop wake word recognition
                try {
                    recognition.stop();
                } catch (e) {
                    console.log("Recognition already stopped");
                }
                
                // Start listening for command immediately (avoid speech/mic conflicts)
                setTimeout(() => {
                    startVoiceInput();
                }, 200);

                // Fallback: if no command is captured, restart wake word
                commandTimeout = setTimeout(() => {
                    if (isAwaitingCommand) {
                        console.log("⏱️ No command captured, restarting wake word");
                        isAwaitingCommand = false;
                        updateStatus("⏱️ No command detected. Listening for 'Hi Kreo'...");
                        startWakeWord();
                    }
                }, 8000);
                
                break; // Exit loop once wake word is found
            }
        }
    };

    recognition.onerror = (event) => {
        console.error("❌ Recognition error:", event.error);
        
        if (event.error === 'not-allowed') {
            updateStatus("❌ Microphone permission denied - Click browser lock icon to allow");
            // Show helpful message
            const permissionMsg = "Microphone access is required!\n\n" +
                "1. Click the lock icon 🔒 in your browser address bar\n" +
                "2. Allow microphone access\n" +
                "3. Refresh the page\n\n" +
                "Or use the '🎤 Activate KREO' button instead.";
            
            // Only show alert once
            if (!window.micPermissionAlerted) {
                alert(permissionMsg);
                window.micPermissionAlerted = true;
            }
            
            // Stop trying to restart
            isListening = false;
        } else if (event.error === 'no-speech') {
            // This is normal, just restart
            if (isListening && !isAwaitingCommand) {
                setTimeout(() => {
                    if (recognition && isListening) {
                        try {
                            recognition.start();
                        } catch (e) {
                            console.error("Error restarting:", e);
                        }
                    }
                }, 1000);
            }
        } else if (event.error === 'aborted') {
            // Recognition was stopped unexpectedly; reset and restart
            if (isListening) {
                isAwaitingCommand = false;
                if (commandTimeout) {
                    clearTimeout(commandTimeout);
                }
                setTimeout(() => {
                    if (recognition && isListening) {
                        try {
                            recognition.start();
                        } catch (e) {
                            console.error("Error restarting:", e);
                        }
                    }
                }, 700);
            }
        } else {
            updateStatus(`❌ Error: ${event.error}`);
        }
    };

    recognition.onend = () => {
        // Only restart if we're still listening and not awaiting a command
        if (isListening && !isAwaitingCommand) {
            setTimeout(() => {
                if (recognition && isListening && !isAwaitingCommand) {
                    try {
                        recognition.start();
                        console.log("🔄 Restarting wake word detection...");
                    } catch (e) {
                        // Recognition might already be starting
                        console.log("Recognition restart skipped:", e.message);
                    }
                }
            }, 1000);
        }
    };
}

function startWakeWord() {
    // Ensure command recognizer is fully stopped before restarting wake word
    if (currentInputRecognition) {
        try {
            currentInputRecognition.stop();
        } catch (e) {
            // ignore
        }
        currentInputRecognition = null;
    }

    if (!recognition) {
        initWakeWord();
    }
    
    if (recognition) {
        isListening = true;
        isAwaitingCommand = false;
        const startRecognition = () => {
            try {
                recognition.start();
                updateStatus("🎤 Listening for 'Hi Kreo'...");
                console.log("✅ Wake word detection active - say 'Hi Kreo'");
            } catch (err) {
                // If already started or busy, retry shortly
                const msg = err && err.message ? err.message.toLowerCase() : "";
                if (msg.includes("start") || msg.includes("already") || msg.includes("busy")) {
                    console.log("Recognition busy, retrying...");
                    setTimeout(() => {
                        startRecognition();
                    }, 600);
                    return;
                }
                console.error("Error starting recognition:", err);
                if (err.message && err.message.includes("not allowed")) {
                    updateStatus("❌ Microphone permission denied - Check browser settings");
                } else {
                    updateStatus("❌ Error starting voice recognition: " + err.message);
                }
            }
        };

        startRecognition();
    }
}

function stopWakeWord() {
    if (recognition && isListening) {
        isListening = false;
        isAwaitingCommand = false;
        recognition.stop();
        updateStatus("🔇 Voice recognition stopped");
    }
}

// Voice Input for Commands
let currentInputRecognition = null;

function startVoiceInput() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        updateStatus("❌ Speech recognition not available");
        isAwaitingCommand = false;
        if (isListening) {
            startWakeWord();
        }
        return;
    }

    // Stop any existing input recognition
    if (currentInputRecognition) {
        try {
            currentInputRecognition.stop();
        } catch (e) {
            // Already stopped
        }
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    currentInputRecognition = new SpeechRecognition();
    currentInputRecognition.continuous = false;
    currentInputRecognition.interimResults = true;
    currentInputRecognition.lang = 'en-US';
    currentInputRecognition.maxAlternatives = 1;

    currentInputRecognition.onstart = () => {
        updateStatus("🎤 Listening for your command...");
        updateHeard("...");
    };

    currentInputRecognition.onresult = (event) => {
        if (event.results.length > 0) {
            const command = event.results[0][0].transcript.trim();
            updateHeard(command);
            console.log("📝 Command received:", command);
            updateStatus(`💭 Processing: "${command}"`);
            isAwaitingCommand = false;
            if (commandTimeout) {
                clearTimeout(commandTimeout);
            }
            // Re-enable wake-word listening after command capture
            isListening = true;
            
            // Process the command
            askKreo(command).then(() => {
                // Restart wake word after AI responds
                setTimeout(() => {
                    if (isListening) {
                        startWakeWord();
                    }
                }, 2000);
            }).catch(() => {
                // Restart even on error
                setTimeout(() => {
                    if (isListening) {
                        startWakeWord();
                    }
                }, 2000);
            });
        }
    };

    currentInputRecognition.onerror = (event) => {
        console.error("❌ Input error:", event.error);
        isAwaitingCommand = false;
        currentInputRecognition = null;
        if (commandTimeout) {
            clearTimeout(commandTimeout);
        }
        // Re-enable wake-word listening after input error
        isListening = true;
        
        if (event.error === 'not-allowed') {
            updateStatus("❌ Microphone permission denied");
            alert("Please allow microphone access!\n\nClick the lock icon 🔒 in your browser address bar and allow microphone.");
        } else if (event.error === 'no-speech') {
            updateStatus("⏱️ No speech detected. Listening for 'Hi Kreo'...");
        } else if (event.error === 'aborted') {
            updateStatus("⏱️ Recognition reset. Listening for 'Hi Kreo'...");
        } else {
            updateStatus(`❌ Error: ${event.error}`);
        }
        
        // Restart wake word
        setTimeout(() => {
            if (isListening) {
                startWakeWord();
            }
        }, 2000);
    };

    currentInputRecognition.onend = () => {
        currentInputRecognition = null;
        if (commandTimeout) {
            clearTimeout(commandTimeout);
        }
        // Ensure wake-word listening can resume
        if (!isListening) {
            isListening = true;
        }
        
        // If still awaiting command (no result received), restart wake word
        if (isAwaitingCommand) {
            isAwaitingCommand = false;
            updateStatus("⏱️ No command detected. Listening for 'Hi Kreo'...");
            setTimeout(() => {
                if (isListening) {
                    startWakeWord();
                }
            }, 1000);
        }
    };

    try {
        currentInputRecognition.start();
        updateStatus("🎤 Listening for your command...");
        console.log("🎤 Started listening for command...");
    } catch (err) {
        console.error("Error starting input recognition:", err);
        isAwaitingCommand = false;
        currentInputRecognition = null;
        updateStatus("❌ Error starting command recognition");
        
        // Restart wake word
        setTimeout(() => {
            if (isListening) {
                startWakeWord();
            }
        }, 2000);
    }
}

// Start wake word when dashboard loads
function startFace() {
    show("face");
    startWebcam();
    
    setTimeout(() => {
        show("dashboard");
        createStatusIndicator();
        
        // Wait for voices to load
        setTimeout(() => {
            speak("Hi, I'm Kreo. Your AI assistant. System unlocked. Welcome back. Say 'Hi Kreo' to activate me.");
            
            // Initialize and start wake word
            initWakeWord();
            setTimeout(() => {
                startWakeWord();
            }, 3000);
        }, 500);
        loadMetrics();
    }, 3000);
}

// Load real metrics (if backend is running)
async function loadMetrics() {
    try {
        const res = await fetch("http://localhost:3000/metrics");
        const data = await res.json();
        
        const cpuEl = document.getElementById("cpu");
        const ramEl = document.getElementById("ram");
        
        if (cpuEl) cpuEl.innerText = `CPU: ${data.cpu}%`;
        if (ramEl) ramEl.innerText = `Memory: ${data.memory}%`;
    } catch (err) {
        // Backend not running, keep default values
        console.log("Backend not available, using default metrics");
    }
}

// Update metrics every 2 seconds if backend is available
setInterval(loadMetrics, 2000);

// Manual activation button
function manualActivate() {
    if (isAwaitingCommand) {
        updateStatus("⏳ Already listening for command...");
        return;
    }
    
    isAwaitingCommand = true;
    const blob = document.querySelector(".blob");
    if (blob) {
        blob.style.filter = "brightness(1.3)";
    }
    
    updateStatus("🎤 Listening for your command...");
    speak("Yes, I'm listening. How can I help?");
    
    setTimeout(() => {
        startVoiceInput();
    }, 2000);
}

// Test AI connection
async function testAI() {
    updateStatus("🧪 Testing AI connection...");
    const serverRunning = await checkAIServer();
    
    if (serverRunning) {
        updateStatus("✅ AI server is running!");
        speak("AI server connection successful.");
    } else {
        updateStatus("❌ AI server is not running");
        const message = "AI server is not running!\n\n" +
            "QUICK FIX:\n" +
            "1. Open PowerShell/Command Prompt in this folder\n" +
            "2. Run: node server.js\n" +
            "3. Keep that window open\n" +
            "4. Refresh this page\n\n" +
            "Make sure you have:\n" +
            "• .env file with OPENAI_KEY\n" +
            "• Dependencies installed (npm install)";
        alert(message);
        speak("AI server is not running. Please start it with node server.js.");
    }
}

// Check microphone permission
async function checkMicrophone() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        updateStatus("✅ Microphone access granted!");
        speak("Microphone is working correctly.");
        stream.getTracks().forEach(track => track.stop()); // Stop the stream
    } catch (err) {
        updateStatus("❌ Microphone access denied");
        const message = "Microphone permission is required!\n\n" +
            "TO FIX:\n" +
            "1. Look for a lock icon 🔒 in your browser address bar\n" +
            "2. Click it\n" +
            "3. Find 'Microphone' and set it to 'Allow'\n" +
            "4. Refresh this page\n\n" +
            "Or use Chrome/Edge browser for best support.";
        alert(message);
    }
}

// Show server start guide
function startServerGuide() {
    const message = "HOW TO START AI SERVER:\n\n" +
        "METHOD 1 (Manual):\n" +
        "1. Open PowerShell in this folder\n" +
        "2. Run: node server.js\n" +
        "3. Keep that window open\n\n" +
        "You should see:\n" +
        "🤖 KREO AI Server running on http://localhost:3000\n" +
        "✅ API Key loaded\n\n" +
        "Then refresh this page!";
    alert(message);
}

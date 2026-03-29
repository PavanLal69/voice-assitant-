import { useState, useEffect, useCallback, useRef } from 'react';

export const globalVoiceState = {
    isListening: false,
    isAwaitingCommand: false,
    isSpeaking: false,
    audioLevel: 0,
};

export function useVoiceAI() {
    const [statusText, setStatusText] = useState("SYSTEM BOOT: Initializing...");
    const [heardText, setHeardText] = useState("");

    // System Health Metrics for strict monitoring
    const [systemHealth, setSystemHealth] = useState({
        mic: 'PENDING',
        speechRec: 'PENDING',
        backend: 'PENDING',
        openai: 'STANDBY',
        threeJS: 'OK' // Managed by Canvas component mounting
    });

    const [isListening, setIsListening] = useState(false);
    const [isAwaitingCommand, setIsAwaitingCommand] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const recognitionRef = useRef(null);
    const commandRecognitionRef = useRef(null);
    const commandTimeoutRef = useRef(null);
    const retryTimeoutRef = useRef(null);
    const isTransitioningRef = useRef(false);

    const updateHealth = (key, status) => {
        setSystemHealth(prev => ({ ...prev, [key]: status }));
    };

    const logAndSetStatus = (msg, level = 'log') => {
        console[level](`[VOICE AI LOG]: ${msg}`);
        setStatusText(msg);
    };

    // --- 1. HEALTH CHECKS ---

    // Test Backend Reachability
    const testBackendConnection = useCallback(async () => {
        logAndSetStatus("Testing backend connection ('/health')...");
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 3000);

            const res = await fetch("http://127.0.0.1:3000/health", { signal: controller.signal });
            clearTimeout(id);

            if (res.ok) {
                console.log("[SYSTEM] Backend connected successfully.");
                updateHealth('backend', 'OK');
            } else {
                console.error(`[SYSTEM] Backend HTTP error: ${res.status}`);
                updateHealth('backend', 'FAIL');
            }
        } catch (err) {
            console.error("[SYSTEM] Backend unreachable:", err);
            updateHealth('backend', 'FAIL');
        }
    }, []);

    // Initial hardware checks
    useEffect(() => {
        const checkSpeechAPI = () => {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                logAndSetStatus("FATAL: SpeechRecognition API not supported by browser.", "error");
                updateHealth('speechRec', 'FAIL');
                return false;
            }
            updateHealth('speechRec', 'OK');
            return true;
        };

        const checkMicPermission = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop()); // close immediately after check
                console.log("[SYSTEM] Microphone permission granted.");
                updateHealth('mic', 'OK');
            } catch (err) {
                console.error("[SYSTEM] Microphone permission denied or missing:", err);
                updateHealth('mic', 'FAIL');
                logAndSetStatus("FATAL: Mic permission denied.", "error");
            }
        };

        if (checkSpeechAPI()) {
            checkMicPermission();
        }
        testBackendConnection();

        // Ensure voices are loaded for SpeechSynthesis
        if (window.speechSynthesis && window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.speak(new SpeechSynthesisUtterance(""));
            window.speechSynthesis.cancel();
        }

    }, [testBackendConnection]);


    // --- 2. PIPELINES ---

    // Speech Synthesis Pipeline
    const speak = useCallback((text, onEndCallback) => {
        if (!text) return;
        logAndSetStatus(`Speaking: "${text.substring(0, 20)}..."`);
        window.speechSynthesis.cancel();

        setIsSpeaking(true);
        globalVoiceState.isSpeaking = true;
        globalVoiceState.audioLevel = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const msg = new SpeechSynthesisUtterance(text);

        // Try to find an Indian voice (Hindi, Telugu, Marathi, Indian English) first, fallback to standard English
        const preferredVoice = voices.find(v =>
            v.lang === 'hi-IN' ||
            v.lang === 'te-IN' ||
            v.lang === 'mr-IN' ||
            v.lang === 'en-IN' ||
            v.name.includes("India")
        ) || voices.find(v =>
            v.name.includes("Google") || v.name.includes("Microsoft") || v.name.includes("Zira") || v.name.includes("David")
        ) || voices.find(v => v.lang.startsWith("en")) || voices[0];

        if (preferredVoice) msg.voice = preferredVoice;

        msg.onstart = () => console.log(`[TTS] Started speaking in ${msg.voice?.name || 'default'} voice`);
        msg.onend = () => {
            console.log("[TTS] Finished speaking");
            setIsSpeaking(false);
            globalVoiceState.isSpeaking = false;
            globalVoiceState.audioLevel = 0.0;
            if (onEndCallback) onEndCallback();
        };
        msg.onerror = (e) => {
            console.error("[TTS] Speech synthesis error:", e);
            setIsSpeaking(false);
            globalVoiceState.isSpeaking = false;
        };

        window.speechSynthesis.speak(msg);
    }, []);

    // AI Fetch Pipeline
    const askKreo = useCallback(async (text) => {
        logAndSetStatus("Sending prompt to AI Backend...");

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 sec timeout

            const res = await fetch("http://127.0.0.1:3000/ask", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!res.ok) {
                const errText = await res.text();
                console.error(`[FETCH] HTTP ${res.status}:`, errText);
                updateHealth('openai', 'FAIL');
                throw new Error(`HTTP ${res.status}: ${errText.substring(0, 50)}`);
            }

            let data;
            try {
                data = await res.json();
            } catch (parseErr) {
                console.error("[FETCH] Failed to parse JSON response:", parseErr);
                throw new Error("Invalid JSON from server");
            }

            if (data.response) {
                console.log("[FETCH] Successful AI generation.");
                updateHealth('openai', 'OK');
                speak(data.response, () => {
                    setTimeout(() => startUnifiedListener(), 1000);
                });
            } else if (data.error) {
                console.error("[FETCH] API returned error string:", data.error);
                updateHealth('openai', 'FAIL');
                throw new Error(data.error);
            }

        } catch (err) {
            console.error("[FETCH] System error during AI request:", err);
            let userMsg = "System error contacting AI.";
            if (err.name === 'AbortError') userMsg = "AI request timed out.";

            logAndSetStatus(`ERROR: ${userMsg}`, "error");
            speak("Error contacting the central cortex.", () => {
                setTimeout(() => startUnifiedListener(), 2000);
            });
        }
    }, [speak]);

    // Unified Single-Instance Pipeline
    // By keeping one SpeechRecognition instance alive and routing logic based on state,
    // we bypass Chrome's aggressive hardware locking when swapping instances.
    const startUnifiedListener = useCallback(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        if (recognitionRef.current) {
            try {
                recognitionRef.current.onend = null;
                recognitionRef.current.onerror = null;
                recognitionRef.current.stop();
            } catch (e) { }
        }

        const rec = new SpeechRecognition();
        rec.continuous = true; // Stay alive to hear the full context
        rec.interimResults = true;
        rec.lang = 'en-US'; // Standardized for better default recognition
        recognitionRef.current = rec;

        rec.onstart = () => {
            setIsListening(true);
            if (globalVoiceState.isAwaitingCommand) {
                logAndSetStatus("CAPTURING COMMAND...");
            } else {
                logAndSetStatus("LISTENING FOR WAKE WORD");
            }
        };

        rec.onresult = (event) => {
            if (globalVoiceState.isSpeaking) return; // Ignore our own TTS

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript.toLowerCase().trim();

                if (!transcript) continue;
                console.log(`[MIC] Heard: "${transcript}"`);

                if (globalVoiceState.isAwaitingCommand) {
                    // We only process final results for commands to avoid partial fragments being sent
                    if (event.results[i].isFinal) {
                        console.log(`[>> COMMAND ROUTED <<]: "${transcript}"`);
                        setHeardText(transcript);
                        setIsAwaitingCommand(false);
                        globalVoiceState.isAwaitingCommand = false;

                        if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);

                        try { rec.stop(); } catch (e) { }

                        askKreo(transcript);
                        return;
                    } else {
                        // Just show what it's picking up
                        setHeardText(transcript + "...");
                    }
                } else {
                    // MODE: Wake Word Scan
                    // Check against a broader set of words
                    const wakeWords = ["hi kreo", "hey kreo", "kreo", "creo", "wake up", "hello", "hi", "hey"];
                    const isWakeWord = wakeWords.some(w => transcript.includes(w));

                    if (isWakeWord) {
                        console.warn(">> WAKE WORD ACTIVATED <<");
                        setHeardText("Wake Word Detected");

                        setIsAwaitingCommand(true);
                        globalVoiceState.isAwaitingCommand = true;

                        logAndSetStatus("WAKE WORD CONFIRMED. AWAITING COMMAND...");

                        if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
                        commandTimeoutRef.current = setTimeout(() => {
                            console.warn("[SYSTEM] Command capture timed out (10s limit).");
                            logAndSetStatus("Wait timeout. Resetting to Wake Word.");
                            setIsAwaitingCommand(false);
                            globalVoiceState.isAwaitingCommand = false;
                        }, 10000);
                        return; // Exit loop
                    }
                }
            }
        };

        rec.onerror = (e) => {
            if (e.error === 'not-allowed') {
                updateHealth('mic', 'FAIL');
                logAndSetStatus("FATAL: Mic blocked.", "error");
                setIsListening(false);
            } else if (e.error === 'network') {
                logAndSetStatus("Network drop. Bouncing Mic...");
                console.warn("[MIC] Network rate limit hit. Bouncing in 2s.");
                if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
                retryTimeoutRef.current = setTimeout(() => startUnifiedListener(), 2000);
            } else if (e.error === 'no-speech') {
                // Ignore silent drops in continuous mode
            } else if (e.error === 'aborted') {
                console.log("[MIC] Expected abort during mode switch.");
            } else {
                console.error("[MIC] Unhandled Error:", e.error);
            }
        };

        rec.onend = () => {
            setIsListening(false);
            if (!globalVoiceState.isSpeaking) {
                if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
                retryTimeoutRef.current = setTimeout(() => {
                    startUnifiedListener();
                }, 300); // Shorter bounce for continuous mode
            }
        };

        try { rec.start(); } catch (e) {
            console.error("[MIC] Start failure:", e);
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = setTimeout(() => startUnifiedListener(), 2000);
        }
    }, [askKreo]);

    // Manual Force Override
    const forceCommandCapture = useCallback(() => {
        console.log("[MIC] Manual Force Triggered");
        logAndSetStatus("MANUAL OVERRIDE: Awaiting Command...");

        setIsAwaitingCommand(true);
        globalVoiceState.isAwaitingCommand = true;

        if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
        commandTimeoutRef.current = setTimeout(() => {
            console.warn("[SYSTEM] Command capture timed out (10s limit).");
            logAndSetStatus("Wait timeout. Resetting to Wake Word.");
            setIsAwaitingCommand(false);
            globalVoiceState.isAwaitingCommand = false;
        }, 10000);

        // Ensure listener is running
        if (!globalVoiceState.isListening) {
            startUnifiedListener();
        }
    }, [startUnifiedListener]);

    // Bootstrap
    useEffect(() => {
        startUnifiedListener();

        return () => {
            console.log("[SYSTEM] unmounting voice hooks.");
            if (recognitionRef.current) try { recognitionRef.current.abort(); } catch (e) { }
            if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        }
    }, [startUnifiedListener]);

    // Sync global vars
    useEffect(() => {
        globalVoiceState.isListening = isListening;
        globalVoiceState.isAwaitingCommand = isAwaitingCommand;
        globalVoiceState.isSpeaking = isSpeaking;
    }, [isListening, isAwaitingCommand, isSpeaking]);

    return {
        isListening,
        isAwaitingCommand,
        isSpeaking,
        statusText,
        heardText,
        systemHealth,
        speak,
        startUnifiedListener,
        forceCommandCapture,
        askKreo,
        testBackendConnection
    };
}

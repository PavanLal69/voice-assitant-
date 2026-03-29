import express from "express";
import os from "os";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

console.log("✅ Server modules loaded");

// Health check endpoint
app.get("/health", (req, res) => {
    console.log("📍 Health check requested");
    res.json({ status: "ok", message: "Server is running" });
});

// System metrics endpoint
app.get("/metrics", (req, res) => {
    console.log("📊 Metrics requested");
    res.json({
        cpu: (os.loadavg()[0] * 10).toFixed(1),
        memory: ((1 - os.freemem() / os.totalmem()) * 100).toFixed(1)
    });
});

// AI endpoint for asking questions (OpenRouter)
app.post("/ask", async (req, res) => {
    try {
        // Support both { text } and { message } from frontend
        const message = req.body?.message || req.body?.text;
        console.log("💬 AI Request:", message);

        if (!message) {
            return res.status(400).json({ error: "No message provided" });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            console.warn("⚠️  OPENROUTER_API_KEY not configured");
            return res.status(500).json({ error: "API key not configured" });
        }

        // OpenRouter uses an OpenAI-compatible API.
        // Docs: https://openrouter.ai/docs
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost",
                "X-Title": "KREO"
            },
            body: JSON.stringify({
                model: "openai/gpt-4o-mini",
                messages: [
                    { role: "system", content: "You are KREO, a futuristic AI assistant. Be concise and helpful. You fully understand and can fluently respond in English, Hindi, Hinglish, Telugu, Marathi, and other Indian languages as the user requests or based on their input language." },
                    { role: "user", content: message }
                ],
                temperature: 0.7,
                max_tokens: 200
            })
        });

        if (!response.ok) {
            let errorBody = null;
            const raw = await response.text();
            try {
                errorBody = JSON.parse(raw);
            } catch {
                errorBody = { message: raw };
            }
            console.error("❌ OpenRouter API Error:", response.status, errorBody);
            // Prefix the error code so frontend knows it's an UPSTREAM error, not a local route error
            return res.status(response.status).json({
                error: `OpenRouter returned ${response.status}: ` + (errorBody?.error?.message || errorBody?.message || "Unknown error"),
                details: errorBody
            });
        }

        const data = await response.json();
        const aiResponse =
            data?.choices?.[0]?.message?.content?.trim() ||
            "I couldn't generate a response";

        console.log("✅ AI Response:", aiResponse);
        // Keep frontend compatibility: it expects { response }
        res.json({ response: aiResponse });

    } catch (error) {
        console.error("❌ AI Error:", error.message);
        res.status(500).json({ error: "Failed to get AI response" });
    }
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log("✅ Server is ready to receive requests");
});

// Keep the event loop alive explicitly
setInterval(() => { }, 1000);

// Error handling
server.on('error', (error) => {
    console.error("❌ Server error:", error);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error("❌ Uncaught exception:", error);
    process.exit(1);
});

console.log(`✅ Application initialized, server listening on port ${PORT}`);


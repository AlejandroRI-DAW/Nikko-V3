import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";

const app = express();
const port = Number(process.env.PORT || 3001);
const aiServiceUrl = (process.env.AI_SERVICE_URL || "http://localhost:8000").replace(/\/$/, "");

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

app.get("/", (_, res) => {
  res.json({
    ok: true,
    service: "nikko-node-gateway",
    aiServiceUrl,
  });
});

app.get("/api/health", async (_, res) => {
  const health = {
    ok: true,
    node: true,
    aiService: false,
  };

  try {
    const response = await fetch(`${aiServiceUrl}/`, { signal: AbortSignal.timeout(3000) });
    health.aiService = response.ok;
  } catch {
    health.aiService = false;
  }

  res.status(health.aiService ? 200 : 503).json(health);
});

app.post("/api/chat", async (req, res) => {
  const { message, history, sessionId } = req.body;

  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: "message_required" });
  }

  try {
    const response = await fetch(`${aiServiceUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: String(message),
        history,
        sessionId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI service returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    res.json({
      reply: data.respuesta || data.reply || data.respuesta_usuario || "",
      info: data.info || data,
    });
  } catch (e) {
    console.error("Chat error:", e);
    res.status(500).json({
      reply: "Lo siento, ahora mismo tengo un problema tecnico, pero sigo aqui contigo.",
      error: "chat_failed",
    });
  }
});

app.post("/api/tts", async (_, res) => {
  res.status(501).json({ error: "tts_not_configured" });
});

app.post("/api/stt", upload.single("audio"), async (_, res) => {
  res.status(501).json({ error: "stt_not_configured" });
});

app.listen(port, () => {
  console.log(`Backend activo en http://localhost:${port}`);
});

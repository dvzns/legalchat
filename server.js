import express from "express";
import { WebSocketServer } from "ws";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

const WEBHOOK_URL = process.env.WEBHOOK_URL;

app.use(express.static("public"));
app.use(express.json());

// WebSocket setup
const wss = new WebSocketServer({ noServer: true });
let clients = [];

wss.on("connection", (ws) => {
  clients.push(ws);
  ws.on("close", () => {
    clients = clients.filter((c) => c !== ws);
  });
});

const server = app.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${PORT}`)
);

server.on("upgrade", (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});

// Message endpoint
app.post("/message", async (req, res) => {
  const { username, text, domain, role } = req.body;
  if (!text || !username) return res.status(400).send("Invalid");

  // Send to Discord webhook
  await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: `${username} | ${domain}${role ? " | " + role : ""}`,
      content: text,
    }),
  });

  // Broadcast to all connected clients
  const payload = JSON.stringify({ username, text, role, ts: Date.now() });
  clients.forEach((c) => c.send(payload));

  res.sendStatus(200);
});

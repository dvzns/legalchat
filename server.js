import express from "express";
import fetch from "node-fetch";
import { WebSocketServer } from "ws";
import http from "http";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// --- Storage ---
let users = {};
let bannedIPs = new Set();

if (fs.existsSync("users.json")) {
  users = JSON.parse(fs.readFileSync("users.json"));
}
if (fs.existsSync("bans.json")) {
  bannedIPs = new Set(JSON.parse(fs.readFileSync("bans.json")));
}

function saveUsers() {
  fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
}
function saveBans() {
  fs.writeFileSync("bans.json", JSON.stringify([...bannedIPs], null, 2));
}

// --- Constants ---
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK;

// --- Middleware: Ban check ---
app.use((req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  if (bannedIPs.has(ip)) {
    return res.sendFile(process.cwd() + "/public/ban.html");
  }
  next();
});

// --- Signup ---
app.post("/signup", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send("Missing fields");

  if (users[username]) {
    return res.status(400).send("User already exists");
  }

  const role = username === "ratman4090" ? "owner" : "member";

  users[username] = { password, role };
  saveUsers();

  res.json({ username, role });
});

// --- Login ---
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users[username];

  if (!user) return res.status(404).send("User not found");
  if (user.password !== password) return res.status(403).send("Invalid password");

  res.json({ username, role: user.role });
});

// --- Ban ---
app.post("/ban", (req, res) => {
  const { targetIP, username } = req.body;
  if (username !== "ratman4090") {
    return res.status(403).send("Only owner can ban");
  }

  bannedIPs.add(targetIP);
  saveBans();

  res.sendStatus(200);
});

// --- Messages ---
app.post("/message", async (req, res) => {
  const { username, text, domain, role } = req.body;
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  if (bannedIPs.has(ip)) {
    return res.status(403).send("Banned");
  }

  // send to Discord
  if (WEBHOOK_URL) {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: `${username} | ${domain}${role ? " | " + role : ""}`,
        content: text,
      }),
    });
  }

  // broadcast to clients
  const payload = JSON.stringify({ username, role, text, ts: Date.now() });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(payload);
  });

  res.sendStatus(200);
});

// --- Start ---
server.listen(3000, () => console.log("Server running on http://localhost:3000"));

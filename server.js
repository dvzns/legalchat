import express from "express"
import http from "http"
import { Server } from "./public/socket.io/dist"
import session from "express-session"
import dotenv from "dotenv"
import fetch from "node-fetch"
import path from "path"
import { fileURLToPath } from "url"

dotenv.config()

const app = express()
const server = http.createServer(app)
const io = new Server(server)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(session({
  secret: "supersecret",
  resave: false,
  saveUninitialized: false
}))
app.use(express.static(path.join(__dirname, "public")))

const users = {}
const bannedIPs = new Set()
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK

app.use((req, res, next) => {
  if (bannedIPs.has(req.ip)) return res.redirect("/ban.html")
  next()
})

app.post("/signup", (req, res) => {
  const { username, password } = req.body
  if (users[username]) return res.status(400).send("User exists")
  users[username] = { password }
  req.session.user = username
  res.sendStatus(200)
})

app.post("/login", (req, res) => {
  const { username, password } = req.body
  if (!users[username] || users[username].password !== password) return res.status(400).send("Invalid")
  req.session.user = username
  res.sendStatus(200)
})

app.post("/logout", (req, res) => {
  req.session.destroy(() => res.sendStatus(200))
})

io.use((socket, next) => {
  const req = socket.request
  const res = req.res
  session({
    secret: "supersecret",
    resave: false,
    saveUninitialized: false
  })(req, res, next)
})

io.on("connection", socket => {
  const username = socket.request.session.user
  if (!username) return socket.disconnect(true)

  socket.on("chatMessage", async msg => {
    if (bannedIPs.has(socket.handshake.address)) {
      socket.emit("chatMessage", { username: "System", message: "You are banned." })
      return
    }
    if (username === "ratman4090" && msg.startsWith("/ban ")) {
      const target = msg.split(" ")[1]
      for (const [id, s] of io.sockets.sockets) {
        if (s.request.session.user === target) {
          bannedIPs.add(s.handshake.address)
          s.disconnect(true)
        }
      }
      io.emit("chatMessage", { username: "System", message: `${target} has been banned.` })
      return
    }
    const payload = { username, message: msg }
    io.emit("chatMessage", payload)
    if (WEBHOOK_URL) {
      try {
        await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: `${username} | chat${username === "ratman4090" ? " | owner" : ""}`,
            content: msg
          })
        })
      } catch (e) {
        console.error("Webhook failed", e)
      }
    }
  })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => console.log("Server running on " + PORT))

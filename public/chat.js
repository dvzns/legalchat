const current = JSON.parse(localStorage.getItem("tp_user") || "{}");
document.getElementById("userDisplay").textContent =
  `${current.username || "Guest"} (${current.role || "member"})`;

const messagesEl = document.getElementById("messages");
const msgInput = document.getElementById("msg");
const sendBtn = document.getElementById("send");

function renderMessage(user, text, ts, role) {
  const wrap = document.createElement("div");
  wrap.className = "msgRow";

  const bubble = document.createElement("div");
  bubble.className = "bubble " + (user === current.username ? "me" : "other");

  const nameEl = document.createElement("div");
  nameEl.className = "name";
  nameEl.textContent = `${user} (${role || "member"})`;

  const textEl = document.createElement("div");
  textEl.textContent = text;

  const time = document.createElement("div");
  time.className = "time";
  time.textContent = new Date(ts).toLocaleTimeString();

  bubble.appendChild(nameEl);
  bubble.appendChild(textEl);
  bubble.appendChild(time);
  wrap.appendChild(bubble);
  messagesEl.appendChild(wrap);

  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// WebSocket connect
const ws = new WebSocket(`ws://${window.location.host}`);
ws.onmessage = (event) => {
  const { username, text, ts, role } = JSON.parse(event.data);
  renderMessage(username, text, ts, role);
};

async function sendMessage() {
  const text = msgInput.value.trim();
  if (!text) return;
  renderMessage(current.username, text, Date.now(), current.role);
  msgInput.value = "";
  await fetch("/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: current.username,
      text,
      domain: window.location.host,
      role: current.role || null
    }),
  });
}

sendBtn.addEventListener("click", sendMessage);
msgInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

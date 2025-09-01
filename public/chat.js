const user = JSON.parse(localStorage.getItem("user"));
if (!user) {
  window.location.href = "login.html";
}

const messagesDiv = document.getElementById("messages");
const form = document.getElementById("chatForm");
const input = document.getElementById("message");
const logoutBtn = document.getElementById("logoutBtn");

const ws = new WebSocket(`ws://${window.location.host}`);

ws.onopen = () => {
  ws.send(JSON.stringify({ type: "join", username: user.username }));
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  if (msg.system) {
    addSystemMessage(msg.text);
  } else {
    addMessage(msg.username, msg.role, msg.text);
  }
};

function addMessage(username, role, text) {
  const div = document.createElement("div");
  div.classList.add("message");
  if (role === "owner") div.classList.add("owner");
  div.textContent = `${username}${role === "owner" ? " | owner" : ""}: ${text}`;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addSystemMessage(text) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.style.fontStyle = "italic";
  div.style.color = "#666";
  div.textContent = text;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  await fetch("/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: user.username,
      role: user.role,
      domain: window.location.hostname,
      text,
    }),
  });

  input.value = "";
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("user");
  window.location.href = "login.html";
});

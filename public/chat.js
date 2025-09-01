const username = localStorage.getItem("username");
const role = localStorage.getItem("role");
const domain = window.location.hostname;

if (!username) {
  window.location.href = "login.html";
}

const messagesDiv = document.getElementById("messages");
const form = document.getElementById("chatForm");
const input = document.getElementById("message");
const logoutBtn = document.getElementById("logoutBtn");

// WebSocket setup
const ws = new WebSocket(`ws://${window.location.host}`);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  addMessage(data.username, data.role, data.text);
};

// Form send
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  await fetch("/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, text, domain, role }),
  });

  input.value = "";
});

// Add message to UI
function addMessage(user, userRole, text) {
  const msg = document.createElement("div");
  msg.classList.add("message");
  if (userRole === "owner") msg.classList.add("owner");

  msg.innerHTML = `<strong>${user}${userRole === "owner" ? " | owner" : ""}:</strong> ${text}`;
  messagesDiv.appendChild(msg);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Logout
logoutBtn.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "index.html";
});

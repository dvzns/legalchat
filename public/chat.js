const socket = io()
const messagesDiv = document.getElementById("messages")
const chatForm = document.getElementById("chatForm")
const messageInput = document.getElementById("message")
const logoutBtn = document.getElementById("logoutBtn")

socket.on("chatMessage", data => {
  const div = document.createElement("div")
  div.classList.add("message")
  if (data.username === "ratman4090") div.classList.add("owner")
  div.innerHTML = `<strong>${data.username}${data.username === "ratman4090" ? " | owner" : ""}:</strong> ${data.message}`
  messagesDiv.appendChild(div)
  messagesDiv.scrollTop = messagesDiv.scrollHeight
})

chatForm.addEventListener("submit", e => {
  e.preventDefault()
  const msg = messageInput.value
  if (msg.trim()) {
    socket.emit("chatMessage", msg)
    messageInput.value = ""
  }
})

logoutBtn.addEventListener("click", async () => {
  await fetch("/logout", { method: "POST" })
  window.location.href = "/"
})

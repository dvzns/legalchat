function renderMessage(user, text, ts, role, ip) {
  const wrap = document.createElement("div");
  wrap.className = "msgRow";

  const bubble = document.createElement("div");
  bubble.className = "bubble " + (user === current.username ? "me" : "other");

  const nameEl = document.createElement("div");
  nameEl.className = "name";
  nameEl.textContent = user;

  if (role === "owner") {
    const icon = document.createElement("img");
    icon.src = "crown.png";
    icon.alt = "owner";
    icon.className = "roleIcon";
    nameEl.appendChild(icon);
  }

  // Show ban button if owner
  if (current.username === "ratman4090" && user !== "ratman4090") {
    const banBtn = document.createElement("button");
    banBtn.textContent = "🚫 Ban";
    banBtn.onclick = async () => {
      await fetch("/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetIP: ip, username: current.username }),
      });
    };
    nameEl.appendChild(banBtn);
  }

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

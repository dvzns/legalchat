document.getElementById("signupForm").addEventListener("submit", async e => {
  e.preventDefault()
  const username = document.getElementById("username").value
  const password = document.getElementById("password").value
  const res = await fetch("/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
  if (res.ok) {
    window.location.href = "/chat.html"
  } else {
    alert("Signup failed")
  }
})

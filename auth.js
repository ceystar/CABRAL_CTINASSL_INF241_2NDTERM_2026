//Frontend authentication logic for login and registration


/* ---------- AUTH CONFIGURATION ---------- */
const AUTH_URL = "http://localhost:5000/api/auth";

/* ---------- LOGIN ---------- */
$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = $("#username").value.trim();
  const password = $("#password").value;
  const err = $("#loginErr");

  err.textContent = "";

  if (!username || !password) {
    err.textContent = "Enter your username and password.";
    return;
  }

  try {
    const response = await fetch(`${AUTH_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed.");
    }

    localStorage.setItem("esumbong_user", JSON.stringify({
      name: data.username
    }));

    window.location.href = "home.html";

  } catch (error) {
    err.textContent = error.message || "Could not connect to the backend.";
  }
});

/* ---------- REGISTER ---------- */
$("#registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = $("#regUser").value.trim();
  const password = $("#regPass").value;
  const password2 = $("#regPass2").value;
  const err = $("#regErr");

  err.textContent = "";

  if (username.length < 3) {
    err.textContent = "Username must be at least 3 characters.";
    return;
  }

  if (password.length < 4) {
    err.textContent = "Password must be at least 4 characters.";
    return;
  }

  if (password !== password2) {
    err.textContent = "Passwords don't match.";
    return;
  }

  try {
    const response = await fetch(`${AUTH_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Registration failed.");
    }

    localStorage.setItem("esumbong_user", JSON.stringify({
      name: data.username
    }));

    window.location.href = "home.html";

  } catch (error) {
    err.textContent = error.message || "Could not connect to the backend.";
  }
});

/* ---------- AUTH TABS ---------- */
function setAuth(mode) {
  const up = mode === "up";

  $("#loginForm").classList.toggle("hidden", up);
  $("#registerForm").classList.toggle("hidden", !up);

  $("#tabIn").setAttribute("aria-selected", !up);
  $("#tabUp").setAttribute("aria-selected", up);

  $("#authTitle").textContent = up
    ? "Create your account"
    : "Welcome back";

  $("#authSub").textContent = up
    ? "Register to start reporting issues in your community."
    : "Sign in to report and track community issues.";

  $("#loginErr").textContent = "";
  $("#regErr").textContent = "";
}

document.querySelectorAll("[data-auth]").forEach(button => {
  button.onclick = () => setAuth(button.dataset.auth);
});

/* ---------- SHOW PASSWORD ---------- */
document.querySelectorAll("[data-show]").forEach(checkbox => {
  checkbox.onchange = () => {
    document.querySelectorAll(checkbox.dataset.show).forEach(input => {
      input.type = checkbox.checked ? "text" : "password";
    });
  };
});

/* ---------- FORGOT PASSWORD ---------- */
$("#forgotBtn").onclick = () => {
  alert("Contact the City IT Office to reset your account.");
};

/* ---------- TERMS ---------- */
$("#termsBtn").onclick = () => {
  alert(
    "Submit only truthful and accurate reports.\n" +
    "Do not upload offensive or unrelated content.\n" +
    "Emergencies: call 911 first."
  );
};

/* ---------- INITIAL AUTH TAB ---------- */
setAuth("in");

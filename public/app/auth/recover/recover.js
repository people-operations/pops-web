let generatedToken = "";
let timerInterval;
let timeLeft = 30;

// Gera token aleatório de 5 dígitos
function generateToken() {
  return String(Math.floor(10000 + Math.random() * 90000));
}

// Simula envio de e-mail (substitua por chamada real de API)
function sendTokenToEmail(email, token) {
  // Aqui você faria uma chamada para o backend enviar o e-mail
  alert(`(Simulação) Código enviado para ${email}: ${token}`);

  console.log(`Código enviado para ${email}: ${token}`);
}

function startTimer() {
  timeLeft = 30;
  const timerEl = document.getElementById("timer");
  const resendBtn = document.getElementById("resend-token-btn");
  timerEl.textContent = "00:30";
  resendBtn.style.display = "none";
  timerInterval = setInterval(() => {
    timeLeft--;
    timerEl.textContent = `00:${timeLeft.toString().padStart(2, "0")}`;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerEl.textContent = "Expirado";
      resendBtn.style.display = "block";
    }
  }, 1000);
}

// Reenviar código
document.getElementById("resend-token-btn").onclick = function () {
  const email = document.getElementById("recover-email").value.trim();
  if (!email) return;
  generatedToken = generateToken();
  sendTokenToEmail(email, generatedToken);
  Array.from(document.querySelectorAll(".token-digit")).forEach(
    (input) => (input.value = "")
  );
  document.getElementById("token-error").textContent = "";
  startTimer();
  document.querySelector(".token-digit").focus();
};

// Avança para etapa
function showStep(step) {
  ["step-email", "step-token", "step-password", "step-success"].forEach(
    (id) => {
      document.getElementById(id).style.display = "none";
    }
  );
  document.getElementById(step).style.display = "flex";
}

// Etapa 1: Enviar token
document.getElementById("send-token-btn").onclick = function () {
  const email = document.getElementById("recover-email").value.trim();
  if (!email) return;
  generatedToken = generateToken();
  sendTokenToEmail(email, generatedToken);
  showStep("step-token");
  Array.from(document.querySelectorAll(".token-digit")).forEach(
    (input) => (input.value = "")
  );
  document.getElementById("token-error").textContent = "";
  startTimer();
  document.querySelector(".token-digit").focus();
};

// Navegação e validação automática dos inputs de código
document.querySelectorAll(".token-digit").forEach((input, idx, arr) => {
  input.addEventListener("input", function () {
    if (this.value.length === 1 && idx < arr.length - 1) {
      arr[idx + 1].focus();
    }
    // Se todos os campos estiverem preenchidos, valida automaticamente
    const code = Array.from(arr)
      .map((i) => i.value)
      .join("");
    if (code.length === 5) {
      validarTokenAutomatico(code);
    }
  });
  input.addEventListener("keydown", function (e) {
    if (e.key === "Backspace" && !this.value && idx > 0) arr[idx - 1].focus();
  });
});

// Função de validação automática do token
function validarTokenAutomatico(code) {
  if (code !== generatedToken) {
    document.getElementById("token-error").textContent = "Código incorreto.";
    return;
  }
  if (timeLeft <= 0) {
    document.getElementById("token-error").textContent = "Código expirado.";
    return;
  }
  clearInterval(timerInterval);
  showStep("step-password");
  document.getElementById("password-error").textContent = "";
}

document.querySelectorAll(".toggle-password").forEach((el) => {
  el.addEventListener("click", function () {
    const input = document.getElementById(el.getAttribute("data-target"));
    const eyeClosed = el.querySelector(".eye-closed");
    const eyeOpen = el.querySelector(".eye-open");
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    eyeClosed.style.display = isPassword ? "none" : "";
    eyeOpen.style.display = isPassword ? "" : "none";
  });
  el.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      el.click();
      e.preventDefault();
    }
  });
});

// Etapa 3: Redefinir senha
document.getElementById("save-password-btn").onclick = function () {
  const pass = document.getElementById("new-password").value;
  const conf = document.getElementById("confirm-password").value;
  if (!pass || !conf) {
    document.getElementById("password-error").textContent =
      "Preencha ambos os campos.";
    return;
  }
  if (pass.length < 6) {
    document.getElementById("password-error").textContent =
      "A senha deve ter pelo menos 6 caracteres.";
    return;
  }
  if (pass !== conf) {
    document.getElementById("password-error").textContent =
      "As senhas não coincidem.";
    return;
  }
  // Aqui você faria a chamada para salvar a nova senha no backend
  showStep("step-success");
};

// Voltar para login
document.getElementById("go-login-btn").onclick = function () {
  window.location.href = "../login.html";
};

// Estrelas animadas no fundo do painel direito
function startStarsBg() {
  const canvas = document.getElementById("stars-bg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  function resize() {
    // Ajusta para o tamanho do painel
    const parent = canvas.parentElement;
    canvas.width = parent.offsetWidth;
    canvas.height = parent.offsetHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  // Configuração das estrelas
  const STAR_COUNT = 60;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.5,
      speed: Math.random() * 0.3 + 0.1,
      alpha: Math.random() * 0.5 + 0.5,
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const star of stars) {
      ctx.save();
      ctx.globalAlpha = star.alpha;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, 2 * Math.PI);
      ctx.fillStyle = "#fff";
      ctx.shadowColor = "#fff";
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();

      // Movimento suave para cima
      star.y -= star.speed;
      if (star.y < 0) {
        star.y = canvas.height + star.r;
        star.x = Math.random() * canvas.width;
      }
    }
    requestAnimationFrame(animate);
  }
  animate();
}

window.addEventListener("DOMContentLoaded", startStarsBg);

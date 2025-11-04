import { apiService } from "../../assets/js/apiService.js";

// =====================
// Utilidades de Senha
// =====================
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("toggle-password");
const eyeClosed = document.getElementById("eye-closed");
const eyeOpen = document.getElementById("eye-open");

// Alternância de visibilidade da senha
if (togglePassword) {
  togglePassword.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    eyeClosed.style.display = isPassword ? "none" : "inline";
    eyeOpen.style.display = isPassword ? "inline" : "none";
  });
  togglePassword.addEventListener("keydown", (e) => {
    // Permite alternar com Enter ou Espaço para acessibilidade
    if (e.key === "Enter" || e.key === " ") {
      togglePassword.click();
      e.preventDefault();
    }
  });
}

// =====================
// Animação de Estrelas
// =====================
function startStarsBg() {
  const canvas = document.getElementById("stars-bg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // Ajusta o tamanho do canvas para o tamanho do painel
  function resize() {
    const parent = canvas.parentElement;
    canvas.width = parent.offsetWidth;
    canvas.height = parent.offsetHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  // Cria as estrelas com propriedades aleatórias
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

  // Função de animação: desenha e move as estrelas
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
      // Move a estrela para cima; se sair do topo, volta para baixo
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
// O canvas de estrelas é iniciado após o DOM estar pronto
window.addEventListener("DOMContentLoaded", startStarsBg);

// =====================
// Login
// =====================
document.getElementById("login-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    window.showNotification("warning", "Por favor, preencha todos os campos.");
    return;
  }

  apiService
    .login(email, password)
    .then((data) => {
      if (data && data.idToken) {
        localStorage.setItem("idToken", data.idToken);
        localStorage.setItem("userEmail", data.email);
        // Salva apenas o número do localId
        if (data.localId) {
          const match = data.localId.match(/_(\d+)$/);
          if (match && match[1]) {
            localStorage.setItem("userId", match[1]);
          }
        }
        window.showNotification("success", "Login realizado com sucesso!");
        setTimeout(() => {
          window.location.href = "../pages/dashboard/dashboard.html";
        }, 1200);
      } else {
        window.showNotification(
          "error",
          "Falha no login. Verifique suas credenciais."
        );
      }
    })
    .catch((err) => {
      console.error("Erro ao fazer login:", err);
      window.showNotification(
        "error",
        "Erro ao fazer login. Tente novamente mais tarde."
      );
    });
});

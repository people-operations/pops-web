// Adiciona um listener para o evento de envio do formulário de login
document.getElementById("login-form").addEventListener("submit", (e) => {
  // Impede o comportamento padrão do formulário (recarregar a página)
  e.preventDefault();

  // Obtém e sanitiza o valor do campo de e-mail
  const email = document.getElementById("email").value.trim();
  // Obtém o valor do campo de senha
  const password = document.getElementById("password").value;

  // Validação simples: verifica se ambos os campos estão preenchidos
  if (!email || !password) {
    alert("Por favor, preencha todos os campos.");
    return;
  }

  // Aqui seria implementada a lógica de autenticação (ex: chamada à API)
  console.log("Email:", email);
  console.log("Senha:", password);

  // Exibe mensagem de sucesso (apenas para demonstração)
  alert("Login realizado com sucesso!");
  window.location.href = "../pages/dashboard/dashboard.html";
});

// Alternar visibilidade da senha
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("toggle-password");
const eyeClosed = document.getElementById("eye-closed");
const eyeOpen = document.getElementById("eye-open");

if (togglePassword) {
  togglePassword.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    eyeClosed.style.display = isPassword ? "none" : "inline";
    eyeOpen.style.display = isPassword ? "inline" : "none";
  });
  // Acessibilidade: permite usar Enter/Espaço
  togglePassword.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      togglePassword.click();
      e.preventDefault();
    }
  });
}

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

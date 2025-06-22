// ----------------------
// LÓGICA DO FORMULÁRIO DE LOGIN
// ----------------------

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
  // Redireciona para o dashboard após login fictício
  window.location.href = "../pages/dashboard/dashboard.html";
});

// ----------------------
// ALTERNÂNCIA DE VISIBILIDADE DA SENHA
// ----------------------

// Seletores dos elementos relacionados à senha
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("toggle-password");
const eyeClosed = document.getElementById("eye-closed");
const eyeOpen = document.getElementById("eye-open");

if (togglePassword) {
  // Clique no ícone alterna entre mostrar e ocultar senha
  togglePassword.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    eyeClosed.style.display = isPassword ? "none" : "inline";
    eyeOpen.style.display = isPassword ? "inline" : "none";
  });
  // Acessibilidade: permite alternar com Enter ou Espaço
  togglePassword.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      togglePassword.click();
      e.preventDefault();
    }
  });
}

// ----------------------
// ANIMAÇÃO DE ESTRELAS NO FUNDO DO PAINEL DIREITO
// ----------------------

/**
 * Inicia a animação de estrelas no canvas de fundo
 */
function startStarsBg() {
  const canvas = document.getElementById("stars-bg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // Ajusta o tamanho do canvas conforme o painel
  function resize() {
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
      r: Math.random() * 1.2 + 0.5, // Raio da estrela
      speed: Math.random() * 0.3 + 0.1, // Velocidade de subida
      alpha: Math.random() * 0.5 + 0.5, // Transparência
    });
  }

  // Função de animação das estrelas
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
      // Se a estrela sair do topo, volta para baixo em posição aleatória
      if (star.y < 0) {
        star.y = canvas.height + star.r;
        star.x = Math.random() * canvas.width;
      }
    }
    requestAnimationFrame(animate);
  }
  animate();
}

// Inicia a animação das estrelas ao carregar a página
window.addEventListener("DOMContentLoaded", startStarsBg);

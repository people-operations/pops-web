// ===================== DOM READY =====================
document.addEventListener("DOMContentLoaded", () => {
  // ===================== SAUDAÇÃO =====================
  const greetingElement = document.getElementById("greeting");
  if (greetingElement) {
    greetingElement.textContent = "Bem-vindo ao meu projeto!";
  }

  // ===================== EVENTO DO BOTÃO =====================
  const button = document.getElementById("myButton");
  if (button) {
    button.addEventListener("click", () => {
      alert("Botão clicado!");
    });
  }

  // ===================== REQUISIÇÃO FETCH =====================
  fetch("https://api.exemplo.com/dados")
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
    })
    .catch((error) => console.error("Erro ao buscar dados:", error));
});

// Função para aplicar o tema salvo ou padrão
function applyTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  document.getElementById("theme-icon").textContent =
    theme === "dark" ? "🌙" : "🌞";
}

// Ao carregar a página, aplica o tema salvo
document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme") || "light";
  applyTheme(savedTheme);

  document.getElementById("theme-toggle").addEventListener("click", () => {
    const currentTheme = document.body.classList.contains("dark")
      ? "dark"
      : "light";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  });
});

// Função para aplicar o tema salvo ou padrão
function applyTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  const icon = document.getElementById("theme-icon");
  if (icon) {
    icon.textContent = theme === "dark" ? "🌙" : "🌞";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  let savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark" || savedTheme === "light") {
    applyTheme(savedTheme);
  } else {
    // Detecta horário local do usuário
    const hour = new Date().getHours();
    const autoTheme = hour >= 6 && hour < 18 ? "light" : "dark";
    applyTheme(autoTheme);
    localStorage.setItem("theme", autoTheme);
  }

  document.getElementById("theme-toggle").addEventListener("click", () => {
    const currentTheme = document.body.classList.contains("dark")
      ? "dark"
      : "light";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  });
});

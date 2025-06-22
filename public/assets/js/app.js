/**
 * Aplica o tema (dark ou light) ao body e atualiza o ícone do tema.
 * @param {string} theme - O tema a ser aplicado ("dark" ou "light").
 */
function applyTheme(theme) {
  // Adiciona ou remove a classe "dark" no body conforme o tema selecionado
  document.body.classList.toggle("dark", theme === "dark");

  // Atualiza o ícone do tema, se existir
  const icon = document.getElementById("theme-icon");
  if (icon) {
    icon.textContent = theme === "dark" ? "🌙" : "🌞";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Recupera o tema salvo no localStorage, se existir
  let savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark" || savedTheme === "light") {
    // Se houver tema salvo, aplica ele
    applyTheme(savedTheme);
  } else {
    // Se não houver tema salvo, define automaticamente pelo horário do dia
    const hour = new Date().getHours();
    // Das 6h às 18h: tema claro, fora desse intervalo: tema escuro
    const autoTheme = hour >= 6 && hour < 18 ? "light" : "dark";
    applyTheme(autoTheme);
    localStorage.setItem("theme", autoTheme);
  }

  // Adiciona evento de clique no botão de alternância de tema
  document.getElementById("theme-toggle").addEventListener("click", () => {
    // Verifica o tema atual
    const currentTheme = document.body.classList.contains("dark")
      ? "dark"
      : "light";
    // Alterna para o outro tema
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    // Salva o novo tema e aplica
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  });
});

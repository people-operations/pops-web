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

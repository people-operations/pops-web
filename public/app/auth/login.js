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
});

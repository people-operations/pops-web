describe("Login Form", () => {
  beforeEach(() => {
    // Configura o DOM simulado
    document.body.innerHTML = `
      <form id="login-form">
        <input type="email" id="email" name="email" />
        <input type="password" id="password" name="password" />
        <button type="submit" class="btn">Entrar</button>
      </form>
    `;
    // Importa o script do login (precisa ser feito após o DOM)
    require("./login.js");
  });

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("deve alertar se os campos estiverem vazios", () => {
    window.alert = jest.fn();

    const form = document.getElementById("login-form");
    form.dispatchEvent(new Event("submit", { bubbles: true }));

    expect(window.alert).toHaveBeenCalledWith(
      "Por favor, preencha todos os campos."
    );
  });

  it("deve exibir mensagem de sucesso se os campos estiverem preenchidos", () => {
    window.alert = jest.fn();
    window.console.log = jest.fn();

    document.getElementById("email").value = "teste@teste.com";
    document.getElementById("password").value = "123456";

    const form = document.getElementById("login-form");
    form.dispatchEvent(new Event("submit", { bubbles: true }));

    expect(window.alert).toHaveBeenCalledWith("Login realizado com sucesso!");
    expect(window.console.log).toHaveBeenCalledWith(
      "Email:",
      "teste@teste.com"
    );
    expect(window.console.log).toHaveBeenCalledWith("Senha:", "123456");
  });
});

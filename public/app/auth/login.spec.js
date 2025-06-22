/**
 * Testes unitários para a lógica do login (login.js)
 * Utiliza Jest + JSDOM para simular o DOM.
 */

describe("Login Page", () => {
  let emailInput, passwordInput, form, alertMock, locationMock;

  beforeEach(() => {
    // Monta o DOM necessário para os testes
    document.body.innerHTML = `
      <form id="login-form">
        <input type="email" id="email" />
        <input type="password" id="password" />
        <button type="submit">Entrar</button>
      </form>
      <span id="theme-icon"></span>
      <button id="theme-toggle"></button>
      <span id="eye-closed"></span>
      <span id="eye-open"></span>
    `;

    emailInput = document.getElementById("email");
    passwordInput = document.getElementById("password");
    form = document.getElementById("login-form");

    // Mock do alert e do location
    alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});
    locationMock = jest
      .spyOn(window.location, "href", "set")
      .mockImplementation(() => {});
    // Recarrega o script do login para registrar os listeners
    jest.resetModules();
    require("./login.js");
  });

  afterEach(() => {
    alertMock.mockRestore();
    locationMock.mockRestore();
    jest.resetModules();
  });

  it("deve alertar se o e-mail estiver vazio", () => {
    emailInput.value = "";
    passwordInput.value = "123456";
    form.dispatchEvent(new Event("submit", { bubbles: true }));
    expect(alertMock).toHaveBeenCalledWith(
      "Por favor, preencha todos os campos."
    );
  });

  it("deve alertar se a senha estiver vazia", () => {
    emailInput.value = "teste@teste.com";
    passwordInput.value = "";
    form.dispatchEvent(new Event("submit", { bubbles: true }));
    expect(alertMock).toHaveBeenCalledWith(
      "Por favor, preencha todos os campos."
    );
  });

  it("deve permitir login com campos preenchidos", () => {
    emailInput.value = "teste@teste.com";
    passwordInput.value = "123456";
    form.dispatchEvent(new Event("submit", { bubbles: true }));
    expect(alertMock).toHaveBeenCalledWith("Login realizado com sucesso!");
    expect(locationMock).toHaveBeenCalledWith(
      "../pages/dashboard/dashboard.html"
    );
  });
});

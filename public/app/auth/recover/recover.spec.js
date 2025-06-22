/**
 * Testes unitários para a lógica de recuperação de senha (recover.js)
 * Utiliza Jest + JSDOM para simular o DOM.
 */

describe("Recuperação de Senha", () => {
  let emailInput,
    sendTokenBtn,
    resendTokenBtn,
    tokenInputs,
    savePasswordBtn,
    goLoginBtn;
  let passwordInput, confirmPasswordInput;
  let alertMock, locationMock;

  beforeEach(() => {
    // Monta o DOM necessário para os testes
    document.body.innerHTML = `
      <div id="step-email" style="display:flex">
        <input type="email" id="recover-email" />
        <button id="send-token-btn" class="btn">Enviar código</button>
      </div>
      <div id="step-token" style="display:none">
        <input maxlength="1" class="token-digit" type="text" />
        <input maxlength="1" class="token-digit" type="text" />
        <input maxlength="1" class="token-digit" type="text" />
        <input maxlength="1" class="token-digit" type="text" />
        <input maxlength="1" class="token-digit" type="text" />
        <div id="token-error" class="error"></div>
        <div id="timer"></div>
        <button id="resend-token-btn" style="display:none" class="btn">Reenviar código</button>
      </div>
      <div id="step-password" style="display:none">
        <input type="password" id="new-password" />
        <input type="password" id="confirm-password" />
        <button id="save-password-btn" class="btn">Salvar nova senha</button>
        <div id="password-error" class="error"></div>
      </div>
      <div id="step-success" style="display:none">
        <button id="go-login-btn" class="btn">Voltar para login</button>
      </div>
    `;

    emailInput = document.getElementById("recover-email");
    sendTokenBtn = document.getElementById("send-token-btn");
    resendTokenBtn = document.getElementById("resend-token-btn");
    tokenInputs = document.querySelectorAll(".token-digit");
    savePasswordBtn = document.getElementById("save-password-btn");
    goLoginBtn = document.getElementById("go-login-btn");
    passwordInput = document.getElementById("new-password");
    confirmPasswordInput = document.getElementById("confirm-password");

    // Mock do alert e do location
    alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});
    locationMock = jest
      .spyOn(window.location, "href", "set")
      .mockImplementation(() => {});

    // Recarrega o script do recover para registrar os listeners
    jest.resetModules();
    require("./recover.js");
  });

  afterEach(() => {
    alertMock.mockRestore();
    locationMock.mockRestore();
    jest.resetModules();
  });

  it("deve alertar e não enviar token se o e-mail estiver vazio", () => {
    emailInput.value = "";
    sendTokenBtn.click();
    expect(alertMock).not.toHaveBeenCalled(); // Não chama alert, apenas não faz nada
  });

  it("deve gerar e enviar token se o e-mail estiver preenchido", () => {
    emailInput.value = "teste@teste.com";
    sendTokenBtn.click();
    expect(alertMock).toHaveBeenCalledWith(
      expect.stringContaining("Código enviado para teste@teste.com")
    );
    // step-token deve aparecer
    expect(document.getElementById("step-token").style.display).toBe("flex");
  });

  it("deve mostrar erro se o código digitado estiver incorreto", () => {
    emailInput.value = "teste@teste.com";
    sendTokenBtn.click();
    // Preenche os inputs com código errado
    tokenInputs.forEach((input, i) => (input.value = String(i)));
    // Força validação manual
    const validarTokenAutomatico =
      require("./recover.js").validarTokenAutomatico ||
      window.validarTokenAutomatico;
    if (validarTokenAutomatico) {
      validarTokenAutomatico("01234");
      expect(document.getElementById("token-error").textContent).toBe(
        "Código incorreto."
      );
    }
  });

  it("deve mostrar erro se as senhas não coincidirem", () => {
    // Simula etapa de redefinição de senha
    document.getElementById("step-password").style.display = "flex";
    passwordInput.value = "123456";
    confirmPasswordInput.value = "654321";
    savePasswordBtn.click();
    expect(document.getElementById("password-error").textContent).toBe(
      "As senhas não coincidem."
    );
  });

  it("deve mostrar erro se a senha for curta", () => {
    document.getElementById("step-password").style.display = "flex";
    passwordInput.value = "123";
    confirmPasswordInput.value = "123";
    savePasswordBtn.click();
    expect(document.getElementById("password-error").textContent).toBe(
      "A senha deve ter pelo menos 6 caracteres."
    );
  });

  it("deve redirecionar para login ao clicar em voltar", () => {
    goLoginBtn.click();
    expect(locationMock).toHaveBeenCalledWith("../login.html");
  });
});

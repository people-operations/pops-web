// login.spec.js
// Testes do fluxo de login

// Mocks globais
window.showNotification = jest.fn();
window.location = { href: "" };

// Mock do apiService
jest.mock("../../assets/js/apiService.js", () => ({
  apiService: {
    login: jest.fn(),
  },
}));

import { apiService } from "../../assets/js/apiService.js";

// Utilitário para criar elementos do DOM necessários
function setupDOM() {
  document.body.innerHTML = `
    <form id="login-form">
      <input id="email" value="" />
      <input id="password" value="" type="password" />
      <button type="submit">Entrar</button>
    </form>
    <div id="toggle-password"></div>
    <span id="eye-closed"></span>
    <span id="eye-open"></span>
    <canvas id="stars-bg"></canvas>
  `;
}

describe("Login Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDOM();
    // Recarrega o login.js após DOM
    require("./login.js");
  });

  it("deve exibir aviso se campos estiverem vazios", () => {
    document.getElementById("email").value = "";
    document.getElementById("password").value = "";
    document.getElementById("login-form").dispatchEvent(new Event("submit"));
    expect(window.showNotification).toHaveBeenCalledWith(
      "warning",
      expect.any(String)
    );
  });

  it("deve chamar apiService.login com email e senha", () => {
    document.getElementById("email").value = "user@teste.com";
    document.getElementById("password").value = "123";
    apiService.login.mockResolvedValue({
      idToken: "token",
      email: "user@teste.com",
    });
    document.getElementById("login-form").dispatchEvent(new Event("submit"));
    expect(apiService.login).toHaveBeenCalledWith("user@teste.com", "123");
  });

  it("deve redirecionar e mostrar sucesso se login OK", async () => {
    document.getElementById("email").value = "user@teste.com";
    document.getElementById("password").value = "123";
    apiService.login.mockResolvedValue({
      idToken: "token",
      email: "user@teste.com",
    });
    await document
      .getElementById("login-form")
      .dispatchEvent(new Event("submit"));
    setTimeout(() => {
      expect(window.location.href).toContain("dashboard.html");
      expect(window.showNotification).toHaveBeenCalledWith(
        "success",
        expect.any(String)
      );
    }, 1300);
  });

  it("deve mostrar erro se login falhar", async () => {
    document.getElementById("email").value = "user@teste.com";
    document.getElementById("password").value = "123";
    apiService.login.mockResolvedValue({});
    await document
      .getElementById("login-form")
      .dispatchEvent(new Event("submit"));
    expect(window.showNotification).toHaveBeenCalledWith(
      "error",
      expect.any(String)
    );
  });

  it("deve mostrar erro se apiService lançar exceção", async () => {
    document.getElementById("email").value = "user@teste.com";
    document.getElementById("password").value = "123";
    apiService.login.mockRejectedValue(new Error("Falha"));
    await document
      .getElementById("login-form")
      .dispatchEvent(new Event("submit"));
    expect(window.showNotification).toHaveBeenCalledWith(
      "error",
      expect.any(String)
    );
  });

  it("deve alternar visibilidade da senha ao clicar", () => {
    const passwordInput = document.getElementById("password");
    const togglePassword = document.getElementById("toggle-password");
    const eyeClosed = document.getElementById("eye-closed");
    const eyeOpen = document.getElementById("eye-open");
    passwordInput.type = "password";
    togglePassword.click();
    expect(passwordInput.type).toBe("text");
    expect(eyeClosed.style.display).toBe("none");
    expect(eyeOpen.style.display).toBe("inline");
  });
});

// =========================
// VARIÁVEIS DE CONTROLE
// =========================
let generatedToken = ""; // Armazena o token gerado
let timerInterval; // Referência do timer
let timeLeft = 30; // Tempo restante para expiração do token

// =========================
// GERAÇÃO E ENVIO DE TOKEN
// =========================

// Gera um token aleatório de 5 dígitos
function generateToken() {
  return String(Math.floor(10000 + Math.random() * 90000));
}

// Função utilitária para tradução
function t(key) {
  if (window.i18n && typeof window.i18n.t === "function") {
    return window.i18n.t(key);
  }
  // fallback: retorna a chave
  return key;
}

// Simula o envio do token por e-mail (substitua por chamada real de API)
function sendTokenToEmail(email, token) {
  // Aqui você faria uma chamada para o backend enviar o e-mail
  if (window.showNotification) {
    window.showNotification(
      "success",
      `(Simulação) ${t("recover.code_sent")} (${email}: ${token})`
    );
  }
  console.log(`${t("recover.code_sent")} ${email}: ${token}`);
}

// =========================
// TIMER PARA REENVIO DE CÓDIGO
// =========================
function startTimer() {
  timeLeft = 30;
  const timerEl = document.getElementById("timer");
  const resendBtn = document.getElementById("resend-token-btn");
  timerEl.textContent = "00:30";
  u;
  resendBtn.style.display = "none";
  timerInterval = setInterval(() => {
    timeLeft--;
    timerEl.textContent = `00:${timeLeft.toString().padStart(2, "0")}`;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerEl.textContent = t("recover.code_error"); // Expirado
      resendBtn.style.display = "block";
    }
  }, 1000);
}

// =========================
// REENVIO DE TOKEN
// =========================
document.getElementById("resend-token-btn").onclick = function () {
  const email = document.getElementById("recover-email").value.trim();
  if (!email) return;
  generatedToken = generateToken();
  sendTokenToEmail(email, generatedToken);
  // Limpa campos e mensagens
  Array.from(document.querySelectorAll(".token-digit")).forEach(
    (input) => (input.value = "")
  );
  document.getElementById("token-error").textContent = "";
  startTimer();
  document.querySelector(".token-digit").focus();
};

// =========================
// CONTROLE DE ETAPAS DO FLUXO
// =========================
function showStep(step) {
  ["step-email", "step-token", "step-password", "step-success"].forEach(
    (id) => {
      document.getElementById(id).style.display = "none";
    }
  );
  document.getElementById(step).style.display = "flex";
}

// =========================
// ETAPA 1: ENVIAR TOKEN
// =========================
document.getElementById("send-token-btn").onclick = function () {
  const email = document.getElementById("recover-email").value.trim();
  if (!email) return;
  generatedToken = generateToken();
  sendTokenToEmail(email, generatedToken);
  showStep("step-token");
  // Limpa campos e mensagens
  Array.from(document.querySelectorAll(".token-digit")).forEach(
    (input) => (input.value = "")
  );
  document.getElementById("token-error").textContent = "";
  startTimer();
  document.querySelector(".token-digit").focus();
};

// =========================
// INPUTS DO CÓDIGO DE VERIFICAÇÃO
// =========================
document.querySelectorAll(".token-digit").forEach((input, idx, arr) => {
  input.addEventListener("input", function () {
    // Avança para o próximo campo ao digitar
    if (this.value.length === 1 && idx < arr.length - 1) {
      arr[idx + 1].focus();
    }
    // Se todos os campos estiverem preenchidos, valida automaticamente
    const code = Array.from(arr)
      .map((i) => i.value)
      .join("");
    if (code.length === 5) {
      validarTokenAutomatico(code);
    }
  });
  input.addEventListener("keydown", function (e) {
    // Volta para o campo anterior ao apagar
    if (e.key === "Backspace" && !this.value && idx > 0) arr[idx - 1].focus();
  });
});

// =========================
// VALIDAÇÃO AUTOMÁTICA DO TOKEN
// =========================
function validarTokenAutomatico(code) {
  if (code !== generatedToken) {
    document.getElementById("token-error").textContent =
      t("recover.code_error");
    return;
  }
  if (timeLeft <= 0) {
    document.getElementById("token-error").textContent =
      t("recover.code_error");
    return;
  }
  clearInterval(timerInterval);
  showStep("step-password");
  document.getElementById("password-error").textContent = "";
}

// =========================
// BOTÃO DE MOSTRAR/OCULTAR SENHA
// =========================
document.querySelectorAll(".toggle-password").forEach((el) => {
  el.addEventListener("click", function () {
    const input = document.getElementById(el.getAttribute("data-target"));
    const eyeClosed = el.querySelector(".eye-closed");
    const eyeOpen = el.querySelector(".eye-open");
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    eyeClosed.style.display = isPassword ? "none" : "";
    eyeOpen.style.display = isPassword ? "" : "none";
  });
  // Acessibilidade: alterna com Enter ou Espaço
  el.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      el.click();
      e.preventDefault();
    }
  });
});

// =========================
// ETAPA 3: REDEFINIR SENHA
// =========================
document.getElementById("save-password-btn").onclick = function () {
  const pass = document.getElementById("new-password").value;
  const conf = document.getElementById("confirm-password").value;
  if (!pass || !conf) {
    document.getElementById("password-error").textContent = t(
      "recover.password_error"
    );
    return;
  }
  if (pass.length < 6) {
    document.getElementById("password-error").textContent = t(
      "recover.password_error"
    );
    return;
  }
  if (pass !== conf) {
    document.getElementById("password-error").textContent = t(
      "recover.password_error"
    );
    return;
  }
  // Aqui você faria a chamada para salvar a nova senha no backend
  showStep("step-success");
};

// =========================
// ETAPA 4: VOLTAR PARA LOGIN
// =========================
document.getElementById("go-login-btn").onclick = function () {
  window.location.href = "../login.html";
};

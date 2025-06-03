// =======================
// ELEMENTOS DA INTERFACE
// =======================
const leftLoginCTA = document.getElementById("leftLoginCTA");
const leftRegisterForm = document.getElementById("leftRegisterForm");
const rightLoginForm = document.getElementById("rightLoginForm");
const rightRegisterCTA = document.getElementById("rightRegisterCTA");
const showRegisterBtn = document.getElementById("showRegister");
const showLoginBtn = document.getElementById("showLogin");
const submitRegisterLeft = document.getElementById("submitRegisterLeft");
const submitLoginRight = document.getElementById("submitLoginRight");

// =======================
// TROCA DE TELAS (LOGIN <-> CADASTRO)
// =======================
showRegisterBtn.addEventListener("click", () => {
  leftLoginCTA.style.display = "none";
  leftRegisterForm.style.display = "";
  leftRegisterForm.style.flexDirection = "";
  rightLoginForm.style.display = "none";
  rightRegisterCTA.style.display = "";
});

showLoginBtn.addEventListener("click", () => {
  leftRegisterForm.style.display = "none";
  leftLoginCTA.style.display = "";
  rightRegisterCTA.style.display = "none";
  rightLoginForm.style.display = "";
  rightLoginForm.style.flexDirection = "";
});

// =======================
// CAPTCHA (ATUALIZAR IMAGEM)
// =======================
document.getElementById("refreshCaptcha").addEventListener("click", () => {
  const img = document.getElementById("captchaImage");
  img.src = "captcha.png?ts=" + new Date().getTime();
});

// =======================
// SUBMISSÃO DE FORMULÁRIOS (DEMO)
// =======================
submitLoginRight.addEventListener("click", (e) => {
  e.preventDefault();
  alert("Login enviado!");
});

submitRegisterLeft.addEventListener("click", (e) => {
  e.preventDefault();
  alert("Cadastro enviado!");
});

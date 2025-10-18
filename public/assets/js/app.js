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
    if (theme === "dark") {
      icon.innerHTML = `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="11" cy="11" r="5" stroke="currentColor" stroke-width="2"/>
        <g stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="11" y1="1" x2="11" y2="3"/>
          <line x1="11" y1="19" x2="11" y2="21"/>
          <line x1="1" y1="11" x2="3" y2="11"/>
          <line x1="19" y1="11" x2="21" y2="11"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="16.36" y1="16.36" x2="17.78" y2="17.78"/>
          <line x1="4.22" y1="17.78" x2="5.64" y2="16.36"/>
          <line x1="16.36" y1="5.64" x2="17.78" y2="4.22"/>
        </g>
        <circle cx="11" cy="11" r="3" fill="currentColor" opacity="0.5"/>
      </svg>`;
    } else {
      icon.innerHTML = `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="11" cy="11" r="5" stroke="currentColor" stroke-width="2"/>
        <g stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="11" y1="1" x2="11" y2="3"/>
          <line x1="11" y1="19" x2="11" y2="21"/>
          <line x1="1" y1="11" x2="3" y2="11"/>
          <line x1="19" y1="11" x2="21" y2="11"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="16.36" y1="16.36" x2="17.78" y2="17.78"/>
          <line x1="4.22" y1="17.78" x2="5.64" y2="16.36"/>
          <line x1="16.36" y1="5.64" x2="17.78" y2="4.22"/>
        </g>
      </svg>`;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Recupera o tema salvo no localStorage, se existir
  let savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark" || savedTheme === "light") {
    applyTheme(savedTheme);
  } else {
    const hour = new Date().getHours();
    const autoTheme = hour >= 6 && hour < 18 ? "light" : "dark";
    applyTheme(autoTheme);
    localStorage.setItem("theme", autoTheme);
    savedTheme = autoTheme;
  }

  // Sincroniza o select de aparência
  const appearanceSelect = document.getElementById("appearance-select");
  if (appearanceSelect) {
    if (savedTheme === "dark") appearanceSelect.value = "Modo escuro";
    else appearanceSelect.value = "Modo claro";
    appearanceSelect.addEventListener("change", () => {
      const theme = appearanceSelect.value === "Modo escuro" ? "dark" : "light";
      localStorage.setItem("theme", theme);
      applyTheme(theme);
    });
  }

  // Adiciona evento de clique no botão de alternância de tema
  document.getElementById("theme-toggle").addEventListener("click", () => {
    const currentTheme = document.body.classList.contains("dark") ? "dark" : "light";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
    // Atualiza o select de aparência
    if (appearanceSelect) {
      appearanceSelect.value = newTheme === "dark" ? "Modo escuro" : "Modo claro";
    }
  });
});

window.pop = {
  init: () => {
    // Evitar múltiplas execuções
    if (document.getElementById("pop-secret")) return;

    // Cria overlay escuro
    const overlay = document.createElement("div");
    overlay.id = "pop-secret";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.95)";
    overlay.style.zIndex = "9999";
    overlay.style.display = "flex";
    overlay.style.flexDirection = "column";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.color = "#ffffff";
    overlay.style.fontFamily = "monospace";
    overlay.style.fontSize = "1.5rem";
    overlay.style.textAlign = "center";
    overlay.style.padding = "20px";

    // Mensagem digitando
    const message = document.createElement("div");
    message.id = "pop-secret-message";
    overlay.appendChild(message);

    // Botão para fechar
    const button = document.createElement("button");
    button.innerText = "Fechar realidade";
    button.style.marginTop = "30px";
    button.style.padding = "12px 24px";
    button.style.fontSize = "1rem";
    button.style.border = "none";
    button.style.borderRadius = "8px";
    button.style.background = "#7b2ff7";
    button.style.color = "#fff";
    button.style.cursor = "pointer";
    button.onclick = () => overlay.remove();

    overlay.appendChild(button);
    document.body.appendChild(overlay);

    // Efeito "digitando" da mensagem
    const fullText =
      "🎉 Parabéns! Você encontrou o segredo oculto...\n\n😅 Mas não tem nada .\n\nOu será que tem?";
    let i = 0;
    const speed = 40;
    function typeWriter() {
      if (i < fullText.length) {
        message.innerHTML += fullText.charAt(i);
        i++;
        setTimeout(typeWriter, speed);
      }
    }
    typeWriter();
  },
};

function toggleDropdown() {
  const dropdown = document.getElementById("dropdown");
  dropdown.classList.toggle("hidden");
}

// Fecha o menu se clicar fora dele
window.addEventListener("click", function (e) {
  const avatar = document.querySelector(".avatar");
  const dropdown = document.getElementById("dropdown");
  if (!avatar.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.classList.add("hidden");
  }
});

document.querySelector(".avatar").addEventListener("click", function (e) {
  e.stopPropagation();
  toggleDropdown();
});
document.querySelector(".chevron").addEventListener("click", function (e) {
  e.stopPropagation();
  toggleDropdown();
});

window.addEventListener("click", function (e) {
  const dropdown = document.getElementById("dropdown");
  if (!dropdown.classList.contains("hidden")) {
    dropdown.classList.add("hidden");
  }
});

// Esconde o loader e mostra o conteúdo principal após as traduções
document.addEventListener("DOMContentLoaded", () => {
  const tryShowContent = () => {
    if (
      window.i18n &&
      window.i18n.messages &&
      Object.keys(window.i18n.messages).length > 0
    ) {
      const loader = document.getElementById("loader");
      if (loader) loader.classList.add("hidden");
      const mainContent = document.getElementById("main-content");
      if (mainContent) mainContent.classList.remove("hidden");
    } else {
      setTimeout(tryShowContent, 50);
    }
  };
  tryShowContent();
});

// =========================
// SISTEMA DE NOTIFICAÇÕES TOAST
// =========================

/**
 * Exibe uma notificação toast no canto superior direito
 * @param {'success'|'error'|'warning'} type - Tipo da notificação
 * @param {string} message - Mensagem a ser exibida
 */
window.showNotification = function(type, message) {
  // Cria container se não existir
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.position = 'fixed';
    container.style.top = '32px';
    container.style.right = '32px';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '12px';
    document.body.appendChild(container);
  }

  // Cria o toast
  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.textContent = message;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');

  // Adiciona botão de fechar
  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = () => toast.remove();
  toast.appendChild(closeBtn);

  container.appendChild(toast);

  // Remove automaticamente após 4s
  setTimeout(() => {
    toast.remove();
  }, 4000);
};
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
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const currentTheme = document.body.classList.contains("dark") ? "dark" : "light";
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      localStorage.setItem("theme", newTheme);
      applyTheme(newTheme);
      // Atualiza o select de aparência
      if (appearanceSelect) {
        appearanceSelect.value = newTheme === "dark" ? "Modo escuro" : "Modo claro";
      }
    });
  }
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
  if (avatar && dropdown) {
    if (!avatar.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.add("hidden");
    }
  }
});

const avatarEl = document.querySelector(".avatar");
if (avatarEl) {
  avatarEl.addEventListener("click", function (e) {
    e.stopPropagation();
    toggleDropdown();
  });
}
const chevronEl = document.querySelector(".chevron");
if (chevronEl) {
  chevronEl.addEventListener("click", function (e) {
    e.stopPropagation();
    toggleDropdown();
  });
}

window.addEventListener("click", function (e) {
  const dropdown = document.getElementById("dropdown");
  if (dropdown && !dropdown.classList.contains("hidden")) {
    dropdown.classList.add("hidden");
  }
});

// Esconde o loader e mostra o conteúdo principal após as traduções
// MAS NÃO esconde se estiver em página de formulário (squads-form ou projects-form) - tanto em modo criação quanto edição
document.addEventListener("DOMContentLoaded", () => {
  const tryShowContent = () => {
    if (
      window.i18n &&
      window.i18n.messages &&
      Object.keys(window.i18n.messages).length > 0
    ) {
      // Verifica se está em página de formulário
      // Páginas de formulário (squads-form, projects-form) mantêm o loader ativo para carregar projetos/dados
      const currentPath = window.location.pathname;
      const isFormPage = currentPath.includes('squads-form') || currentPath.includes('projects-form');
      
      // Se estiver em página de formulário, NÃO esconde o loader aqui
      // O loader será escondido apenas quando os dados/projetos terminarem de carregar
      // Para outras páginas (como squads-detail, projects-detail), esconde normalmente
      if (!isFormPage) {
        const loader = document.getElementById("loader");
        if (loader) loader.classList.add("hidden");
        const mainContent = document.getElementById("main-content");
        if (mainContent) mainContent.classList.remove("hidden");
      }
    } else {
      setTimeout(tryShowContent, 50);
    }
  };
  tryShowContent();
});

// =========================
// FUNÇÕES REUTILIZÁVEIS
// =========================

/**
 * Inicializa o avatar do usuário com a primeira letra do email
 */
window.initAvatar = function() {
  const avatar = document.querySelector(".avatar");
  const email = localStorage.getItem("userEmail");
  if (avatar && email && typeof email === "string" && email.length > 0) {
    avatar.textContent = email[0].toUpperCase();
  }
};

/**
 * Configura o link de perfil para redirecionar com userId
 */
window.initProfileLink = function() {
  const profileLink = document.getElementById("profile-link");
  if (profileLink) {
    profileLink.addEventListener("click", function (e) {
      e.preventDefault();
      const userId = localStorage.getItem("userId");
      // Determina o caminho base baseado na localização atual
      const currentPath = window.location.pathname;
      let basePath = "../collaborators/collaborators-detail/collaborators-detail.html";
      
      // Ajusta o caminho baseado na profundidade da página
      if (currentPath.includes("/collaborators-detail/")) {
        basePath = "collaborators-detail.html";
      } else if (currentPath.includes("/collaborators/") && !currentPath.includes("/collaborators-detail/")) {
        basePath = "collaborators-detail/collaborators-detail.html";
      } else if (currentPath.includes("/squads-detail/") || currentPath.includes("/projects-detail/")) {
        basePath = "../../collaborators/collaborators-detail/collaborators-detail.html";
      } else if (currentPath.includes("/squads-form/") || currentPath.includes("/projects-form/")) {
        basePath = "../../collaborators/collaborators-detail/collaborators-detail.html";
      } else if (currentPath.includes("/configurations/")) {
        basePath = "../../collaborators/collaborators-detail/collaborators-detail.html";
      } else if (currentPath.includes("/dashboard/")) {
        basePath = "../collaborators/collaborators-detail/collaborators-detail.html";
      }
      
      if (userId) {
        window.location.href = `${basePath}?id=${userId}`;
      } else {
        window.location.href = basePath;
      }
    });
  }
};

/**
 * Decodifica um JWT token e retorna o payload
 */
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Token JWT inválido');
    }
    
    // Decodifica o payload (segunda parte do token)
    const payload = parts[1];
    // Substitui caracteres base64url para base64 padrão
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // Adiciona padding se necessário
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    // Decodifica
    const decoded = JSON.parse(atob(padded));
    return decoded;
  } catch (error) {
    console.error('Erro ao decodificar token JWT:', error);
    return null;
  }
}

/**
 * Obtém o access_level do token JWT
 */
function getAccessLevelFromToken() {
  try {
    const token = localStorage.getItem("idToken");
    if (!token) {
      return null;
    }
    
    const payload = decodeJWT(token);
    return payload?.access_level ? Number(payload.access_level) : null;
  } catch (error) {
    console.error('Erro ao obter access_level:', error);
    return null;
  }
}

/**
 * Aplica controle de acesso aos elementos com data-require-access
 */
window.applyAccessControl = function() {
  const accessLevel = getAccessLevelFromToken();
  
  if (accessLevel === null || accessLevel === undefined) {
    // Se não houver token, oculta todos os elementos protegidos
    document.querySelectorAll('[data-require-access]').forEach(element => {
      element.style.display = 'none';
    });
    return;
  }
  
  // Processa elementos com data-require-access
  document.querySelectorAll('[data-require-access]').forEach((element) => {
    const requiredLevel = element.getAttribute('data-require-access');
    // Suporta números separados por vírgula: "1,2" ou "1, 2"
    const levels = requiredLevel.split(',').map((l) => Number(l.trim()));
    
    if (!levels.includes(accessLevel)) {
      element.style.display = 'none';
    }
  });
};

/**
 * Adiciona atributos de controle de acesso aos links da navbar
 * Links de Colaboradores e Configurações (Tipos/Status de Projeto) só aparecem para access_level 1 ou 2
 */
window.setupNavbarAccessControl = function() {
  // Adiciona atributo data-require-access em todos os links de colaboradores na navbar
  document.querySelectorAll('nav a[href*="collaborators.html"]').forEach(link => {
    if (!link.hasAttribute('data-require-access')) {
      link.setAttribute('data-require-access', '1,2');
    }
  });
  
  // Adiciona atributo data-require-access em todos os links de tipos/status de projeto na sidebar
  document.querySelectorAll('aside a[href*="project-types"], aside a[href*="project-status"]').forEach(link => {
    if (!link.hasAttribute('data-require-access')) {
      link.setAttribute('data-require-access', '1,2');
    }
  });
};

// Inicializa automaticamente quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", function () {
  window.initAvatar();
  window.initProfileLink();
  
  // Configura controle de acesso da navbar
  window.setupNavbarAccessControl();
  
  // Aplica controle de acesso aos elementos com data-require-access
  window.applyAccessControl();
  
  // Dashboard agora está disponível para todos os níveis (1, 2 e 3)
  // Níveis 1 e 2 veem dashboard de gestão, nível 3 vê dashboard de colaborador
  // Removido código que ocultava link do dashboard para colaboradores
});
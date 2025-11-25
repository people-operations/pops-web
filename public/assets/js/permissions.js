import { getAccessLevel } from "./apiService.js";

/**
 * Sistema de controle de acesso baseado em access_level
 */

/**
 * Verifica se o usuário tem um determinado nível de acesso
 * @param {number|number[]|string|string[]} requiredLevel - Nível(s) de acesso requerido(s) (1,2 para manager, 3 para colaborador)
 * @returns {boolean} - true se o usuário tem permissão
 */
export function hasAccess(requiredLevel) {
  const accessLevel = getAccessLevel();
  
  if (accessLevel === null || accessLevel === undefined) {
    return false;
  }

  // Normaliza para número
  const userLevel = Number(accessLevel);

  // Se for array, verifica se o access_level está na lista
  if (Array.isArray(requiredLevel)) {
    const normalizedLevels = requiredLevel.map(l => Number(l));
    return normalizedLevels.includes(userLevel);
  }

  // Compara diretamente (converte para número se necessário)
  const required = Number(requiredLevel);
  return userLevel === required;
}

/**
 * Verifica se o usuário tem pelo menos um dos níveis de acesso especificados
 * Útil para hierarquias (1,2 = manager, 3 = colaborador)
 * @param {number[]|string[]} levels - Array de níveis (1,2 para manager, 3 para colaborador)
 * @returns {boolean} - true se o usuário tem pelo menos um dos níveis
 */
export function hasAnyAccess(levels) {
  const accessLevel = getAccessLevel();
  
  if (accessLevel === null || accessLevel === undefined) {
    return false;
  }

  const userLevel = Number(accessLevel);
  const normalizedLevels = levels.map(l => Number(l));
  return normalizedLevels.includes(userLevel);
}

/**
 * Aplica controle de acesso a elementos HTML baseado em data attributes
 * Procura por elementos com data-require-access e mostra/oculta conforme permissão
 */
export function applyAccessControl() {
  // Elementos que requerem acesso específico
  document.querySelectorAll("[data-require-access]").forEach((element) => {
    const requiredLevel = element.getAttribute("data-require-access");
    // Suporta números separados por vírgula: "1,2" ou "1, 2"
    const levels = requiredLevel.split(",").map((l) => l.trim());
    
    if (!hasAnyAccess(levels)) {
      element.style.display = "none";
      // Ou remover completamente: element.remove();
    }
  });

  // Elementos que devem ser desabilitados (não removidos)
  document.querySelectorAll("[data-disable-if-no-access]").forEach((element) => {
    const requiredLevel = element.getAttribute("data-disable-if-no-access");
    // Suporta números separados por vírgula: "1,2" ou "1, 2"
    const levels = requiredLevel.split(",").map((l) => l.trim());
    
    if (!hasAnyAccess(levels)) {
      element.disabled = true;
      element.style.opacity = "0.5";
      element.style.cursor = "not-allowed";
      element.title = "Você não tem permissão para esta ação";
    }
  });
}

/**
 * Protege uma função para executar apenas se o usuário tiver permissão
 * @param {number|number[]|string|string[]} requiredLevel - Nível(s) de acesso requerido(s) (1,2 para manager, 3 para colaborador)
 * @param {Function} callback - Função a ser executada se tiver permissão
 * @param {Function} onDenied - Função opcional a ser executada se não tiver permissão
 * @returns {Function} - Função protegida
 */
export function protectFunction(requiredLevel, callback, onDenied = null) {
  return function (...args) {
    if (hasAccess(requiredLevel)) {
      return callback.apply(this, args);
    } else {
      if (onDenied) {
        onDenied();
      } else {
        window.showNotification?.(
          "error",
          "Você não tem permissão para realizar esta ação."
        );
      }
      return null;
    }
  };
}

/**
 * Redireciona para login se não houver token
 * Útil para proteger páginas inteiras
 */
export function requireAuth() {
  const token = localStorage.getItem("idToken");
  if (!token) {
    window.location.href = "../auth/login.html";
    return false;
  }
  return true;
}

/**
 * Redireciona se o usuário não tiver o nível de acesso necessário
 * @param {number|number[]|string|string[]} requiredLevel - Nível(s) de acesso requerido(s) (1,2 para manager, 3 para colaborador)
 * @param {string} redirectTo - URL para redirecionar (padrão: dashboard)
 */
export function requireAccess(requiredLevel, redirectTo = "../pages/dashboard/dashboard.html") {
  if (!hasAccess(requiredLevel)) {
    window.showNotification?.(
      "error",
      "Você não tem permissão para acessar esta página."
    );
    setTimeout(() => {
      window.location.href = redirectTo;
    }, 1500);
    return false;
  }
  return true;
}

/**
 * Obtém o nível de acesso atual do usuário
 * @returns {number|null} - O access_level atual como número (1,2 para manager, 3 para colaborador) ou null
 */
export function getCurrentAccessLevel() {
  return getAccessLevel();
}

/**
 * Verifica se o usuário é manager (access_level 1 ou 2)
 * @returns {boolean} - true se for manager
 */
export function isManager() {
  return hasAnyAccess([1, 2]);
}

/**
 * Verifica se o usuário é colaborador (access_level 3)
 * @returns {boolean} - true se for colaborador
 */
export function isCollaborator() {
  return hasAccess(3);
}


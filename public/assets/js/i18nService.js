// Classe responsável por gerenciar internacionalização (i18n)
class I18nService {
  constructor() {
    this.messages = {}; // Armazena as traduções carregadas
  }

  /**
   * Carrega o arquivo JSON de traduções para o idioma especificado
   * @param {string} locale - Código do idioma (ex: "pt-br")
   */
  async init(locale = "pt-br") {
    const res = await fetch(`/assets/i18n/${locale}.json`);
    if (!res.ok) throw new Error("Falha ao carregar traduções");
    this.messages = await res.json();
  }

  /**
   * Busca uma tradução usando chave aninhada (ex: "menu.login")
   * @param {string} key - Chave da tradução
   * @returns {string} - Tradução encontrada ou a própria chave se não existir
   */
  t(key) {
    return (
      key.split(".").reduce((o, k) => (o ? o[k] : null), this.messages) || key
    );
  }

  /**
   * Aplica as traduções nos elementos da página:
   * - [data-i18n]: substitui o texto do elemento
   * - [data-i18n-placeholder]: substitui o placeholder do elemento
   */
  apply() {
    // Aplica tradução ao texto dos elementos
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const msg = this.t(el.dataset.i18n);
      if (msg !== undefined && msg !== null) el.innerHTML = msg;
    });
    // Aplica tradução ao placeholder dos elementos
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const msg = this.t(el.dataset.i18nPlaceholder);
      if (msg) el.placeholder = msg;
    });
  }
}

// Cria uma instância única (singleton) do serviço de i18n e expõe globalmente
window.i18n = new I18nService();

// Inicializa o serviço de i18n ao carregar a página
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await i18n.init("pt-br"); // Carrega traduções na língua especificada
    i18n.apply(); // Aplica as traduções na página
    if (typeof renderSquads === "function") {
      renderSquads(); // Garante squads traduzidos
      i18n.apply(); // Aplica novamente para elementos dinâmicos
    }
  } catch (err) {
    console.error(err); // Exibe erro caso falhe ao carregar traduções
  }
});

class I18nService {
  constructor() {
    this.messages = {};
  }

  // carrega o JSON de traduções
  async init(locale = "pt-br") {
    const res = await fetch(`../../assets/i18n/${locale}.json`);
    if (!res.ok) throw new Error("Falha ao carregar traduções");
    this.messages = await res.json();
  }

  // obtém valor aninhado por chave “a.b.c”
  t(key) {
    return (
      key.split(".").reduce((o, k) => (o ? o[k] : null), this.messages) || key
    );
  }

  // aplica em todos os elementos data-i18n e data-i18n-placeholder
  apply() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const msg = this.t(el.dataset.i18n);
      if (msg) el.textContent = msg;
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const msg = this.t(el.dataset.i18nPlaceholder);
      f;
    });
  }
}

// inicializa o serviço de i18n ao carregar a página
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await i18n.init("pt-br");
    i18n.apply();
  } catch (err) {
    console.error(err);
  }
});

// exponha como singleton
window.i18n = new I18nService();

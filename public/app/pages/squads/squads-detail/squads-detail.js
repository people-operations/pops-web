document.addEventListener("DOMContentLoaded", function () {
  // Seletores dos botões
  const editBtn = document.querySelector(
    '.summary-actions .action-icon[alt="Editar"]'
  );
  const trashBtn = document.querySelector(
    '.summary-actions .action-icon[alt="Remover"]'
  );
  const modal = document.getElementById("delete-modal");
  const overlay = document.getElementById("deleteModalOverlay");
  const confirmDelete = document.getElementById("confirm-delete");
  const cancelDelete = document.getElementById("cancel-delete");
  const closeDeleteModal = document.getElementById("closeDeleteModal");

  // Redireciona para o formulário de edição
  if (editBtn) {
    editBtn.addEventListener("click", function () {
      window.location.href = "../squads-form/squads-form.html";
    });
  }

  // Função para mostrar o modal
  function showDeleteModal() {
    console.log("Showing delete modal");
    modal.classList.add("modal-open");
    modal.classList.remove("hidden");
    overlay.classList.remove("hidden");
  }

  // Função para esconder o modal
  function hideDeleteModal() {
    modal.classList.remove("modal-open");
    modal.classList.add("hidden");
    overlay.classList.add("hidden");
  }

  // Abre o modal de confirmação ao clicar no trash
  if (trashBtn) {
    trashBtn.addEventListener("click", function (e) {
      e.preventDefault();
      showDeleteModal();
    });
  }

  // Fecha o modal ao cancelar ou clicar no X ou overlay
  [cancelDelete, closeDeleteModal, overlay].forEach((el) => {
    if (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        hideDeleteModal();
      });
    }
  });

  // Confirma exclusão (aqui só fecha o modal, implemente a lógica real se necessário)
  if (confirmDelete) {
    confirmDelete.addEventListener("click", function () {
      window.location.href = "../squads.html";
      hideDeleteModal();
    });
  }

  // FILTRO DE PROJETOS POR STATUS
  const statusSelect = document.getElementById("status-select");
  const projectCards = document.querySelectorAll(".project-card");

  if (statusSelect) {
    statusSelect.addEventListener("change", function () {
      const selected = statusSelect.value;
      projectCards.forEach((card) => {
        const statusSpan = card.querySelector(".project-status");
        if (!statusSpan) return;
        const statusText = statusSpan.textContent.trim();
        if (
          selected === "Todos" ||
          selected === "" ||
          statusText === selected
        ) {
          card.style.display = "flex";
        } else {
          card.style.display = "none";
        }
      });
    });
  }

  // Dados mockados dos membros (igual ao HTML original)
  const membros = [
    {
      nome: "Mateus Fantin",
      status: "Status aqui",
      funcoes: ["Techlead", "Desenvolvedor Sênior Back-end"],
      horasAlocadas: "00hrs",
      horasDisponiveis: "00hrs",
    },
    {
      nome: "Ana Souza",
      status: "Status aqui",
      funcoes: ["Desenvolvedor Júnior"],
      horasAlocadas: "20hrs",
      horasDisponiveis: "180hrs",
    },
    {
      nome: "Carlos Lima",
      status: "Status aqui",
      funcoes: ["DevOps"],
      horasAlocadas: "15hrs",
      horasDisponiveis: "185hrs",
    },
  ];

  // Dados mockados dos projetos (igual ao HTML original)
  const projetos = [
    {
      titulo: "E‑commerce Platform",
      status: "Em andamento",
      comeco: "01/06/2024",
      fim: "10/06/2025",
    },
    {
      titulo: "CMS Rewrite",
      status: "Em andamento",
      comeco: "15/01/2025",
      fim: "15/07/2025",
    },
    {
      titulo: "API Gateway Upgrade",
      status: "Planejado",
      comeco: "01/06/2025",
      fim: "01/08/2025",
    },
  ];

  // Função para renderizar membros
  function renderMembros() {
    const membersList = document.getElementById("members-list");
    if (!membersList) return;
    membersList.innerHTML = membros
      .map(
        (membro) => `
        <div class="member-card card">
          <div class="member-header">
            <strong>${membro.nome}</strong>
            <span class="status-badge">${membro.status}</span>
          </div>
          <p class="custom-p custom-margin function"><span data-i18n="squads_detail.functions"></span></p>
          <div class="tags">
            ${membro.funcoes.map((f) => `<span>${f}</span>`).join(" ")}
          </div>
          <p class="custom-p"><span data-i18n="squads_detail.allocated"></span> ${
            membro.horasAlocadas
          }</p>
          <p class="custom-p"><span data-i18n="squads_detail.available"></span> ${
            membro.horasDisponiveis
          }</p>
        </div>
      `
      )
      .join("");
    if (window.i18n) window.i18n.apply();
  }

  // Função para renderizar projetos
  function renderProjetos() {
    const projectsCards = document.getElementById("projects-cards");
    if (!projectsCards) return;
    projectsCards.innerHTML = projetos
      .map(
        (projeto) => `
        <div class="project-card card">
          <div class="project-info">
            <div class="project-title">
              <strong class="project-title">${projeto.titulo}</strong>
              <span class="project-status">${projeto.status}</span>
            </div>
            <div class="dates">
              <span>
                <img src="../../../../assets/svg/calendar.svg" style="height: 32px; vertical-align: middle" />
                <span data-i18n="squads_detail.start"></span> ${projeto.comeco}
              </span>
              <span>
                <img src="../../../../assets/svg/calendar.svg" style="height: 32px; vertical-align: middle" />
                <span data-i18n="squads_detail.end"></span> ${projeto.fim}
              </span>
            </div>
          </div>
        </div>
      `
      )
      .join("");
    if (window.i18n) window.i18n.apply();
  }

  // Função para preencher valores dinâmicos de stats e finanças
  function preencherValoresDetalhes() {
    // Valores mockados (poderiam vir de API futuramente)
    const used = 190;
    const total = 200;
    const percent = 95;
    const score = 4.5;
    const monthlyValue = 37500;
    const budgetValue = 58000;
    // Preenche campos de stats
    const i18n = window.i18n;
    if (i18n) {
      document.getElementById("allocated-hours").textContent =
        i18n.t("squads_detail.allocated_hours_value").replace("{used}", used);
      document.getElementById("allocated-hours-available").textContent =
        i18n.t("squads_detail.allocated_hours_available").replace("{total}", total);
      document.getElementById("overload-index").textContent =
        i18n.t("squads_detail.overload_index_value").replace("{percent}", percent);
      document.getElementById("satisfaction-index").textContent =
        i18n.t("squads_detail.satisfaction_index_value").replace("{score}", score);
      document.getElementById("monthly-investment").textContent =
        i18n.t("squads_detail.monthly_investment_value").replace("{value}", monthlyValue.toLocaleString("pt-BR"));
      document.getElementById("total-budget").textContent =
        i18n.t("squads_detail.total_budget_value").replace("{value}", budgetValue.toLocaleString("pt-BR"));
    }
  }

  // Função para garantir que valores dinâmicos só sejam preenchidos após o i18n.apply()
  function preencherQuandoTraduzido() {
    // Espera até que o texto do título já esteja traduzido
    const titulo = document.querySelector('[data-i18n="squads_detail.team_title"]');
    if (!titulo || titulo.innerText === 'squads_detail.team_title') {
      setTimeout(preencherQuandoTraduzido, 50);
      return;
    }
    preencherValoresDetalhes();
  }

  renderMembros();
  renderProjetos();
  preencherQuandoTraduzido();
});

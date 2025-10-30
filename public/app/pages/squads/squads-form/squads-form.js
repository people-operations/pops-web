// Exemplo de dados dos membros
const membros = [
  {
    nome: "Ana Souza",
    funcoes: ["Product Owner", "Analista"],
    horasAlocadas: "20hrs",
    horasDisponiveis: "20hrs",
  },
  {
    nome: "Carlos Lima",
    funcoes: ["Techlead", "Desenvolvedor Sênior"],
    horasAlocadas: "32hrs",
    horasDisponiveis: "8hrs",
  },
  {
    nome: "Juliana Alves",
    funcoes: ["QA", "Tester"],
    horasAlocadas: "16hrs",
    horasDisponiveis: "24hrs",
  },
  {
    nome: "Rafael Torres",
    funcoes: ["UX Designer"],
    horasAlocadas: "40hrs",
    horasDisponiveis: "0hrs",
  },
];

function renderMembros() {
  const teamList = document.querySelector(".team-list");
  membros.forEach((membro, index) => {
    const card = document.createElement("div");
    card.className = "member-card";
    card.innerHTML = `
      <div class="member-header">
        <strong>${membro.nome}</strong>
        <div class="member-actions">
          <button class="edit-btn" data-index="${index}">
            <img src="../../../../assets/svg/edit-button.svg" alt="Editar" style="vertical-align: middle; margin-right: 12px; margin-top: 15px; width: 34px; height: 34px;" />
          </button>
          <button class="trash-btn" data-index="${index}">
            <img src="../../../../assets/svg/trash-button.svg" alt="Remover" style="vertical-align: middle; margin-right: 4px; margin-top: 15px; width: 34px; height: 34px;" />
          </button>
        </div>
      </div>
      <p class="custom-p">${i18n.t("squads_form.functions")}</p>
      <div class="tags">
        ${membro.funcoes.map((f) => `<span>${f}</span>`).join(" ")}
      </div>
      <p class="custom-p custom-margin">${i18n.t(
        "squads_form.allocated_hours"
      )}: ${membro.horasAlocadas}</p>
      <p class="custom-p custom-margin">${i18n.t(
        "squads_form.available_hours"
      )} ${membro.horasDisponiveis}</p>
    `;
  });

  // Adiciona evento de clique para remover membro
  const trashButtons = document.querySelectorAll(".trash-btn");
  trashButtons.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const idx = parseInt(this.getAttribute("data-index"));
      membros.splice(idx, 1);
      renderMembros();
    });
  });

  // Adiciona evento de clique para editar membro (abrir modal)
  const editButtons = document.querySelectorAll(".edit-btn");
  editButtons.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      showModal(true);
      // Aqui você pode preencher os campos do modal com os dados do membro, se desejar
    });
  });
}

// Inicializa o serviço de i18n e só renderiza membros após carregar traduções
function waitForI18nAndRender() {
  if (
    window.i18n &&
    typeof i18n.t === "function" &&
    i18n.messages &&
    Object.keys(i18n.messages).length > 0
  ) {
    renderMembros();
  } else {
    setTimeout(waitForI18nAndRender, 50);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", waitForI18nAndRender);
} else {
  waitForI18nAndRender();
}

function nextStep() {
  window.location.href =
    "./squads-weekly-requirements/squads-weekly-requirements.html";
}

// Garante que o botão "Próximo" chama nextStep corretamente
document.addEventListener("DOMContentLoaded", function () {
  const saveBtn = document.getElementById("save-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", nextStep);
  }
});

const mainCancelBtn = document.querySelector(".form-squad .cancel-btn");
if (mainCancelBtn) {
  mainCancelBtn.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "../squads.html";
  });
}

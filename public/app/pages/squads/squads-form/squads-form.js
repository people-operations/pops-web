import { apiService } from "../../../../assets/js/apiService.js";
// Exemplo de dados dos membros (mantido para testes locais)
const membros = [];

// Função para popular o dropdown de projetos
async function popularDropdownProjetos() {
  // Seleciona o select de projetos corretamente (segunda linha, primeira coluna)
  const selectProjeto = document.querySelector(
    ".form-squad .row:nth-of-type(2) .col:first-child select"
  );
  if (!selectProjeto) return;
  // Remove todas as opções exceto a primeira (placeholder)
  while (selectProjeto.options.length > 1) {
    selectProjeto.remove(1);
  }
  try {
    const projetos = await apiService.getAllProjects();
    if (Array.isArray(projetos)) {
      projetos.forEach((proj) => {
        const opt = document.createElement("option");
        opt.value = proj.id;
        opt.textContent = proj.name;
        selectProjeto.appendChild(opt);
      });
    }
  } catch (e) {
    // Silencioso
  }
}

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

function onReady() {
  waitForI18nAndRender();
  popularDropdownProjetos();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", onReady);
} else {
  onReady();
}


// Integração do fluxo: salva dados do formulário e avança para roles
function nextStep(e) {
  e?.preventDefault();
  const form = document.querySelector(".form-squad");
  if (!form) return;

  // Coleta dados do formulário (ajuste os selectors conforme necessário)
  const data = {
    name: form.querySelector('input[name="name"]')?.value || "",
    projectId: form.querySelector('select[name="project"]')?.value || "",
    sprintDuration: form.querySelector('input[type="text"]')?.value || "",
    description: form.querySelector('textarea')?.value || "",
    approver: form.querySelector('select')?.value || "",
    // Adicione outros campos conforme necessário
  };
  localStorage.setItem("squads.formData", JSON.stringify(data));
  window.location.href = "./squads-roles/squads-roles.html";
}

document.addEventListener("DOMContentLoaded", function () {
  const saveBtn = document.querySelector(".form-actions .save, #save-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", nextStep);
  }
  const mainCancelBtn = document.querySelector(".form-squad .cancel-btn");
  if (mainCancelBtn) {
    mainCancelBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "../squads.html";
    });
  }
});

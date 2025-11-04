import { apiService } from "../../../../assets/js/apiService.js";
// Exemplo de dados dos membros (mantido para testes locais)
const membros = [];

// Função para popular o dropdown de projetos
async function popularDropdownProjetos() {
  // Seleciona o select de projetos corretamente (segunda linha, primeira coluna)
  const selectProjeto = document.getElementById("select-project");
  if (!selectProjeto) return;
  // Limpa todas as opções
  selectProjeto.innerHTML = "";
  // Adiciona placeholder
  selectProjeto.insertAdjacentHTML(
    "beforeend",
    '<option value="" disabled selected hidden>' +
      (selectProjeto.getAttribute("data-i18n-placeholder")
        ? i18n.t(selectProjeto.getAttribute("data-i18n-placeholder"))
        : "Selecione...") +
      "</option>"
  );
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

// Popula o dropdown de aprovador com colaboradores
async function popularDropdownAprovadores() {
  // Seleciona o select de aprovador corretamente (aprovador é o QUARTO select do form)
  const selectAprovador = document.getElementById("select-approver");
  if (!selectAprovador) return;
  selectAprovador.innerHTML = "";
  // Adiciona placeholder
  selectAprovador.insertAdjacentHTML(
    "beforeend",
    '<option value="" disabled selected hidden>' +
      (selectAprovador.getAttribute("data-i18n-placeholder")
        ? i18n.t(selectAprovador.getAttribute("data-i18n-placeholder"))
        : "Selecione...") +
      "</option>"
  );
  try {
    const colaboradores = await apiService.getCollaborators();
    if (Array.isArray(colaboradores)) {
      colaboradores.forEach((colab) => {
        if (colab && colab.id && colab.name) {
          const opt = document.createElement("option");
          opt.value = colab.id;
          opt.textContent = colab.name;
          selectAprovador.appendChild(opt);
        }
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
  // Aguarda o i18n estar pronto antes de popular selects e placeholders traduzidos
  function waitForI18nAndPopulateSelects() {
    if (
      window.i18n &&
      typeof i18n.t === "function" &&
      i18n.messages &&
      Object.keys(i18n.messages).length > 0
    ) {
      popularDropdownProjetos();
      popularDropdownAprovadores();
      // Adiciona placeholder para área (desabilitado)
      const selectArea = document.getElementById("select-area");
      if (selectArea) {
        selectArea.innerHTML = "";
        selectArea.insertAdjacentHTML(
          "beforeend",
          '<option value="" disabled selected hidden>' +
            (selectArea.getAttribute("data-i18n-placeholder")
              ? i18n.t(selectArea.getAttribute("data-i18n-placeholder"))
              : "Selecione...") +
            "</option>"
        );
      }
    } else {
      setTimeout(waitForI18nAndPopulateSelects, 50);
    }
  }
  waitForI18nAndRender();
  waitForI18nAndPopulateSelects();

  // Máscara e validação para duração da sprint
  const sprintInput = document.getElementById("sprint-duration");
  const sprintMask = document.getElementById("sprint-duration-mask");
  if (sprintInput && sprintMask) {
    sprintInput.addEventListener("keydown", function (e) {
      // Bloqueia o caractere "-" e letras
      if (
        e.key === "-" ||
        e.key === "e" ||
        e.key === "+" ||
        e.key === "," ||
        e.key === "."
      ) {
        e.preventDefault();
      }
    });
    sprintInput.addEventListener("input", function (e) {
      // Remove tudo que não for dígito
      let val = this.value.replace(/\D/g, "");
      if (val.length > 3) val = val.slice(0, 3);
      this.value = val;
      // Atualiza máscara
      if (val && Number(val) > 0) {
        sprintMask.textContent =
          Number(val) === 1 ? "1 semana" : `${val} semanas`;
      } else {
        sprintMask.textContent = "";
      }
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", onReady);
} else {
  onReady();
}

// Integração do fluxo: salva dados do formulário e avança para roles

// Toast simples
function showToast(msg, type = "success") {
  if (window.showNotification) {
    window.showNotification(type, msg);
  }
}

// Modal de decisão
function showDecisionModal(onBack, onNext) {
  // Remove qualquer modal/overlay antigo
  document
    .querySelectorAll(".modal-overlay, .modal")
    .forEach((el) => el.remove());

  // Overlay
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.style.zIndex = 10000;
  document.body.appendChild(overlay);

  // Modal
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.style.zIndex = 10001;
  modal.style.display = "flex";
  modal.style.flexDirection = "column";
  modal.innerHTML = `
    <div class="d-flex align-self-center modal-header">
      <h2>Squad criada com sucesso!</h2>
    </div>
    <p style="font-size: 16px;" class="d-flex align-self-center">Deseja voltar para a listagem de squads ou prosseguir com a alocação?</p>
    <div class="form-actions" style="display: flex; gap: 12px; justify-content: center;">
      <button class="cancel" style="min-width: 160px;">Voltar para listagem</button>
      <button class="save" style="min-width: 160px;">Prosseguir</button>
    </div>
  `;
  document.body.appendChild(modal);

  // Eventos
  modal.querySelector(".cancel").onclick = () => {
    overlay.remove();
    modal.remove();
    onBack && onBack();
  };
  modal.querySelector(".save").onclick = () => {
    overlay.remove();
    modal.remove();
    // Limpa dados do localStorage e sessionStorage antes de prosseguir
    try {
      localStorage.removeItem("squads.membersSelection");
      localStorage.removeItem("squads.selectedRoles");
      localStorage.removeItem("squads.weeklyRequirements");
      sessionStorage.removeItem("squadRoles");
    } catch (e) {}
    onNext && onNext();
  };
}

async function nextStep(e) {
  e?.preventDefault();
  const form = document.querySelector(".form-squad");
  if (!form) return;

  // Coleta dados do formulário
  const name = form.querySelector('input[type="text"]')?.value?.trim() || "";
  // Busca o valor do input de duração da sprint pelo id
  const sprintDurationStr =
    form.querySelector("#sprint-duration")?.value?.trim() || "";
  const sprintDuration = parseInt(sprintDurationStr, 10) || 0;
  const description = form.querySelector("textarea")?.value?.trim() || null;
  // Ordem correta dos selects: 0-status, 1-projeto, 2-área (desabilitado), 3-aprovador
  const statusStr = form.querySelectorAll("select")[0]?.value || "active";
  const projectId = form.querySelectorAll("select")[1]?.value || null;
  // área é [2], mas está desabilitado
  const approverId = form.querySelectorAll("select")[3]?.value || null;
  const status = statusStr === "active";

  // Monta o body conforme TeamCreateRequest
  const squadBody = {
    name,
    description,
    sprintDuration,
    approverId: approverId ? Number(approverId) : null,
    projectId: projectId ? Number(projectId) : null,
    status,
  };

  try {
    const result = await apiService.insertSquad(squadBody);
    if (result && result.id) {
      showToast("Squad criada com sucesso!", "success");
      setTimeout(() => {
        showDecisionModal(
          () => (window.location.href = "../squads.html"),
          () => (window.location.href = `./squads-roles/squads-roles.html?squadId=${result.id}`)
        );
      }, 400); // espera o toast sumir
    } else {
      showToast("Erro ao criar squad.", "error");
    }
  } catch (err) {
    showToast("Erro ao criar squad.", "error");
  }
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

import { apiService } from "../../../../assets/js/apiService.js";
// Exemplo de dados dos membros (mantido para testes locais)
const membros = [];

// Função para popular o dropdown de projetos
async function popularDropdownProjetos() {
  console.log("=== INICIANDO popularDropdownProjetos ===");
  
  // Seleciona o select de projetos corretamente (segunda linha, primeira coluna)
  const selectProjeto = document.getElementById("select-project");
  if (!selectProjeto) {
    console.error("❌ Select de projeto não encontrado!");
    return;
  }
  console.log("✅ Select de projeto encontrado:", selectProjeto);
  
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
    console.log("📡 Chamando apiService.getAllProjects()...");
    const projetos = await apiService.getAllProjects();
    console.log("📦 Resposta recebida:", projetos);
    console.log("📊 Tipo da resposta:", typeof projetos);
    console.log("📊 É array?", Array.isArray(projetos));
    console.log("📊 Tamanho:", projetos ? (Array.isArray(projetos) ? projetos.length : "não é array") : "null/undefined");
    
    // Verifica se é um array válido
    if (projetos && Array.isArray(projetos)) {
      console.log(`✅ Array válido com ${projetos.length} projetos`);
      
      if (projetos.length > 0) {
        console.log("📋 Projetos encontrados:");
        projetos.forEach((proj, index) => {
          console.log(`  [${index}] ID: ${proj?.id}, Nome: ${proj?.name}`, proj);
          
          if (proj && proj.id && proj.name) {
            const opt = document.createElement("option");
            opt.value = proj.id;
            opt.textContent = proj.name;
            selectProjeto.appendChild(opt);
            console.log(`  ✅ Adicionado: ${proj.name} (ID: ${proj.id})`);
          } else {
            console.warn(`  ⚠️ Projeto inválido no índice ${index}:`, proj);
          }
        });
        console.log(`✅ Total de opções adicionadas ao select: ${selectProjeto.options.length - 1}`);
      } else {
        console.warn("⚠️ Array vazio - nenhum projeto encontrado");
      }
    } else {
      console.error("❌ Resposta não é um array válido:", projetos);
    }
  } catch (e) {
    console.error("❌ Erro ao buscar projetos:", e);
    console.error("Stack trace:", e.stack);
  }
  
  console.log("=== FIM popularDropdownProjetos ===");
}

// Popula o dropdown de aprovador com colaboradores (apenas gerentes e especialistas)
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
          // Filtrar apenas gerentes e especialistas
          const jobTitle = colab.jobTitle || "";
          const jobTitleLower = jobTitle.toLowerCase();
          const isGerente = jobTitleLower.includes("gerente");
          const isEspecialista = jobTitleLower.includes("especialista");
          
          if (isGerente || isEspecialista) {
            const opt = document.createElement("option");
            opt.value = colab.id;
            // Mostra nome e cargo
            const displayText = jobTitle ? `${colab.name} - ${jobTitle}` : colab.name;
            opt.textContent = displayText;
            selectAprovador.appendChild(opt);
          }
        }
      });
    }
  } catch (e) {
    console.error("Erro ao buscar aprovadores:", e);
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

// Função para carregar dados da squad quando estiver editando
async function loadSquadData(squadId) {
  try {
    const squad = await apiService.getSquadById(squadId);
    if (!squad) return;
    
    const form = document.querySelector(".form-squad");
    if (!form) return;
    
    // Preenche nome
    const nameInput = form.querySelector('input[type="text"]');
    if (nameInput && squad.name) {
      nameInput.value = squad.name;
    }
    
    // Preenche descrição
    const descTextarea = form.querySelector("textarea");
    if (descTextarea && squad.description) {
      descTextarea.value = squad.description;
    }
    
    // Preenche duração da sprint
    const sprintInput = document.getElementById("sprint-duration");
    if (sprintInput && squad.sprintDuration) {
      sprintInput.value = squad.sprintDuration;
      const sprintMask = document.getElementById("sprint-duration-mask");
      if (sprintMask) {
        sprintMask.textContent = squad.sprintDuration === 1 
          ? "1 semana" 
          : `${squad.sprintDuration} semanas`;
      }
    }
    
    // Preenche status
    const statusSelect = document.getElementById("select-status");
    if (statusSelect) {
      statusSelect.value = squad.status === false ? "inactive" : "active";
    }
    
    // Preenche projeto (aguarda dropdown ser populado)
    setTimeout(() => {
      const projectSelect = document.getElementById("select-project");
      if (projectSelect && squad.projectId) {
        projectSelect.value = squad.projectId;
      }
    }, 500);
    
    // Preenche aprovador (aguarda dropdown ser populado)
    setTimeout(() => {
      const approverSelect = document.getElementById("select-approver");
      if (approverSelect && squad.approverId) {
        approverSelect.value = squad.approverId;
      }
    }, 500);
    
    // Salva squadId no localStorage para uso nas próximas etapas
    localStorage.setItem("squads.editSquadId", squadId);
    localStorage.setItem("squads.sprintDuration", squad.sprintDuration?.toString() || "4");
    
  } catch (error) {
    console.error("Erro ao carregar dados da squad:", error);
  }
}

function onReady() {
  // Verifica se é edição ou criação baseado na URL
  const urlParams = new URLSearchParams(window.location.search);
  const squadId = urlParams.get('id');
  const isEdit = !!squadId;
  
  // Aguarda o i18n estar pronto antes de popular selects e placeholders traduzidos
  function waitForI18nAndPopulateSelects() {
    if (
      window.i18n &&
      typeof i18n.t === "function" &&
      i18n.messages &&
      Object.keys(i18n.messages).length > 0
    ) {
      // Atualiza o título após o i18n estar pronto
      const titleElement = document.querySelector('.step-header h2');
      if (titleElement) {
        titleElement.textContent = isEdit ? 'Edição de squad' : 'Nova squad';
        titleElement.removeAttribute('data-i18n'); // Remove o atributo para evitar sobrescrita
      }
      
      // Popula dropdowns e depois carrega dados se estiver editando
      Promise.all([
        popularDropdownProjetos(),
        popularDropdownAprovadores()
      ]).then(() => {
        // Após popular dropdowns, carrega dados da squad se estiver editando
        if (isEdit && squadId) {
          // Aguarda um pouco mais para garantir que os selects foram populados
          setTimeout(() => {
            loadSquadData(squadId);
          }, 800);
        }
      });
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
      <button class="cancel" style="height: 32px; width: 183px; font-size: 16px !important; font-weight: 500 !important; padding: 0 !important;">Voltar para listagem</button>
      <button class="save" style="height: 32px; width: 133px; font-size: 16px !important; font-weight: 500 !important; padding: 0 !important;">Prosseguir</button>
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
  // Ordem dos selects: 0-status, 1-projeto, 2-aprovador
  const statusStr = form.querySelectorAll("select")[0]?.value || "active";
  const projectId = form.querySelectorAll("select")[1]?.value || null;
  const approverId = form.querySelectorAll("select")[2]?.value || null;
  const status = statusStr === "active";

  // Salva sprintDuration no localStorage para uso nas próximas páginas
  try {
    localStorage.setItem("squads.formData", JSON.stringify({ sprintDuration }));
  } catch (e) {
    console.warn("Erro ao salvar sprintDuration:", e);
  }

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
    // Valida se já existe uma squad com o mesmo nome
    const allSquads = await apiService.getAllSquads();
    const squadsList = Array.isArray(allSquads) 
      ? allSquads 
      : (allSquads?.content || []);
    
    const duplicateSquad = squadsList.find(
      (s) => s.name && s.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    
    if (duplicateSquad) {
      showToast("Já existe uma squad com este nome. Por favor, escolha outro nome.", "error");
      return;
    }
    
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
    console.error("Erro ao criar squad:", err);
    if (err.message && err.message.includes("409")) {
      showToast("Já existe uma squad com este nome. Por favor, escolha outro nome.", "error");
    } else {
      showToast("Erro ao criar squad.", "error");
    }
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

import { apiService } from "../../../../assets/js/apiService.js";
// Exemplo de dados dos membros (mantido para testes locais)
const membros = [];

// Verifica IMEDIATAMENTE se está editando ou criando e mostra loader (antes de qualquer coisa)
(function() {
  const urlParams = new URLSearchParams(window.location.search);
  const squadId = urlParams.get('id');
  const isEdit = !!squadId;
  
  // Mostra loader tanto em modo edição quanto em modo criação (para carregar projetos)
  const loader = document.getElementById("loader");
  const mainContent = document.getElementById("main-content");
  if (loader) {
    const message = isEdit ? "Carregando dados da squad..." : "Carregando projetos...";
    loader.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;">
        <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #7d1bff; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin-bottom: 20px;"></div>
        <p style="color: #7d1bff; font-size: 16px;">${message}</p>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    loader.style.display = "flex";
    // Remove a classe hidden caso tenha sido adicionada
    loader.classList.remove("hidden");
    // Força o loader a permanecer visível com z-index alto
    loader.style.zIndex = "99999";
    loader.style.position = "fixed";
    loader.style.top = "0";
    loader.style.left = "0";
    loader.style.width = "100vw";
    loader.style.height = "100vh";
    loader.style.backgroundColor = "#fff";
  }
  if (mainContent) {
    mainContent.classList.add("hidden");
  }
})();

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
// Função para mostrar loader
function showLoader() {
  const loader = document.getElementById("loader");
  const mainContent = document.getElementById("main-content");
  if (loader) {
    loader.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;">
        <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #7d1bff; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin-bottom: 20px;"></div>
        <p style="color: #7d1bff; font-size: 16px;">Carregando dados da squad...</p>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    loader.style.display = "flex";
    // Remove a classe hidden caso tenha sido adicionada
    loader.classList.remove("hidden");
    // Força o loader a permanecer visível com z-index alto
    loader.style.zIndex = "99999";
    loader.style.position = "fixed";
    loader.style.top = "0";
    loader.style.left = "0";
    loader.style.width = "100vw";
    loader.style.height = "100vh";
    loader.style.backgroundColor = "#fff";
  }
  if (mainContent) {
    mainContent.classList.add("hidden");
  }
}

// Função para esconder loader
function hideLoader() {
  // Verifica se está em modo de edição antes de esconder
  const urlParams = new URLSearchParams(window.location.search);
  const isEditMode = urlParams.has('id');
  
  // Se estiver em modo de edição, só esconde se explicitamente chamado após dados carregarem
  // Isso previne que o loader seja escondido prematuramente
  const loader = document.getElementById("loader");
  const mainContent = document.getElementById("main-content");
  if (loader) {
    loader.style.display = "none";
    // Remove também a classe hidden caso tenha sido adicionada
    loader.classList.add("hidden");
  }
  if (mainContent) {
    mainContent.classList.remove("hidden");
  }
}

async function loadSquadData(squadId) {
  // Mostra loader antes de carregar dados
  showLoader();
  
  try {
    console.log("=== INICIANDO loadSquadData ===");
    console.log("Carregando dados da squad ID:", squadId);
    
    const squad = await apiService.getSquadById(squadId);
    console.log("Dados da squad recebidos do backend:", JSON.stringify(squad, null, 2));
    
    if (!squad) {
      console.error("❌ Squad não encontrada ou retornou null");
      alert("Erro: Squad não encontrada. Verifique se o ID está correto.");
      return;
    }
    
    const form = document.querySelector(".form-squad");
    if (!form) {
      console.error("❌ Formulário não encontrado no DOM");
      return;
    }
    console.log("✅ Formulário encontrado");
    
    // Preenche nome
    const nameInput = form.querySelector('input[type="text"]');
    if (nameInput) {
      nameInput.value = squad.name || "";
      console.log("✅ Nome preenchido:", squad.name);
    } else {
      console.warn("⚠️ Input de nome não encontrado");
    }
    
    // Preenche descrição
    const descTextarea = form.querySelector("textarea");
    if (descTextarea) {
      descTextarea.value = squad.description || "";
      console.log("✅ Descrição preenchida:", squad.description || "(vazia)");
    } else {
      console.warn("⚠️ Textarea de descrição não encontrado");
    }
    
    // Preenche duração da sprint
    const sprintInput = document.getElementById("sprint-duration");
    if (sprintInput) {
      if (squad.sprintDuration) {
        sprintInput.value = squad.sprintDuration;
        const sprintMask = document.getElementById("sprint-duration-mask");
        if (sprintMask) {
          sprintMask.textContent = squad.sprintDuration === 1 
            ? "1 semana" 
            : `${squad.sprintDuration} semanas`;
        }
        console.log("✅ Sprint duration preenchido:", squad.sprintDuration);
      } else {
        console.warn("⚠️ Sprint duration não está presente nos dados da squad");
      }
    } else {
      console.warn("⚠️ Input de sprint duration não encontrado");
    }
    
    // Preenche status
    const statusSelect = document.getElementById("select-status");
    if (statusSelect) {
      // O status vem como boolean do backend: true = active, false = inactive
      // Mas também pode vir como string "active" ou "inactive"
      let statusValue = "active"; // default
      
      if (squad.status === false || squad.status === "inactive" || squad.status === "INACTIVE") {
        statusValue = "inactive";
      } else if (squad.status === true || squad.status === "active" || squad.status === "ACTIVE") {
        statusValue = "active";
      }
      
      statusSelect.value = statusValue;
      console.log("✅ Status preenchido:", statusValue, "de:", squad.status);
    } else {
      console.warn("⚠️ Select de status não encontrado");
    }
    
    // Função auxiliar para preencher selects quando estiverem prontos
    // Aumentado retries e delay para aguardar mais tempo (até ~30 segundos)
    const fillSelectWhenReady = (selectId, value, retries = 100, delay = 300) => {
      return new Promise((resolve) => {
        const attemptFill = (attempt) => {
          const select = document.getElementById(selectId);
          console.log(`Tentativa ${attempt + 1}/${retries} para preencher ${selectId}...`);
          
          if (select) {
            console.log(`${selectId} encontrado. Número de opções:`, select.options.length);
            
            if (select.options.length > 1) {
              // Verifica se o valor existe nas opções (comparação como string e número)
              const valueStr = String(value);
              const optionExists = Array.from(select.options).some(opt => 
                opt.value === valueStr || opt.value === String(Number(value))
              );
              
              if (optionExists) {
                select.value = valueStr;
                // Dispara evento change para garantir que qualquer listener seja acionado
                select.dispatchEvent(new Event('change', { bubbles: true }));
                console.log(`✅ ${selectId} preenchido com valor:`, value);
                resolve(true);
              } else {
                console.warn(`⚠️ Valor ${value} (${typeof value}) não encontrado nas opções de ${selectId}`);
                console.log("Opções disponíveis:", Array.from(select.options).map(opt => ({ value: opt.value, text: opt.text })));
                resolve(false);
              }
            } else if (attempt < retries) {
              console.log(`${selectId} ainda não populado, aguardando...`);
              setTimeout(() => attemptFill(attempt + 1), delay);
            } else {
              console.warn(`❌ ${selectId} não foi populado após ${retries} tentativas`);
              resolve(false);
            }
          } else if (attempt < retries) {
            console.log(`${selectId} ainda não encontrado no DOM, aguardando...`);
            setTimeout(() => attemptFill(attempt + 1), delay);
          } else {
            console.error(`❌ ${selectId} não foi encontrado no DOM após ${retries} tentativas`);
            resolve(false);
          }
        };
        attemptFill(0);
      });
    };
    
    // Array de promises para aguardar todos os preenchimentos
    const fillPromises = [];
    
    // Preenche projeto (aguarda dropdown ser populado)
    if (squad.projectId) {
      console.log("Tentando preencher projeto com ID:", squad.projectId);
      fillPromises.push(
        fillSelectWhenReady("select-project", squad.projectId).then((success) => {
          if (success) {
            console.log("✅ Projeto preenchido com sucesso");
          } else {
            console.error("❌ Falha ao preencher projeto");
          }
          return success;
        })
      );
    } else {
      console.log("⚠️ Squad não tem projectId");
      // Adiciona uma promise vazia para garantir que Promise.all funcione
      fillPromises.push(Promise.resolve());
    }
    
    // Salva squadId no localStorage para uso nas próximas etapas
    localStorage.setItem("squads.editSquadId", squadId);
    localStorage.setItem("squads.sprintDuration", squad.sprintDuration?.toString() || "4");
    
    // Aguarda TODAS as operações assíncronas terminarem antes de esconder o loader
    // Isso garante que o loader permaneça visível durante todo o processo de carregamento
    Promise.all(fillPromises).then(() => {
      console.log("=== Dados da squad carregados com sucesso ===");
      // Aguarda um pequeno delay adicional para garantir que tudo foi renderizado
      setTimeout(() => {
        // Esconde loader apenas após TODOS os dados serem carregados e preenchidos
        hideLoader();
      }, 300);
    }).catch((error) => {
      console.error("Erro ao preencher campos:", error);
      // Mesmo com erro, aguarda um pouco antes de esconder o loader
      setTimeout(() => {
        hideLoader();
      }, 300);
    });
  } catch (error) {
    console.error("❌ Erro ao carregar dados da squad:", error);
    console.error("Stack trace:", error.stack);
    
    // Esconde loader mesmo em caso de erro
    hideLoader();
    
    alert(`Erro ao carregar dados da squad: ${error.message}`);
  }
}

function onReady() {
  // Verifica se é edição ou criação baseado na URL
  const urlParams = new URLSearchParams(window.location.search);
  const squadId = urlParams.get('id');
  const isEdit = !!squadId;
  
  // Mostra loader IMEDIATAMENTE se estiver editando (antes de qualquer outra coisa)
  if (isEdit && squadId) {
    // Garante que o loader inicial do HTML esteja visível
    const loader = document.getElementById("loader");
    const mainContent = document.getElementById("main-content");
    if (loader) {
      loader.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;">
          <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #7d1bff; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin-bottom: 20px;"></div>
          <p style="color: #7d1bff; font-size: 16px;">Carregando dados da squad...</p>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;
      loader.style.display = "flex";
    }
    if (mainContent) {
      mainContent.classList.add("hidden");
    }
  } else {
    // Em modo criação, esconde o loader inicial
    hideLoader();
  }
  
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
      
      // Atualiza os botões de salvar e próximo
      const saveBtn = document.getElementById("save-btn");
      const nextBtn = document.getElementById("next-btn");
      
      if (isEdit) {
        // Em modo edição, mostra ambos os botões
        if (saveBtn) {
          saveBtn.textContent = 'Salvar';
          saveBtn.style.display = 'inline-block';
          saveBtn.removeAttribute('data-i18n');
        }
        if (nextBtn) {
          nextBtn.textContent = i18n.t('squads_form.next') || 'Próximo';
        }
      } else {
        // Em modo criação, só mostra o botão de próximo
        if (saveBtn) {
          saveBtn.style.display = 'none';
        }
        if (nextBtn) {
          nextBtn.textContent = i18n.t('squads_form.next') || 'Próximo';
        }
      }
      
      // Mostra loader se estiver editando ou criando (para carregar projetos)
      if (isEdit && squadId) {
        showLoader();
      } else {
        // Em modo criação, mostra loader para carregar projetos
        showLoader();
      }
      
      // Popula dropdowns e depois carrega dados se estiver editando
      Promise.all([
        popularDropdownProjetos()
      ]).then(() => {
        // Após popular dropdowns, carrega dados da squad se estiver editando
        if (isEdit && squadId) {
          console.log("Modo edição detectado, carregando dados da squad ID:", squadId);
          // Garante que o loader esteja visível antes de carregar dados
          showLoader();
          // Aguarda um pouco para garantir que os selects foram populados
          // O loader permanecerá visível até loadSquadData terminar completamente
          setTimeout(() => {
            loadSquadData(squadId);
          }, 500); // Reduzido para 500ms pois o loader já está visível
        } else {
          console.log("Modo criação - projetos carregados");
          // Em modo criação, esconde o loader após carregar projetos
          hideLoader();
        }
      }).catch((error) => {
        console.error("Erro ao popular dropdowns:", error);
        // Mesmo com erro, tenta carregar dados se estiver editando
        if (isEdit && squadId) {
          showLoader();
          setTimeout(() => {
            loadSquadData(squadId);
          }, 500);
        } else {
          // Em modo criação, esconde loader mesmo com erro
          hideLoader();
        }
      });
    } else {
      setTimeout(waitForI18nAndPopulateSelects, 50);
    }
  }
  // Verifica se está editando ANTES de qualquer coisa e mostra loader
  const urlParamsInitial = new URLSearchParams(window.location.search);
  const squadIdInitial = urlParamsInitial.get('id');
  const isEditInitial = !!squadIdInitial;
  
  if (isEditInitial && squadIdInitial) {
    // Mostra loader IMEDIATAMENTE, antes de qualquer processamento
    showLoader();
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

// Função genérica para salvar dados da squad (usada por Salvar e Próximo)
async function saveSquadData(shouldNavigate = false) {
  const form = document.querySelector(".form-squad");
  if (!form) return null;

  // Verifica se é edição ou criação
  const urlParams = new URLSearchParams(window.location.search);
  const squadId = urlParams.get('id');
  const isEdit = !!squadId;

  // Coleta dados do formulário
  const name = form.querySelector('input[type="text"]')?.value?.trim() || "";
  // Busca o valor do input de duração da sprint pelo id
  const sprintDurationStr =
    form.querySelector("#sprint-duration")?.value?.trim() || "";
  const sprintDuration = parseInt(sprintDurationStr, 10) || 0;
  const description = form.querySelector("textarea")?.value?.trim() || null;
  // Ordem dos selects: status tem id="select-status", projeto tem id="select-project"
  const statusSelect = document.getElementById("select-status");
  const projectSelect = document.getElementById("select-project");
  const statusStr = statusSelect?.value || "active";
  const projectId = projectSelect?.value || null;
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
    projectId: projectId ? Number(projectId) : null,
    status,
  };

  try {
    if (isEdit) {
      // Modo edição - valida duplicatas (excluindo a squad atual) e atualiza
      const allSquads = await apiService.getAllSquads();
      const squadsList = Array.isArray(allSquads) 
        ? allSquads 
        : (allSquads?.content || []);
      
      // Na edição, permite manter o mesmo nome (exclui a squad atual da validação)
      const duplicateSquad = squadsList.find(
        (s) => s.id !== Number(squadId) && s.name && s.name.trim().toLowerCase() === name.trim().toLowerCase()
      );
      
      if (duplicateSquad) {
        showToast("Já existe uma squad com este nome. Por favor, escolha outro nome.", "error");
        return;
      }
      
      // Atualiza a squad existente
      const result = await apiService.updateSquad(squadId, squadBody);
      if (result) {
        showToast("Squad atualizada com sucesso!", "success");
        if (shouldNavigate) {
          // Se shouldNavigate é true, vai para o próximo step
          setTimeout(() => {
            const param = isEdit ? `id=${squadId}` : `squadId=${result.id}`;
            window.location.href = `./squads-roles/squads-roles.html?${param}`;
          }, 500);
        }
        // Se shouldNavigate é false, apenas salva e permanece na página
        return result;
      } else {
        showToast("Erro ao atualizar squad.", "error");
        return null;
      }
    } else {
      // Modo criação - valida duplicatas e cria nova squad
      const allSquads = await apiService.getAllSquads();
      const squadsList = Array.isArray(allSquads) 
        ? allSquads 
        : (allSquads?.content || []);
      
      const duplicateSquad = squadsList.find(
        (s) => s.name && s.name.trim().toLowerCase() === name.trim().toLowerCase()
      );
      
      if (duplicateSquad) {
        showToast("Já existe uma squad com este nome. Por favor, escolha outro nome.", "error");
        return null;
      }
      
      const result = await apiService.insertSquad(squadBody);
      if (result && result.id) {
        showToast("Squad criada com sucesso!", "success");
        if (shouldNavigate) {
          setTimeout(() => {
            showDecisionModal(
              () => (window.location.href = "../squads.html"),
              () => (window.location.href = `./squads-roles/squads-roles.html?squadId=${result.id}`)
            );
          }, 400);
        }
        return result;
      } else {
        showToast("Erro ao criar squad.", "error");
        return null;
      }
    }
  } catch (err) {
    console.error(`Erro ao ${isEdit ? 'atualizar' : 'criar'} squad:`, err);
    if (err.message && err.message.includes("409")) {
      showToast("Já existe uma squad com este nome. Por favor, escolha outro nome.", "error");
    } else {
      showToast(`Erro ao ${isEdit ? 'atualizar' : 'criar'} squad.`, "error");
    }
    return null;
  }
}

async function nextStep(e) {
  e?.preventDefault();
  await saveSquadData(true); // Salva e navega para próximo
}

async function saveStep(e) {
  e?.preventDefault();
  await saveSquadData(false); // Apenas salva, não navega
}

document.addEventListener("DOMContentLoaded", function () {
  const saveBtn = document.getElementById("save-btn");
  const nextBtn = document.getElementById("next-btn");
  
  if (saveBtn) {
    saveBtn.addEventListener("click", saveStep);
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", nextStep);
  }
  
  const mainCancelBtn = document.querySelector(".form-squad .cancel-btn");
  if (mainCancelBtn) {
    mainCancelBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "../squads.html";
    });
  }
});

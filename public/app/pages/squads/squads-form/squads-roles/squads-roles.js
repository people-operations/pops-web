import { apiService } from "../../../../../assets/js/apiService.js";

(() => {
  // Mostra loader IMEDIATAMENTE se estiver editando (antes de qualquer coisa)
  const urlParamsCheck = new URLSearchParams(window.location.search);
  const isEditCheck = !!urlParamsCheck.get("id");
  if (isEditCheck) {
    const loader = document.getElementById("loader");
    const mainContent = document.getElementById("main-content");
    if (loader) {
      loader.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;">
          <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #7d1bff; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin-bottom: 20px;"></div>
          <p style="color: #7d1bff; font-size: 16px;">Carregando funções...</p>
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
  }
  
  const rolesListEl = document.getElementById("rolesList");
  const addRoleBtn = document.getElementById("addRoleBtn");
  const nextBtn = document.getElementById("nextBtn");
  const backBtn = document.getElementById("backBtn");

  // Modal
  const modal = document.getElementById("roleModal");
  const overlay = document.getElementById("roleModalOverlay");
  const closeModalBtn = document.getElementById("closeRoleModal");
  const roleForm = document.getElementById("roleForm");
  const roleFunction = document.getElementById("roleFunction");
  const hardSkillsBox = document.getElementById("hardSkillsBox");
  const softSkillsBox = document.getElementById("softSkillsBox");

  let editingId = null;
  let tempHardSkills = [];
  let tempSoftSkills = [];

  // Estado inicial
  let roles = [];
  
  // Função para carregar dados existentes quando estiver editando
  async function loadExistingRoles() {
    const urlParams = new URLSearchParams(window.location.search);
    const squadId = urlParams.get("squadId") || urlParams.get("id");
    const isEdit = !!urlParams.get("id");
    
    if (!isEdit || !squadId) {
      // Se não estiver editando, carrega do sessionStorage
      try {
        roles = JSON.parse(sessionStorage.getItem("squadRoles") || "[]");
      } catch (_) {}
      hideLoader();
      renderRoles();
      updateNextState();
      return;
    }
    
    // Mostra loader IMEDIATAMENTE
    showLoader();
    
    try {
      console.log("Carregando roles existentes para squad:", squadId);
      
      // Busca detalhes da squad para pegar os membros e suas funções
      const squadDetails = await apiService.getSquadDetails(squadId);
      
      if (squadDetails && squadDetails.members && Array.isArray(squadDetails.members)) {
        // Agrupa membros por jobTitle (função)
        const rolesByJobTitle = new Map();
        let roleIdCounter = 1;
        
        squadDetails.members.forEach(member => {
          const jobTitle = member.jobTitle || "Sem função";
          const allocatedHours = member.allocatedHours || 0;
          
          if (!rolesByJobTitle.has(jobTitle)) {
            rolesByJobTitle.set(jobTitle, {
              id: roleIdCounter++, // Gera ID único
              funcao: jobTitle, // Usa 'funcao' que é o que renderRoles espera
              cargo: jobTitle, // Também adiciona 'cargo' como fallback
              quantity: 0,
              skillsByType: { // Formato esperado por renderRoles
                HARD: [],
                SOFT: []
              },
              allocatedHours: 0
            });
          }
          
          const role = rolesByJobTitle.get(jobTitle);
          role.quantity += 1;
          role.allocatedHours += allocatedHours;
          
          // NÃO adiciona skills - o usuário pediu para trazer funções SEM skills
          // As skills serão preenchidas pelo usuário se necessário
        });
        
        // Converte Map para Array
        roles = Array.from(rolesByJobTitle.values());
        
        console.log("Roles carregadas e formatadas:", roles);
        
        // Salva no sessionStorage
        sessionStorage.setItem("squadRoles", JSON.stringify(roles));
      } else {
        // Tenta carregar do sessionStorage como fallback
        try {
          roles = JSON.parse(sessionStorage.getItem("squadRoles") || "[]");
        } catch (_) {}
      }
    } catch (error) {
      console.error("Erro ao carregar roles existentes:", error);
      // Fallback: carrega do sessionStorage
      try {
        roles = JSON.parse(sessionStorage.getItem("squadRoles") || "[]");
      } catch (_) {}
    }
    
    hideLoader();
    renderRoles();
    updateNextState();
  }
  
  // Função para mostrar loader
  function showLoader() {
    const loader = document.getElementById("loader");
    const mainContent = document.getElementById("main-content");
    if (loader) {
      loader.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;">
          <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #7d1bff; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin-bottom: 20px;"></div>
          <p style="color: #7d1bff; font-size: 16px;">Carregando funções...</p>
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
  }
  
  // Função para esconder loader
  function hideLoader() {
    const loader = document.getElementById("loader");
    const mainContent = document.getElementById("main-content");
    if (loader) {
      loader.style.display = "none";
    }
    if (mainContent) {
      mainContent.classList.remove("hidden");
    }
  }
  
  // Carrega roles existentes (ou do sessionStorage se não estiver editando)
  loadExistingRoles();

  // Skills agrupadas por tipo (ex: { HARD: [], SOFT: [], ... })
  let SKILLS_BY_TYPE = {};
  let JOB_TITLES = []; // Cargos completos vindos da API

  // Função para buscar cargos únicos da API
  async function buscarCargos() {
    try {
      console.log("📡 Buscando cargos (jobTitle) dos colaboradores...");
      const colaboradores = await apiService.getCollaborators();
      console.log("📦 Colaboradores recebidos:", colaboradores);
      
      if (Array.isArray(colaboradores) && colaboradores.length > 0) {
        // Extrai jobTitle únicos e não vazios
        const cargosSet = new Set();
        colaboradores.forEach((colab) => {
          if (colab && colab.jobTitle && colab.jobTitle.trim()) {
            cargosSet.add(colab.jobTitle.trim());
          }
        });
        
        JOB_TITLES = Array.from(cargosSet).sort();
        console.log("✅ Cargos encontrados:", JOB_TITLES);
        
        // Popula o select de função com os cargos completos
        popularSelect(roleFunction, JOB_TITLES);
      } else {
        console.warn("⚠️ Nenhum colaborador encontrado ou resposta inválida");
        JOB_TITLES = [];
        popularSelect(roleFunction, []);
      }
    } catch (error) {
      console.error("❌ Erro ao buscar cargos:", error);
      JOB_TITLES = [];
      popularSelect(roleFunction, []);
    }
  }

  function popularSelect(select, options) {
    select.innerHTML = '<option value="" selected disabled>Selecione</option>';
    options.forEach((opt) => {
      const o = document.createElement("option");
      o.value = opt;
      o.textContent = opt;
      select.appendChild(o);
    });
  }
  
  // Busca cargos ao carregar a página (aguarda o loader inicial)
  buscarCargos();

  function renderChips(box, skills, tempArr) {
    box.innerHTML = "";
    skills.forEach((skill) => {
      const chip = document.createElement("span");
      chip.className = "chip" + (tempArr.includes(skill) ? " active" : "");
      chip.textContent = skill;
      chip.addEventListener("click", () => {
        if (tempArr.includes(skill)) {
          tempArr.splice(tempArr.indexOf(skill), 1);
        } else {
          tempArr.push(skill);
        }
        renderChips(box, skills, tempArr);
      });
      box.appendChild(chip);
    });
  }

  // ===== Helpers =====
  // 1) helper no topo do arquivo (perto dos outros helpers)
  function normalizeTypeKey(t = "") {
    const up = String(t).toUpperCase().trim().replace(/:$/, "");
    if (up.startsWith("HARD")) return "HARD";
    if (up.startsWith("SOFT")) return "SOFT";
    if (up.startsWith("MANAGEMENT") || up.startsWith("GEST"))
      return "MANAGEMENT";
    if (up.startsWith("ANALYTICS")) return "ANALYTICS";
    return up.replace(/\s+/g, "_");
  }

  async function openModal(isEdit = false, data = null) {
    // Se ainda não carregou os cargos, carrega agora
    if (JOB_TITLES.length === 0) {
      await buscarCargos();
    }
    
    // Busca skills reais da API Odoo e agrupa por tipo adaptado
    try {
      const skills = await apiService.getOdooSkills();
      SKILLS_BY_TYPE = {};
      if (Array.isArray(skills)) {
        // Agrupa e remove duplicadas (case-insensitive)
        const seen = {};
        skills.forEach((s) => {
          if (!s.skillType || !s.skillType.name) return;
          let type = s.skillType.name.trim();
          if (type === "Programming Languages") type = "Hard Skills";
          if (type === "Soft Skills") type = "Soft Skills";
          if (type === "Languages") type = "Idiomas";
          if (type === "IT") type = "TI";
          if (type === "Marketing") type = "Marketing";
          if (!SKILLS_BY_TYPE[type]) SKILLS_BY_TYPE[type] = [];
          // Padroniza para camel case
          let skillName = String(s.name)
            .toLowerCase()
            .replace(
              /(^|\s|\-|_)([a-z])/g,
              (m, p1, p2) => p1 + p2.toUpperCase()
            );
          // Remove duplicadas (case-insensitive)
          const key = skillName
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "")
            .toLowerCase();
          if (!seen[type]) seen[type] = new Set();
          if (!seen[type].has(key)) {
            SKILLS_BY_TYPE[type].push(skillName);
            seen[type].add(key);
          }
        });
      }
    } catch (e) {
      SKILLS_BY_TYPE = {};
    }

    modal.classList.remove("hidden");
    overlay.classList.remove("hidden");
    modal.style.display = "block";
    overlay.style.display = "block";
    document.body.style.overflow = "hidden";

    document.getElementById("roleModalTitle").textContent = isEdit
      ? "Editar função"
      : "Adicionar função";

    roleForm.reset();
    // Skills selecionadas por tipo
    let tempSkillsByType = {};
    editingId = null;

    // Corrigir: carregar valor de quantidade ao editar
    const qtyInput = roleForm.querySelector('input[name="quantity"]');
    if (isEdit && data) {
      editingId = data.id;
      roleFunction.value = data.funcao || data.cargo || "";
      
      // Preenche skills selecionadas por tipo usando data.skillsByType
      tempSkillsByType = {};
      if (data.skillsByType && typeof data.skillsByType === "object") {
        Object.entries(data.skillsByType).forEach(([k, arr]) => {
          const norm = normalizeTypeKey(k);
          tempSkillsByType[norm] = Array.isArray(arr) ? [...arr] : [];
        });
      }
      // Garante todas as chaves existentes, mesmo se não vieram no payload
      Object.keys(SKILLS_BY_TYPE).forEach((type) => {
        if (!Array.isArray(tempSkillsByType[type])) tempSkillsByType[type] = [];
      });
      if (qtyInput) {
        qtyInput.value =
          data.quantity && !isNaN(data.quantity) ? data.quantity : 1;
      }
    } else {
      Object.keys(SKILLS_BY_TYPE).forEach((type) => {
        tempSkillsByType[type] = [];
      });
      if (qtyInput) {
        qtyInput.value = 1;
      }
    }

    // Função para renderizar todos os grupos de skills e manter seleção reativa
    function renderAllSkillGroupsReactive() {
      // Remove grupos antigos
      const chipsGroups = roleForm.querySelectorAll(
        ".chips-group.dynamic-skill-group"
      );
      chipsGroups.forEach((g) => g.remove());

      // Para cada tipo, cria um grupo
      Object.entries(SKILLS_BY_TYPE).forEach(([type, skills]) => {
        if (!skills.length) return;
        const groupDiv = document.createElement("div");
        groupDiv.className = "chips-group dynamic-skill-group";
        groupDiv.dataset.type = type;
        const titleDiv = document.createElement("div");
        titleDiv.className = "chips-title";
        // Adapta label para português
        let label = type;
        if (type === "Hard Skills") label = "Hard skills:";
        else if (type === "Soft Skills") label = "Soft skills:";
        else if (type === "Idiomas") label = "Idiomas:";
        else if (type === "TI") label = "TI:";
        else if (type === "Marketing") label = "Marketing:";
        else label = type + ":";
        titleDiv.textContent = label;
        groupDiv.appendChild(titleDiv);
        const chipsDiv = document.createElement("div");
        chipsDiv.className = "chips";
        // Renderiza chips e adiciona eventos de clique para cada skill
        skills.forEach((skill) => {
          // Padroniza para camel case na exibição
          let displaySkill = String(skill)
            .toLowerCase()
            .replace(
              /(^|\s|\-|_)([a-z])/g,
              (m, p1, p2) => p1 + p2.toUpperCase()
            );
          const chip = document.createElement("span");
          chip.className =
            "chip" + (tempSkillsByType[type].includes(skill) ? " active" : "");
          chip.textContent = displaySkill;
          chip.addEventListener("click", () => {
            if (tempSkillsByType[type].includes(skill)) {
              tempSkillsByType[type] = tempSkillsByType[type].filter(
                (s) => s !== skill
              );
            } else {
              tempSkillsByType[type].push(skill);
            }
            renderAllSkillGroupsReactive();
          });
          chipsDiv.appendChild(chip);
        });
        groupDiv.appendChild(chipsDiv);
        // Insere antes dos botões do form
        const actions = roleForm.querySelector(".form-actions");
        roleForm.insertBefore(groupDiv, actions);
      });
    }

    renderAllSkillGroupsReactive();

    roleFunction.focus();
    trapFocus(modal);
    // Função auxiliar para mapear tipo para key do objeto data
    function skillTypeToKey(type) {
      if (type === "HARD") return "hardSkills";
      if (type === "SOFT") return "softSkills";
      if (type === "MANAGEMENT") return "managementSkills";
      if (type === "ANALYTICS") return "analyticsSkills";
      // fallback para outros tipos
      return type.toLowerCase() + "Skills";
    }
  }
  function closeModal() {
    modal.classList.add("hidden");
    overlay.classList.add("hidden");
    modal.style.display = "none";
    overlay.style.display = "none";
    document.body.style.overflow = "";
    releaseFocusTrap();
  }

  function renderRoles() {
    rolesListEl.innerHTML = "";
    if (!roles.length) {
      const emptyMsg = document.createElement("div");
      emptyMsg.textContent = "Nenhuma função adicionada ainda.";
      emptyMsg.style.textAlign = "center";
      emptyMsg.style.color = "#888";
      emptyMsg.style.fontSize = "18px";
      emptyMsg.style.margin = "32px 0";
      emptyMsg.id = "empty-roles-msg";
      rolesListEl.appendChild(emptyMsg);
      return;
    }

    roles.forEach((r) => {
      const card = document.createElement("article");
      card.className = "role-card";
      card.setAttribute("data-role-id", r.id);

      // Monta HTML dos grupos de skills
      let skillsHtml = "";
      if (r.skillsByType) {
        Object.entries(r.skillsByType).forEach(([type, arr]) => {
          if (!arr || !arr.length) return;
          let label = type.charAt(0) + type.slice(1).toLowerCase();
          if (type === "HARD") label = "Hard skills:";
          else if (type === "SOFT") label = "Soft skills:";
          else if (type === "MANAGEMENT") label = "Gestão:";
          else if (type === "ANALYTICS") label = "Analytics:";
          else label = type.charAt(0) + type.slice(1).toLowerCase() + ":";
          skillsHtml += `<div class="chips-title">${label}</div><div class="skill-chips">${arr
            .map((s) => `<span class="skill-chip">${s}</span>`)
            .join("")}</div>`;
        });
      }

      card.innerHTML = `
      <div class="role-card__header">
        <div>
          <div class="role-card__title">
            ${r.quantity ?? 1}x ${r.funcao || r.cargo || "Função"}
          </div>
        </div>
        <div class="role-card__actions">
          <button class="icon-btn icon--edit" type="button" aria-label="Editar" title="Editar">
            ✎
          </button>
          <button class="icon-btn icon--delete" type="button" aria-label="Excluir" title="Excluir">
            ✖
          </button>
        </div>
      </div>
      <div>
        ${skillsHtml}
      </div>
    `;

      const [editBtn, delBtn] = card.querySelectorAll(".icon-btn");
      editBtn.addEventListener("click", () => openModal(true, r));
      delBtn.addEventListener("click", () => {
        roles = roles.filter((x) => x.id !== r.id);
        persist();
        renderRoles();
        updateNextState();
      });

      rolesListEl.appendChild(card);
    });

    if (window.applyI18n) window.applyI18n();
  }

  function persist() {
    sessionStorage.setItem("squadRoles", JSON.stringify(roles));
    const rolesForNext = roles.map((r) => ({
      id: r.id,
      title: r.funcao || r.cargo || "Função",
      skillsByType: r.skillsByType || {},
      quantity: r.quantity || 1,
    }));
    localStorage.setItem("squads.selectedRoles", JSON.stringify(rolesForNext));
    document.dispatchEvent(
      new CustomEvent("squads:rolesChanged", { detail: roles })
    );
  }

  function updateNextState() {
    // Habilita o botão se houver pelo menos uma role
    // Mesmo que as roles venham do backend sem skills, elas são válidas
    const urlParams = new URLSearchParams(window.location.search);
    const isEdit = !!urlParams.get("id");
    
    // Se estiver editando e tiver roles carregadas (mesmo sem skills), habilita
    if (isEdit && roles.length > 0) {
      nextBtn.disabled = false;
    } else {
      nextBtn.disabled = roles.length === 0;
    }
  }

  // ===== Eventos gerais =====
  addRoleBtn.addEventListener("click", () => openModal(false, null));
  overlay.addEventListener("click", closeModal);
  closeModalBtn.addEventListener("click", closeModal);
  // Adiciona evento ao botão Cancelar do modal
  const cancelRoleBtn = document.getElementById("cancelRole");
  if (cancelRoleBtn) {
    cancelRoleBtn.addEventListener("click", closeModal);
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) closeModal();
  });

  // Back/Next/Save – integre com seu fluxo real
  // Recupera squadId ou id da URL (id é usado no modo edição)
  const urlParams = new URLSearchParams(window.location.search);
  const squadId = urlParams.get("squadId") || urlParams.get("id");
  const isEdit = !!urlParams.get("id");
  
  // Mostra botão de salvar se estiver editando
  const saveBtn = document.getElementById("saveBtn");
  if (saveBtn && isEdit) {
    saveBtn.style.display = "inline-block";
    saveBtn.addEventListener("click", async () => {
      // Salva os roles no sessionStorage
      sessionStorage.setItem("squadRoles", JSON.stringify(roles));
      // Mostra mensagem de sucesso
      if (window.showNotification) {
        window.showNotification("success", "Roles salvos com sucesso!");
      }
    });
  }

  backBtn.addEventListener("click", () => {
    // Voltar para o form, mantendo o id
    const param = isEdit ? `id=${squadId}` : (squadId ? `squadId=${squadId}` : "");
    window.location.href = `../squads-form.html${param ? `?${param}` : ""}`;
  });
  nextBtn.addEventListener("click", () => {
    // Salva os roles antes de avançar
    sessionStorage.setItem("squadRoles", JSON.stringify(roles));
    localStorage.setItem("squads.selectedRoles", JSON.stringify(roles));
    // Avançar para weekly-requirements, mantendo o id
    const param = isEdit ? `id=${squadId}` : (squadId ? `squadId=${squadId}` : "");
    window.location.href = `../squads-weekly-requirements/squads-weekly-requirements.html${param ? `?${param}` : ""}`;
  });

  // ===== Form do Modal =====
  // Adiciona campo de quantidade ao modal, se não existir
  let qtyInput = roleForm.querySelector('input[name="quantity"]');
  if (!qtyInput) {
    const qtyDiv = document.createElement("div");
    qtyDiv.className = "field";
    qtyDiv.innerHTML = `
      <label for="roleQuantity">Quantidade *</label>
      <input id="roleQuantity" name="quantity" type="number" min="1" max="10" value="1" required style="appearance: none; width: 100%; padding: 10px 12px; border: 1px solid #dcdce1; border-radius: 8px; font-size: 14px; background: #fff; margin-top: 4px;" />
    `;
    // Insere após o campo de função
    const functionField = roleForm
      .querySelector("#roleFunction")
      .closest(".field");
    if (functionField && functionField.nextSibling) {
      roleForm.insertBefore(qtyDiv, functionField.nextSibling);
    } else {
      roleForm.appendChild(qtyDiv);
    }
    qtyInput = qtyDiv.querySelector("input");
  }

  // Bloqueia digitação de '-' e valores negativos no campo quantidade
  if (qtyInput) {
    qtyInput.addEventListener("keydown", function (e) {
      // Permite: backspace, delete, tab, escape, enter, setas
      if (
        [
          "Backspace",
          "Delete",
          "Tab",
          "Escape",
          "Enter",
          "ArrowLeft",
          "ArrowRight",
          "Home",
          "End",
        ].includes(e.key)
      )
        return;
      // Permite Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      if (
        (e.ctrlKey || e.metaKey) &&
        ["a", "c", "v", "x"].includes(e.key.toLowerCase())
      )
        return;
      // Permite números (linha superior e teclado numérico)
      if (/^[0-9]$/.test(e.key)) {
        // Bloqueia digitação se já houver 2 dígitos e valor >= 10
        const val = this.value;
        if (val.length === 2 && Number(val) >= 10) {
          e.preventDefault();
          return;
        }
        return;
      }
      // Bloqueia tudo o resto
      e.preventDefault();
    });
    qtyInput.addEventListener("input", function (e) {
      // Remove qualquer caractere não numérico
      this.value = this.value.replace(/[^0-9]/g, "");
      if (this.value && Number(this.value) < 1) {
        this.value = "1";
      }
      if (this.value && Number(this.value) > 10) {
        this.value = "10";
      }
    });
  }

  roleForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const funcao = roleFunction.value;
    let quantity =
      Number(roleForm.querySelector('input[name="quantity"]').value) || 1;
    if (!funcao) {
      roleFunction.focus();
      return;
    }
    if (quantity < 1) quantity = 1;
    
    // Coleta skills selecionadas por tipo
    const tempSkillsByType = {};
    Array.from(
      roleForm.querySelectorAll(".chips-group.dynamic-skill-group")
    ).forEach((group) => {
      const type = group.dataset.type;
      const chips = group.querySelectorAll(".chip.active");
      tempSkillsByType[type] = Array.from(chips).map((c) => c.textContent);
    });
    const payload = {
      id: editingId ?? crypto.randomUUID(),
      funcao,
      skillsByType: tempSkillsByType,
      quantity,
    };
    if (editingId) {
      roles = roles.map((r) => (r.id === editingId ? payload : r));
    } else {
      roles.push(payload);
    }
    persist();
    renderRoles();
    updateNextState();
    closeModal();
  });

  // ===== Acessibilidade: focus trap simples no modal =====
  let lastFocused = null;
  let trapHandler = null;
  function trapFocus(container) {
    lastFocused = document.activeElement;
    const focusables = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusables[0],
      last = focusables[focusables.length - 1];
    trapHandler = function (e) {
      if (e.key !== "Tab") return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trapHandler);
  }

  function releaseFocusTrap() {
    if (trapHandler) document.removeEventListener("keydown", trapHandler);
    if (lastFocused) lastFocused.focus();
  }
})();

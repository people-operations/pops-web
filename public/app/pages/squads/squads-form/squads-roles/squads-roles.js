import { apiService } from "../../../../../assets/js/apiService.js";

(() => {
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
  const roleSeniority = document.getElementById("roleSeniority");
  const hardSkillsBox = document.getElementById("hardSkillsBox");
  const softSkillsBox = document.getElementById("softSkillsBox");

  let editingId = null;
  let tempHardSkills = [];
  let tempSoftSkills = [];

  // Estado inicial
  let roles = [];
  try {
    roles = JSON.parse(sessionStorage.getItem("squadRoles") || "[]");
  } catch (_) {}
  renderRoles();
  updateNextState();

  // Exemplo de funções e senioridades (pode ser dinâmico depois)
  const FUNCOES = [
    "Desenvolvedor(a)",
    "QA",
    "Product Owner",
    "Scrum Master",
    "Designer",
    "Analista de Dados",
  ];
  const SENIORIDADES = ["Júnior", "Pleno", "Sênior", "Especialista"];
  // Skills agrupadas por tipo (ex: { HARD: [], SOFT: [], ... })
  let SKILLS_BY_TYPE = {};

  function popularSelect(select, options) {
    select.innerHTML = '<option value="" selected disabled>Selecione</option>';
    options.forEach((opt) => {
      const o = document.createElement("option");
      o.value = opt;
      o.textContent = opt;
      select.appendChild(o);
    });
  }
  popularSelect(roleFunction, FUNCOES);
  popularSelect(roleSeniority, SENIORIDADES);

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
      roleFunction.value = data.funcao;
      roleSeniority.value = data.senioridade;
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
            ${r.quantity ?? 1}x ${r.funcao || "Função"} (${
        r.senioridade || "-"
      })
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
      title: `${r.funcao}${r.senioridade ? " " + r.senioridade : ""}`,
      seniority: r.senioridade,
      skillsByType: r.skillsByType || {},
      quantity: r.quantity || 1,
    }));
    localStorage.setItem("squads.selectedRoles", JSON.stringify(rolesForNext));
    document.dispatchEvent(
      new CustomEvent("squads:rolesChanged", { detail: roles })
    );
  }

  function updateNextState() {
    nextBtn.disabled = roles.length === 0;
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

  // Back/Next – integre com seu fluxo real
  // Recupera squadId da URL
  const urlParams = new URLSearchParams(window.location.search);
  const squadId = urlParams.get("squadId");

  backBtn.addEventListener("click", () => {
    // Voltar para o form, mantendo o id
    window.location.href = `../squads-form.html${
      squadId ? `?squadId=${squadId}` : ""
    }`;
  });
  nextBtn.addEventListener("click", () => {
    // Avançar para weekly requirements, mantendo o id
    window.location.href = `../squads-weekly-requirements/squads-weekly-requirements.html${
      squadId ? `?squadId=${squadId}` : ""
    }`;
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
    // Insere após o campo de senioridade
    const seniorityField = roleForm
      .querySelector("#roleSeniority")
      .closest(".field");
    if (seniorityField && seniorityField.nextSibling) {
      roleForm.insertBefore(qtyDiv, seniorityField.nextSibling);
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
    const senioridade = roleSeniority.value;
    let quantity =
      Number(roleForm.querySelector('input[name="quantity"]').value) || 1;
    if (!funcao || !senioridade) {
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
      senioridade,
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

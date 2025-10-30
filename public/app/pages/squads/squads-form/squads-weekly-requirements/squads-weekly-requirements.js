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
    "Analista de Dados"
  ];
  const SENIORIDADES = [
    "Júnior",
    "Pleno",
    "Sênior",
    "Especialista"
  ];
  const HARD_SKILLS = [
    "JavaScript",
    "React",
    "Node.js",
    "SQL",
    "Testes",
    "UX/UI",
    "Python"
  ];
  const SOFT_SKILLS = [
    "Comunicação",
    "Trabalho em equipe",
    "Proatividade",
    "Resolução de problemas",
    "Gestão de tempo"
  ];

  function popularSelect(select, options) {
    select.innerHTML = '<option value="" selected disabled>Selecione</option>';
    options.forEach(opt => {
      const o = document.createElement('option');
      o.value = opt;
      o.textContent = opt;
      select.appendChild(o);
    });
  }
  popularSelect(roleFunction, FUNCOES);
  popularSelect(roleSeniority, SENIORIDADES);

  function renderChips(box, skills, tempArr) {
    box.innerHTML = "";
    skills.forEach(skill => {
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
  function openModal(isEdit = false, data = null) {
    console.log("openModal", isEdit, data);
    modal.classList.remove("hidden");
    overlay.classList.remove("hidden");
    modal.style.display = "block";
    overlay.style.display = "block";
    document.body.style.overflow = "hidden";

    document.getElementById("roleModalTitle").textContent = isEdit
      ? "Editar função"
      : "Adicionar função";

    roleForm.reset();
    tempHardSkills = [];
    tempSoftSkills = [];
    editingId = null;

    if (isEdit && data) {
      editingId = data.id;
      roleFunction.value = data.funcao;
      roleSeniority.value = data.senioridade;
      tempHardSkills = Array.isArray(data.hardSkills) ? [...data.hardSkills] : [];
      tempSoftSkills = Array.isArray(data.softSkills) ? [...data.softSkills] : [];
    }
    renderChips(hardSkillsBox, HARD_SKILLS, tempHardSkills);
    renderChips(softSkillsBox, SOFT_SKILLS, tempSoftSkills);

    roleFunction.focus();
    trapFocus(modal);
  }
  function closeModal() {
    modal.classList.add("hidden");
    overlay.classList.add("hidden");
    modal.style.display = "none";
    overlay.style.display = "none";
    document.body.style.overflow = "";
    releaseFocusTrap();
  }
  // Não é mais necessário addSkillTag nem escapeHtml

  function renderRoles() {
    rolesListEl.innerHTML = "";
    if (!roles.length) return;

    roles.forEach((r) => {
      const card = document.createElement("article");
      card.className = "role-card";
      card.setAttribute("data-role-id", r.id);

      card.innerHTML = `
        <div class="role-card__header">
          <div>
            <div class="role-card__title">${r.funcao || "Função"} (${r.senioridade || "-"})</div>
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
          <div class="chips-title">Hard skills:</div>
          <div class="skill-chips">
            ${(r.hardSkills || []).map((s) => `<span class="skill-chip">${s}</span>`).join("")}
          </div>
          <div class="chips-title">Soft skills:</div>
          <div class="skill-chips">
            ${(r.softSkills || []).map((s) => `<span class="skill-chip">${s}</span>`).join("")}
          </div>
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
    // se já tiver um estado maior do wizard, dispare um evento:
    document.dispatchEvent(
      new CustomEvent("squads:rolesChanged", { detail: roles })
    );
  }

  function updateNextState() {
    nextBtn.disabled = roles.length === 0;
  }

  // ===== Eventos gerais =====
  addRoleBtn.addEventListener("click", () => openModal(false, null));
  console.log("addRoleBtn", addRoleBtn);
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
  backBtn.addEventListener("click", () => {
    // Ex.: voltar para passo 1
    window.location.href = "../squads-form.html";
  });
  nextBtn.addEventListener("click", () => {
    // vá para o próximo passo (ex.: definição de pessoas / calendário)
    window.location.href = "../squads-assign.html";
  });

  // ===== Form do Modal =====
  roleForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const funcao = roleFunction.value;
    const senioridade = roleSeniority.value;
    if (!funcao || !senioridade) {
      roleFunction.focus();
      return;
    }
    const payload = {
      id: editingId ?? crypto.randomUUID(),
      funcao,
      senioridade,
      hardSkills: [...tempHardSkills],
      softSkills: [...tempSoftSkills],
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
    trapHandler = function(e) {
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

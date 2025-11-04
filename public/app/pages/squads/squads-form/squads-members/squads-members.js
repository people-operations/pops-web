// --------- Mock helpers / leitura dos passos anteriores ----------
function readJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || "") ?? fallback;
  } catch {
    return fallback;
  }
}

// Do passo "roles": [{ id, title, seniority, quantity, hardSkills, softSkills }]
const selectedRoles = readJSON("squads.selectedRoles", [
  {
    id: "fe-senior",
    title: "Front-end Sênior",
    quantity: 2,
    hardSkills: ["JavaScript", "React", "CSS"],
    softSkills: ["Comunicação"],
  },
  {
    id: "fe-junior",
    title: "Front-end Junior",
    quantity: 1,
    hardSkills: ["HTML", "CSS", "JavaScript"],
    softSkills: ["Colaboração"],
  },
]);

// Do passo "weeklyRequirements": [{ id, title, hours }]
const weeklyReqs = readJSON("squads.weeklyRequirements", [
  { id: "fe-senior", title: "Front-end Sênior", hours: 20 },
  { id: "fe-junior", title: "Front-end Junior", hours: 10 },
]);

// Candidatos de exemplo (substitua pela sua API futuramente)
const allCandidates = [
  {
    id: "u1",
    name: "Mateus Fantin",
    title: "Frontend Sênior • Marketing",
    skills: ["Java", "C#", "Flexibilidade", "React", "CSS"],
    exp: "Projetos que ele já participou",
    available: 25,
  },
  {
    id: "u2",
    name: "Ana Souza",
    title: "Frontend Sênior • Growth",
    skills: ["React", "TypeScript", "CSS", "Figma"],
    exp: "Design System & Landing Pages",
    available: 18,
  },
  {
    id: "u3",
    name: "Carlos Lima",
    title: "Frontend Junior • Produto",
    skills: ["HTML", "CSS", "JavaScript"],
    exp: "Squad Webapp Interno",
    available: 32,
  },
  {
    id: "u4",
    name: "João Pedro",
    title: "Frontend Sênior • Mkt",
    skills: ["Vue", "JavaScript", "Figma", "A11y"],
    exp: "CMS + Acessibilidade",
    available: 22,
  },
];

// --------- Estado global da tela ----------
const state = {
  roleId: selectedRoles[0]?.id,
  orderBy: "best",
  selectedByRole: readJSON("squads.membersSelection", {}), // { roleId: [candidateIds] }
};

// --------- Scoring simples por interseção de skills ----------
function getRequiredSkills(roleId) {
  const role = selectedRoles.find((r) => r.id === roleId);
  return (role?.hardSkills || []).concat(role?.softSkills || []);
}
function matchPercent(candidate, roleId) {
  const req = getRequiredSkills(roleId);
  if (!req.length) return 89; // fallback parecido ao mock
  const inter = candidate.skills.filter((s) => req.includes(s)).length;
  return Math.round((inter / req.length) * 100) || 68;
}

// --------- Ordenação ----------
function sortCandidates(list, roleId, orderBy) {
  const copy = [...list];
  if (orderBy === "best") {
    copy.sort((a, b) => matchPercent(b, roleId) - matchPercent(a, roleId));
  } else if (orderBy === "availability") {
    copy.sort((a, b) => b.available - a.available);
  } else if (orderBy === "name") {
    copy.sort((a, b) => a.name.localeCompare(b.name));
  }
  return copy;
}

// --------- Render principal ----------
function render() {
  const roleSelect = document.getElementById("roleSelect");
  const orderSelect = document.getElementById("orderSelect");
  const cards = document.getElementById("cards");
  const infoSpan = document.getElementById("filledInfo");
  const saveBtn = document.getElementById("saveBtn");

  // Preenche selects
  roleSelect.innerHTML = selectedRoles
    .map((r) => {
      const filled = (state.selectedByRole[r.id] || []).length;
      const needed = r.quantity ?? 2;
      const label = `${r.title} – ${filled}/${needed} preenchido`;
      return `<option value="${r.id}" ${
        state.roleId === r.id ? "selected" : ""
      }>${label}</option>`;
    })
    .join("");

  // Atualiza contagem do papel atual
  const currentRole = selectedRoles.find((r) => r.id === state.roleId);
  const filled = (state.selectedByRole[state.roleId] || []).length;
  const needed = currentRole?.quantity ?? 2;
  infoSpan.textContent = `${filled} / ${needed} preenchido`;

  // Ordenação
  orderSelect.value = state.orderBy;

  // Lista de candidatos
  const ordered = sortCandidates(allCandidates, state.roleId, state.orderBy);
  cards.innerHTML = "";
  ordered.forEach((c) => cards.appendChild(buildCard(c, currentRole)));

  // Habilita salvar se houver pelo menos 1 selecionado em algum papel
  const anySelected = Object.values(state.selectedByRole).some(
    (arr) => (arr || []).length > 0
  );
  saveBtn.disabled = !anySelected;
}

function buildCard(c, role) {
  const wrap = document.createElement("div");
  wrap.className = "card";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "check";
  checkbox.ariaLabel = `Selecionar ${c.name}`;
  const selectedIds = state.selectedByRole[state.roleId] || [];
  checkbox.checked = selectedIds.includes(c.id);

  const body = document.createElement("div");
  body.className = "body";

  const match = matchPercent(c, state.roleId);
  const requiredHours =
    weeklyReqs.find((w) => w.id === state.roleId)?.hours ?? 0;

  body.innerHTML = `
    <div class="name-row">
      <span class="name">${c.name}</span>
      <span class="badge match">${match}% Match</span>
      <span class="badge avail">${c.available}h disponíveis</span>
      ${
        requiredHours
          ? `<span class="small-muted">(${requiredHours}h/sem necessárias)</span>`
          : ""
      }
    </div>
    <div class="meta">${c.title}</div>
    <div class="tags">${c.skills
      .slice(0, 5)
      .map((s) => `<span class="tag">${s}</span>`)
      .join("")}</div>
    <div class="exp">Experiências: ${c.exp}</div>
  `;

  // Limita seleção à quantidade necessária
  checkbox.addEventListener("change", () => {
    const max = role?.quantity ?? 2;
    const arr = state.selectedByRole[state.roleId] || [];
    if (checkbox.checked) {
      if (arr.length >= max) {
        checkbox.checked = false;
        if (window.showNotification) {
          window.showNotification(
            "error",
            `Limite atingido: ${max} para ${role?.title || "função"}.`
          );
        }
        return;
      }
      state.selectedByRole[state.roleId] = [...arr, c.id];
    } else {
      state.selectedByRole[state.roleId] = arr.filter((id) => id !== c.id);
    }
    render(); // re-render para atualizar contador e estado
  });

  const left = document.createElement("div");
  left.className = "check";
  left.appendChild(checkbox);

  wrap.appendChild(left);
  wrap.appendChild(body);
  return wrap;
}

// --------- Eventos de UI ----------
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("main-content")?.classList.remove("hidden");

  document.getElementById("roleSelect").addEventListener("change", (e) => {
    state.roleId = e.target.value;
    render();
  });
  document.getElementById("orderSelect").addEventListener("change", (e) => {
    state.orderBy = e.target.value;
    render();
  });

  document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href =
      "../squads-weekly-requirements/squads-weekly-requirements.html";
  });

  document.getElementById("saveBtn").addEventListener("click", () => {
    localStorage.setItem(
      "squads.membersSelection",
      JSON.stringify(state.selectedByRole)
    );
    if (window.showNotification) {
      window.showNotification("success", "Seleção salva!");
    }
    // Próxima etapa/Resumo:
    window.location.href = "squads-review.html";
  });

  render();
});

import { apiService } from "../../../../../assets/js/apiService.js";

// --------- Mock helpers / leitura dos passos anteriores ----------
function readJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || "") ?? fallback;
  } catch {
    return fallback;
  }
}

// Busca roles do sessionStorage (chave 'squadRoles'), se não existir, usa localStorage
function getSelectedRoles() {
  let roles = [];
  try {
    const session = sessionStorage.getItem("squadRoles");
    if (session) {
      roles = JSON.parse(session);
    } else {
      roles = readJSON("squads.selectedRoles", []);
    }
  } catch {
    roles = readJSON("squads.selectedRoles", []);
  }
  return roles;
}
const selectedRoles = getSelectedRoles();

// Do passo "weeklyRequirements": [{ id, title, hours }]
const weeklyReqs = readJSON("squads.weeklyRequirements", []);

// Carregamento dinâmico dos colaboradores reais
let allCandidates = [];

// Paginação
const PAGE_SIZE = 10;
let currentPage = 1;
let totalPages = 1;

async function fetchAndPrepareCandidates() {
  // apiService está disponível via import/export, mas aqui é global (window.apiService)
  const api = await apiService;
  if (!api || !api.getCollaborators) {
    window.showNotification &&
      window.showNotification("error", "API de colaboradores não encontrada!");
    return;
  }
  // Exibe skeleton
  showSkeleton();
  let data = await api.getCollaborators();
  if (!data || !Array.isArray(data)) {
    document.getElementById("loader").innerText =
      "Erro ao carregar colaboradores.";
    return;
  }
  // Adapta para o formato esperado pelo front
  allCandidates = data.map((col) => ({
    id: col.id,
    name: col.name,
    title: `${col.jobTitle || ""}${
      col.departament && col.departament.name
        ? " • " + col.departament.name
        : ""
    }`.trim(),
    skills: Array.isArray(col.skills) ? col.skills.map((s) => s.name) : [],
    exp: col.jobTitle || "",
    available: col.workHoursPerWeek || 0,
  }));
  currentPage = 1;
  totalPages =
    Math.ceil(
      sortCandidates(allCandidates, state.roleId, state.orderBy).length /
        PAGE_SIZE
    ) || 1;
  hideSkeleton();
  document.getElementById("loader").style.display = "none";
  document.getElementById("main-content").classList.remove("hidden");
  render();
}

// Skeleton helpers
function showSkeleton() {
  const mainContent = document.getElementById("main-content");
  if (!mainContent) return;
  mainContent.classList.add("hidden");
  let skeleton = document.getElementById("skeleton");
  if (!skeleton) {
    skeleton = document.createElement("div");
    skeleton.id = "skeleton";
    skeleton.innerHTML = Array.from({ length: 10 })
      .map(
        () => `
        <div class="card skeleton-card">
          <div class="check skeleton-check"></div>
          <div class="body">
            <div class="skeleton-line skeleton-name"></div>
            <div class="skeleton-line skeleton-badges"></div>
            <div class="skeleton-line skeleton-meta"></div>
            <div class="skeleton-line skeleton-tags"></div>
            <div class="skeleton-line skeleton-exp"></div>
          </div>
        </div>
      `
      )
      .join("");
    const cards = document.getElementById("cards");
    if (cards && cards.parentNode) {
      cards.parentNode.insertBefore(skeleton, cards);
    }
  }
  skeleton.style.display = "block";
}

function hideSkeleton() {
  const skeleton = document.getElementById("skeleton");
  if (skeleton) skeleton.style.display = "none";
  const mainContent = document.getElementById("main-content");
  if (mainContent) mainContent.classList.remove("hidden");
}

// --------- Estado global da tela ----------
const state = {
  roleId: selectedRoles[0]?.id,
  orderBy: "best",
  selectedByRole: readJSON("squads.membersSelection", {}), // { roleId: [candidateIds] }
};

// --------- Scoring simples por interseção de skills ----------
function getRequiredSkills(roleId) {
  const role = selectedRoles.find((r) => r.id === roleId);
  if (!role) return [];
  // Suporte a roles criadas com skillsByType (novo formato)
  if (role.skillsByType && typeof role.skillsByType === "object") {
    // Junta todas as skills de todos os tipos
    let all = [];
    Object.values(role.skillsByType).forEach((arr) => {
      if (Array.isArray(arr)) all = all.concat(arr);
    });
    return all;
  }
  // fallback antigo
  return (role?.hardSkills || []).concat(role?.softSkills || []);
}
function matchPercent(candidate, roleId) {
  const req = getRequiredSkills(roleId)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (!req.length) return 0;
  let inter = 0;
  candidate.skills.forEach((skill) => {
    const skillNorm = skill.trim().toLowerCase();
    if (req.includes(skillNorm)) inter++;
    else {
      // fuzzy: se skill contém parte do nome da requerida
      if (req.some((r) => skillNorm.includes(r) || r.includes(skillNorm)))
        inter += 0.5;
    }
  });
  // Se não houver nenhuma interseção, retorna 0
  if (inter === 0) return 0;
  return Math.round((inter / req.length) * 100);
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
  } else if (orderBy === "name-desc") {
    copy.sort((a, b) => b.name.localeCompare(a.name));
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
      console.log("Role render:", { r, filled, needed }); // DEBUG
      const label = `${r.funcao} ${r.senioridade}  – ${filled}/${needed} preenchido`;
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

  // Paginação
  const ordered = sortCandidates(allCandidates, state.roleId, state.orderBy);
  totalPages = Math.ceil(ordered.length / PAGE_SIZE) || 1;
  if (currentPage > totalPages) currentPage = totalPages;
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const paginated = ordered.slice(startIdx, startIdx + PAGE_SIZE);

  cards.innerHTML = "";
  paginated.forEach((c) => cards.appendChild(buildCard(c, currentRole)));

  // Paginação UI
  let pagination = document.getElementById("pagination");
  if (!pagination) {
    pagination = document.createElement("div");
    pagination.id = "pagination";
    cards.parentNode.insertBefore(pagination, cards.nextSibling);
  }
  pagination.innerHTML = "";
  if (totalPages > 1) {
    const prevBtn = document.createElement("button");
    prevBtn.textContent = "Anterior";
    prevBtn.className = "pagination-btn";
    if (currentPage === 1) prevBtn.classList.add("disabled");
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
      if (currentPage > 1) {
        currentPage--;
        render();
      }
    };
    pagination.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
      const pageBtn = document.createElement("button");
      pageBtn.textContent = i;
      pageBtn.className = "pagination-btn";
      if (i === currentPage) pageBtn.classList.add("active");
      pageBtn.disabled = i === currentPage;
      pageBtn.onclick = () => {
        currentPage = i;
        render();
      };
      pagination.appendChild(pageBtn);
    }

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Próxima";
    nextBtn.className = "pagination-btn";
    if (currentPage === totalPages) nextBtn.classList.add("disabled");
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => {
      if (currentPage < totalPages) {
        currentPage++;
        render();
      }
    };
    pagination.appendChild(nextBtn);
  } else {
    pagination.innerHTML = "";
  }

  // Habilita salvar SOMENTE se todos os cargos estiverem preenchidos
  const allFilled = selectedRoles.every((r) => {
    const arr = state.selectedByRole[r.id] || [];
    return arr.length === (r.quantity ?? 2);
  });
  saveBtn.disabled = !allFilled;
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

  // Badge color logic
  let matchClass = "match-low";
  if (match >= 95) matchClass = "match-perfect";
  else if (match >= 75) matchClass = "match-good";
  else if (match >= 50) matchClass = "match-medium";

  body.innerHTML = `
    <div class="name-row">
      <span class="name">${c.name}</span>
      <span class="badge match ${matchClass}">${match}% Match</span>
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
    <div class="exp">Experiência: ${c.exp}</div>
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
fetchAndPrepareCandidates();

document.getElementById("roleSelect").addEventListener("change", (e) => {
  state.roleId = e.target.value;
  currentPage = 1;
  render();
});
document.getElementById("orderSelect").addEventListener("change", (e) => {
  state.orderBy = e.target.value;
  currentPage = 1;
  render();
});

// Adiciona opção Z-A se não existir
const orderSelect = document.getElementById("orderSelect");
if (orderSelect && !orderSelect.querySelector('option[value="name-desc"]')) {
  const option = document.createElement("option");
  option.value = "name-desc";
  option.textContent = "Nome (Z–A)";
  orderSelect.appendChild(option);
}

document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href =
    "../squads-weekly-requirements/squads-weekly-requirements.html";
});

document.getElementById("saveBtn").addEventListener("click", () => {
  localStorage.setItem(
    "squads.membersSelection",
    JSON.stringify(state.selectedByRole)
  );

  // Pega squadId da URL
  const params = new URLSearchParams(window.location.search);
  const squadId = params.get("squadId");
  if (!squadId) {
    if (window.showNotification) {
      window.showNotification("error", "ID da Squad não encontrado na URL!");
    }
    return;
  }

  // Monta allocations
  const today = new Date();
  const startedAt = today.toISOString().split("T")[0]; // yyyy-mm-dd
  const allocations = [];
  Object.entries(state.selectedByRole).forEach(([roleId, memberIds]) => {
    const role = selectedRoles.find((r) => r.id == roleId);
    const weekly = weeklyReqs.find((w) => w.id == roleId);
    const allocatedHours = weekly?.hours || 0;
    const position = role?.title || "";
    (memberIds || []).forEach((personId) => {
      allocations.push({
        startedAt,
        allocatedHours,
        personId: Number(personId),
        position,
        team: Number(squadId),
      });
    });
  });

  // Chama API
  apiService
    .insertSquadAllocations(squadId, allocations)
    .then((result) => {
      if (window.showNotification) {
        if (result) {
          window.showNotification("success", "Alocações salvas!");
        } else {
          window.showNotification("error", "Erro ao salvar alocações!");
        }
      }
    })
    .catch((err) => {
      if (window.showNotification) {
        window.showNotification("error", "Erro ao salvar alocações!");
      }
    });
});

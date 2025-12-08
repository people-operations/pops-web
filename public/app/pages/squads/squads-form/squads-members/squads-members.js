import { apiService } from "../../../../../assets/js/apiService.js";

// Mostra loader IMEDIATAMENTE se estiver editando ou tiver squadId (antes de qualquer coisa)
(function() {
  const urlParams = new URLSearchParams(window.location.search);
  const isEdit = !!urlParams.get("id");
  const squadId = urlParams.get("squadId") || urlParams.get("id");
  
  // Mostra loader se estiver editando ou se tiver squadId (modo criação com squad já criada)
  if (isEdit || squadId) {
    const loader = document.getElementById("loader");
    const mainContent = document.getElementById("main-content");
    if (loader) {
      loader.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;">
          <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #7d1bff; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin-bottom: 20px;"></div>
          <p style="color: #7d1bff; font-size: 16px;">Carregando membros...</p>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;
      loader.style.display = "flex";
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
})();

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
let selectedRoles = getSelectedRoles();

// Do passo "weeklyRequirements": [{ id, title, hours }]
// Tenta carregar de window.__roles primeiro (da página anterior), depois do localStorage
let weeklyReqs = [];
if (typeof window !== 'undefined' && window.__roles && Array.isArray(window.__roles)) {
  weeklyReqs = window.__roles;
  console.log("✅ WeeklyReqs carregados de window.__roles:", weeklyReqs);
} else {
  weeklyReqs = readJSON("squads.weeklyRequirements", []);
  console.log("✅ WeeklyReqs carregados do localStorage:", weeklyReqs);
}

// Duração da sprint em semanas (será buscada da squad)
let sprintDuration = 0;

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
  
  // Busca sprintDuration da squad se houver squadId na URL
  const urlParams = new URLSearchParams(window.location.search);
  const squadId = urlParams.get("squadId") || urlParams.get("id");
  const isEdit = !!urlParams.get("id");
  
  if (squadId) {
    try {
      const squad = await api.getSquadById(squadId);
      if (squad && squad.sprintDuration) {
        sprintDuration = squad.sprintDuration;
        console.log(`✅ Sprint duration carregada: ${sprintDuration} semanas`);
      }
    } catch (error) {
      console.warn("Erro ao buscar sprintDuration da squad:", error);
      // Usa valor padrão se não conseguir buscar
      sprintDuration = 4; // padrão: 4 semanas
    }
  } else {
    // Se não houver squadId, usa valor padrão
    sprintDuration = 4; // padrão: 4 semanas
  }
  
  // Carrega os membros já alocados se houver squadId (tanto em modo edição quanto criação)
  // Também carrega weeklyReqs da squad se disponível
  if (squadId) {
    try {
      const squadDetails = await api.getSquadDetails(squadId);
      
      // Carrega weeklyReqs da squad se disponível (para cálculo correto do match)
      if (squadDetails && squadDetails.allocations && Array.isArray(squadDetails.allocations)) {
        // Agrupa allocations por função para obter horas semanais
        const hoursByFunction = {};
        squadDetails.allocations.forEach(alloc => {
          const functionName = alloc.position || alloc.jobTitle || "";
          if (functionName && !hoursByFunction[functionName]) {
            // Pega a primeira allocation dessa função para obter as horas
            hoursByFunction[functionName] = alloc.allocatedHours || 0;
          }
        });
        
        // Atualiza weeklyReqs com as horas da squad
        if (Object.keys(hoursByFunction).length > 0) {
          weeklyReqs = selectedRoles.map(role => {
            const roleFunction = (role.funcao || role.title || role.cargo || "").trim();
            const hours = hoursByFunction[roleFunction] || 0;
            return {
              id: role.id,
              title: role.title || role.funcao,
              hours: hours
            };
          });
          console.log("✅ WeeklyReqs carregados da squad:", weeklyReqs);
        }
      }
      
      if (squadDetails && squadDetails.members && Array.isArray(squadDetails.members)) {
        // Se não houver roles carregadas, tenta buscar da squad primeiro
        if (selectedRoles.length === 0 && squadDetails.members.length > 0) {
          // Tenta buscar roles da squad se disponível
          if (squadDetails.roles && Array.isArray(squadDetails.roles) && squadDetails.roles.length > 0) {
            selectedRoles = squadDetails.roles.map((role, index) => ({
              id: role.id || `role-${index + 1}`,
              funcao: role.funcao || role.title || role.cargo || role.position || "Sem função",
              title: role.title || role.funcao || role.cargo || role.position || "Sem função",
              quantity: role.quantity || 1
            }));
            console.log("✅ Roles carregadas da squad:", selectedRoles);
          } else {
            // Se não houver roles na squad, cria roles baseadas nos membros
            const rolesByFunction = new Map();
            let roleIdCounter = 1;
            
            squadDetails.members.forEach(member => {
              const memberFunction = member.position || member.jobTitle || "Sem função";
              if (!rolesByFunction.has(memberFunction)) {
                rolesByFunction.set(memberFunction, {
                  id: `role-${roleIdCounter++}`,
                  funcao: memberFunction,
                  title: memberFunction,
                  quantity: 0
                });
              }
              rolesByFunction.get(memberFunction).quantity += 1;
            });
            
            selectedRoles = Array.from(rolesByFunction.values());
            console.log("✅ Roles criadas a partir dos membros:", selectedRoles);
          }
        }
        
        // Agrupa membros por função (position ou jobTitle) e marca como selecionados
        // MAS APENAS se a função corresponder a uma role existente
        const membersByRole = {};
        squadDetails.members.forEach(member => {
          // Tenta usar position primeiro, depois jobTitle
          const memberFunction = member.position || member.jobTitle || "Sem função";
          // Encontra a role correspondente - tenta match com funcao, title ou cargo
          const role = selectedRoles.find(r => {
            const roleFunction = (r.funcao || r.title || r.cargo || "").toLowerCase().trim();
            const memberFunctionLower = memberFunction.toLowerCase().trim();
            return roleFunction === memberFunctionLower;
          });
          if (role) {
            const roleId = role.id;
            if (!membersByRole[roleId]) {
              membersByRole[roleId] = [];
            }
            // Adiciona o ID do membro à lista de selecionados para essa função
            // Usa personId se disponível, senão usa id ou employee.id
            const memberId = member.personId || member.id || (member.employee && member.employee.id);
            if (memberId) {
              membersByRole[roleId].push(Number(memberId));
            }
          }
        });
        // Atualiza o estado com os membros já selecionados
        Object.keys(membersByRole).forEach(roleId => {
          if (!state.selectedByRole[roleId]) {
            state.selectedByRole[roleId] = [];
          }
          // Adiciona os membros já alocados, evitando duplicatas
          membersByRole[roleId].forEach(memberId => {
            if (!state.selectedByRole[roleId].includes(memberId)) {
              state.selectedByRole[roleId].push(memberId);
            }
          });
        });
        console.log("✅ Membros já alocados carregados:", state.selectedByRole);
        console.log("✅ Roles disponíveis para filtro:", selectedRoles);
      }
    } catch (error) {
      console.error("Erro ao carregar membros já alocados:", error);
    }
  }
  
  // Garante que há pelo menos uma role selecionada para o filtro funcionar
  if (selectedRoles.length > 0 && !state.roleId) {
    state.roleId = selectedRoles[0].id;
    // Atualiza o select de roles se existir
    const roleSelect = document.getElementById("roleSelect");
    if (roleSelect) {
      roleSelect.value = state.roleId;
    }
  }
  
  // Exibe skeleton
  showSkeleton();
  let data = await api.getCollaborators();
  if (!data || !Array.isArray(data)) {
    document.getElementById("loader").innerText =
      "Erro ao carregar colaboradores.";
    return;
  }
  
  // Busca alocações para cada colaborador para calcular horas alocadas
  const candidatesWithAllocations = await Promise.all(
    data.map(async (col) => {
      let totalAllocatedHours = 0;
      try {
        const allocations = await api.getSquadsByCollaboratorId(col.id);
        if (Array.isArray(allocations)) {
          // Soma horas semanais alocadas (não totais do projeto)
          totalAllocatedHours = allocations.reduce(
            (sum, alloc) => sum + (alloc.allocatedHours || 0),
            0
          );
        }
      } catch (error) {
        console.warn(`Erro ao buscar alocações para colaborador ${col.id}:`, error);
      }
      
      const workHoursPerWeek = col.workHoursPerWeek || 0;
      // Horas semanais disponíveis
      const availableHoursPerWeek = Math.max(0, workHoursPerWeek - totalAllocatedHours);
      // Horas totais disponíveis para o projeto (semanas * horas semanais disponíveis)
      const availableHoursTotal = availableHoursPerWeek * sprintDuration;
      // Horas totais do colaborador para o projeto
      const totalHoursForProject = workHoursPerWeek * sprintDuration;
      
      return {
        id: col.id,
        name: col.name,
        jobTitle: col.jobTitle || "", // Adiciona jobTitle para filtro
        title: `${col.jobTitle || ""}${
          col.departament && col.departament.name
            ? " • " + col.departament.name
            : ""
        }`.trim(),
        skills: Array.isArray(col.skills) ? col.skills.map((s) => s.name) : [],
        exp: col.jobTitle || "",
        workHoursPerWeek: workHoursPerWeek,
        allocatedHoursPerWeek: totalAllocatedHours,
        availableHoursPerWeek: availableHoursPerWeek,
        totalHoursForProject: totalHoursForProject,
        availableHoursTotal: availableHoursTotal,
      };
    })
  );
  
  // Adapta para o formato esperado pelo front
  allCandidates = candidatesWithAllocations;
  currentPage = 1;
  // Aplica filtro e ordenação para calcular totalPages
  const filtered = filterCandidatesByRole(allCandidates, state.roleId);
  const ordered = sortCandidates(filtered, state.roleId, state.orderBy);
  totalPages = Math.ceil(ordered.length / PAGE_SIZE) || 1;
  hideSkeleton();
  
  // Esconde loader e mostra conteúdo
  const loader = document.getElementById("loader");
  const mainContent = document.getElementById("main-content");
  if (loader) {
    loader.style.display = "none";
    loader.classList.add("hidden");
  }
  if (mainContent) {
    mainContent.classList.remove("hidden");
  }
  
  // Configura botão de salvar após carregar dados
  // Reutiliza urlParams, squadId e isEdit já declarados no início da função
  const saveBtn = document.getElementById("saveBtn");
  if (saveBtn && (isEdit || squadId)) {
    saveBtn.style.display = "inline-block";
    saveBtn.style.visibility = "visible";
    console.log("✅ Botão salvar exibido após carregar dados - squadId:", squadId, "isEdit:", isEdit);
  }
  
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

// --------- Scoring melhorado: skills + disponibilidade de horas ----------
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
  // Compara IDs como strings para garantir match correto
  const role = selectedRoles.find((r) => String(r.id) === String(roleId));
  if (!role) {
    console.warn("⚠️ Role não encontrada para match:", roleId);
    return 0;
  }
  
  // 1. Calcula match de skills (peso: 60%)
  const req = getRequiredSkills(roleId)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  
  let skillsMatch = 0;
  let useSkillsWeight = true;
  
  if (req.length > 0) {
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
    skillsMatch = inter > 0 ? Math.round((inter / req.length) * 100) : 0;
  } else {
    // Se não há skills requeridas, não conta skills no match
    // O match será baseado apenas na disponibilidade
    useSkillsWeight = false;
    skillsMatch = 0;
  }
  
  // 2. Calcula match de disponibilidade de horas (peso: 40%)
  // Horas semanais necessárias para a função - compara IDs como strings
  const weeklyReq = weeklyReqs.find((w) => String(w.id) === String(roleId));
  const requiredHoursPerWeek = weeklyReq?.hours ?? 0;
  // Horas totais necessárias para o projeto (semanas * horas semanais)
  const requiredHoursTotal = requiredHoursPerWeek * sprintDuration;
  
  let availabilityMatch = 0;
  let useAvailabilityWeight = true;
  
  if (requiredHoursTotal > 0) {
    // Usa horas totais disponíveis do colaborador para o projeto
    const availableHoursTotal = candidate.availableHoursTotal || 0;
    if (availableHoursTotal >= requiredHoursTotal) {
      // Tem horas suficientes: 100% de match
      availabilityMatch = 100;
    } else if (availableHoursTotal > 0) {
      // Tem algumas horas, mas não suficientes: proporcional
      availabilityMatch = Math.round((availableHoursTotal / requiredHoursTotal) * 100);
      // Limita a 80% se não tiver horas suficientes
      if (availabilityMatch > 80) availabilityMatch = 80;
    } else {
      // Sem horas disponíveis: 0% de match
      availabilityMatch = 0;
    }
  } else {
    // Se não há horas requeridas, não conta disponibilidade no match
    // O match será baseado apenas nas skills
    useAvailabilityWeight = false;
    availabilityMatch = 0;
  }
  
  // 3. Combina os dois scores
  // Se não há skills requeridas, o match é baseado apenas na disponibilidade
  // Se não há horas requeridas, o match é baseado apenas nas skills
  // Se ambos existem, usa 60% skills + 40% disponibilidade
  // Se nenhum existe, retorna 0% (sem critérios de match)
  let finalMatch = 0;
  
  if (!useSkillsWeight && !useAvailabilityWeight) {
    // Nenhum critério disponível - 0% de match
    finalMatch = 0;
  } else if (!useSkillsWeight && useAvailabilityWeight) {
    // Apenas disponibilidade conta - 100% baseado em disponibilidade
    finalMatch = availabilityMatch;
  } else if (useSkillsWeight && !useAvailabilityWeight) {
    // Apenas skills contam - 100% baseado em skills
    finalMatch = skillsMatch;
  } else {
    // Ambos contam - 60% skills + 40% disponibilidade
    finalMatch = Math.round(skillsMatch * 0.6 + availabilityMatch * 0.4);
  }
  
  console.log(`📊 Match calculado para ${candidate.name} (${role.funcao || role.title}):`, {
    skillsMatch: useSkillsWeight ? `${skillsMatch}%` : "N/A (sem skills requeridas)",
    availabilityMatch: useAvailabilityWeight ? `${availabilityMatch}%` : "N/A (sem horas requeridas)",
    requiredHoursPerWeek,
    requiredHoursTotal,
    availableHoursTotal: candidate.availableHoursTotal,
    useSkillsWeight,
    useAvailabilityWeight,
    formula: !useSkillsWeight && !useAvailabilityWeight 
      ? "0% (sem critérios)"
      : !useSkillsWeight && useAvailabilityWeight
      ? "100% disponibilidade"
      : useSkillsWeight && !useAvailabilityWeight
      ? "100% skills"
      : "60% skills + 40% disponibilidade",
    finalMatch: `${finalMatch}%`
  });
  
  return finalMatch;
}

// --------- Filtro por função/cargo ----------
function filterCandidatesByRole(list, roleId) {
  if (!roleId) {
    console.warn("⚠️ roleId não fornecido para filtro");
    return list;
  }
  
  const role = selectedRoles.find((r) => r.id === roleId || r.id == roleId);
  if (!role) {
    console.warn("⚠️ Role não encontrada:", roleId, "Roles disponíveis:", selectedRoles.map(r => ({ id: r.id, funcao: r.funcao })));
    return [];
  }
  
  if (!role.funcao && !role.title && !role.cargo) {
    console.warn("⚠️ Role sem função definida:", role);
    return [];
  }
  
  // Filtra candidatos que têm o mesmo jobTitle da função selecionada
  const roleJobTitle = (role.funcao || role.title || role.cargo || "").trim();
  if (!roleJobTitle) {
    console.warn("⚠️ Role sem função válida:", role);
    return [];
  }
  
  const filtered = list.filter((candidate) => {
    const candidateJobTitle = (candidate.jobTitle || "").trim();
    if (!candidateJobTitle) {
      return false;
    }
    // Comparação case-insensitive e exata
    const matches = candidateJobTitle.toLowerCase() === roleJobTitle.toLowerCase();
    return matches;
  });
  
  console.log(`🔍 Filtro: Role "${roleJobTitle}" (${roleId}) - ${filtered.length} candidatos de ${list.length} total`);
  console.log(`   Candidatos filtrados:`, filtered.map(c => ({ name: c.name, jobTitle: c.jobTitle })));
  return filtered;
}

// --------- Ordenação ----------
function sortCandidates(list, roleId, orderBy) {
  const copy = [...list];
  if (orderBy === "best") {
    // Ordena por match percent (já considera skills + disponibilidade)
    copy.sort((a, b) => {
      const matchA = matchPercent(a, roleId);
      const matchB = matchPercent(b, roleId);
      if (matchB !== matchA) return matchB - matchA;
      // Em caso de empate, prioriza quem tem mais horas totais disponíveis
      return (b.availableHoursTotal || 0) - (a.availableHoursTotal || 0);
    });
  } else if (orderBy === "availability") {
    copy.sort((a, b) => (b.availableHoursTotal || 0) - (a.availableHoursTotal || 0));
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
      const label = `${r.funcao || "Função"} – ${filled}/${needed} preenchido`;
      // Compara IDs como strings para garantir match
      const isSelected = String(state.roleId) === String(r.id);
      return `<option value="${r.id}" ${isSelected ? "selected" : ""}>${label}</option>`;
    })
    .join("");

  // Atualiza contagem do papel atual
  let finalRole = selectedRoles.find((r) => String(r.id) === String(state.roleId));
  if (!finalRole && selectedRoles.length > 0) {
    // Se a role atual não foi encontrada, usa a primeira
    state.roleId = selectedRoles[0].id;
    roleSelect.value = state.roleId;
    finalRole = selectedRoles[0];
  } else if (!finalRole) {
    // Se não há roles, cria uma role vazia para evitar erros
    finalRole = { id: state.roleId, funcao: "", quantity: 2 };
  }
  
  const filled = (state.selectedByRole[state.roleId] || []).length;
  const needed = finalRole?.quantity ?? 2;
  infoSpan.textContent = `${filled} / ${needed} preenchido`;

  // Ordenação
  orderSelect.value = state.orderBy;

  // Filtra candidatos pela função selecionada
  console.log("🎯 Render - Filtrando candidatos para roleId:", state.roleId, "Total de candidatos:", allCandidates.length);
  const filtered = filterCandidatesByRole(allCandidates, state.roleId);
  
  // Paginação
  const ordered = sortCandidates(filtered, state.roleId, state.orderBy);
  totalPages = Math.ceil(ordered.length / PAGE_SIZE) || 1;
  if (currentPage > totalPages) currentPage = totalPages;
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const paginated = ordered.slice(startIdx, startIdx + PAGE_SIZE);

  cards.innerHTML = "";
  if (filtered.length === 0) {
    const role = selectedRoles.find((r) => String(r.id) === String(state.roleId));
    const roleName = role?.funcao || role?.title || "função selecionada";
    cards.innerHTML = `<div style="text-align: center; padding: 40px; color: #666;">
      <p>Nenhum colaborador encontrado com o cargo "${roleName}".</p>
      <p style="font-size: 14px; margin-top: 8px;">Tente selecionar outra função ou verifique se há colaboradores cadastrados com esse cargo.</p>
    </div>`;
  } else {
    paginated.forEach((c) => cards.appendChild(buildCard(c, finalRole)));
  }

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
  // Horas semanais necessárias para a função - compara IDs como strings
  const weeklyReq = weeklyReqs.find((w) => String(w.id) === String(state.roleId));
  const requiredHoursPerWeek = weeklyReq?.hours ?? 0;
  // Horas totais necessárias para o projeto
  const requiredHoursTotal = requiredHoursPerWeek * sprintDuration;

  // Badge color logic
  let matchClass = "match-low";
  if (match >= 95) matchClass = "match-perfect";
  else if (match >= 75) matchClass = "match-good";
  else if (match >= 50) matchClass = "match-medium";

  // Calcula informações de horas
  const workHoursPerWeek = c.workHoursPerWeek || 0;
  const allocatedHoursPerWeek = c.allocatedHoursPerWeek || 0;
  const availableHoursPerWeek = c.availableHoursPerWeek || 0;
  const totalHoursForProject = c.totalHoursForProject || 0;
  const availableHoursTotal = c.availableHoursTotal || 0;

  body.innerHTML = `
    <div class="name-row">
      <span class="name">${c.name}</span>
      <span class="badge match ${matchClass}">${match}% Match</span>
    </div>
    <div class="meta">${c.title}</div>
    <div class="hours-info" style="margin: 8px 0; font-size: 13px; color: #666;">
      <div style="margin-bottom: 4px;">
        <strong>Horas semanais:</strong> ${workHoursPerWeek}h/sem
        <span style="margin-left: 12px;">
          <strong>Alocadas:</strong> ${allocatedHoursPerWeek}h/sem
        </span>
        <span style="margin-left: 12px;">
          <strong>Disponíveis:</strong> ${availableHoursPerWeek}h/sem
        </span>
      </div>
      <div style="margin-bottom: 4px; color: #7d1bff;">
        <strong>Total para o projeto (${sprintDuration} semanas):</strong> ${totalHoursForProject}h
        <span style="margin-left: 12px;">
          <strong>Disponíveis:</strong> ${availableHoursTotal}h
        </span>
      </div>
      ${
        requiredHoursTotal > 0
          ? `<div style="color: ${availableHoursTotal >= requiredHoursTotal ? '#2f7d32' : '#d32f2f'};">
              <strong>Necessárias para esta função (${requiredHoursPerWeek}h/sem × ${sprintDuration} sem):</strong> ${requiredHoursTotal}h
              ${availableHoursTotal >= requiredHoursTotal 
                ? ' ✓ (suficiente)' 
                : ` ⚠ (faltam ${requiredHoursTotal - availableHoursTotal}h)`}
            </div>`
          : ""
      }
    </div>
    <div class="tags">${c.skills
      .slice(0, 5)
      .map((s) => `<span class="tag">${s}</span>`)
      .join("")}</div>
    <div class="exp">Experiência: ${c.exp}</div>
  `;

  // Limita seleção à quantidade necessária e garante que o colaborador tenha a mesma função
  checkbox.addEventListener("change", () => {
    const max = role?.quantity ?? 2;
    const arr = state.selectedByRole[state.roleId] || [];
    
    // Verifica se o colaborador tem a mesma função da role selecionada
    const roleFunction = (role?.funcao || role?.title || role?.cargo || "").trim().toLowerCase();
    const candidateFunction = (c.jobTitle || "").trim().toLowerCase();
    
    if (checkbox.checked) {
      // Valida se a função do candidato corresponde à função da role
      if (candidateFunction !== roleFunction) {
        checkbox.checked = false;
        if (window.showNotification) {
          window.showNotification(
            "error",
            `Este colaborador não possui a função "${role?.funcao || role?.title || 'selecionada'}". Apenas colaboradores com a mesma função podem ser selecionados.`
          );
        }
        return;
      }
      
      if (arr.length >= max) {
        checkbox.checked = false;
        if (window.showNotification) {
          window.showNotification(
            "error",
            `Limite atingido: ${max} para ${role?.title || role?.funcao || "função"}.`
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
  const newRoleId = e.target.value;
  console.log("🔄 Mudando de função:", { 
    oldRoleId: state.roleId, 
    newRoleId,
    selectedRoles: selectedRoles.map(r => ({ id: r.id, funcao: r.funcao }))
  });
  state.roleId = newRoleId;
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

// O botão de salvar é configurado após o carregamento dos dados em fetchAndPrepareCandidates()

// Mostra botão próximo se estiver editando
const nextBtn = document.getElementById("nextBtn");
if (nextBtn) {
  const params = new URLSearchParams(window.location.search);
  const squadId = params.get("squadId") || params.get("id");
  const isEdit = !!params.get("id");
  
  if (isEdit) {
    nextBtn.style.display = "inline-block";
    nextBtn.addEventListener("click", () => {
      // Avançar para weekly requirements
      const param = isEdit ? `id=${squadId}` : (squadId ? `squadId=${squadId}` : "");
      window.location.href = `../squads-weekly-requirements/squads-weekly-requirements.html${param ? `?${param}` : ""}`;
    });
  }
}

document.getElementById("backBtn").addEventListener("click", () => {
  // Voltar para weekly requirements, mantendo o id
  const params = new URLSearchParams(window.location.search);
  const squadId = params.get("squadId") || params.get("id");
  const isEdit = !!params.get("id");
  const param = isEdit ? `id=${squadId}` : (squadId ? `squadId=${squadId}` : "");
  window.location.href = `../squads-weekly-requirements/squads-weekly-requirements.html${param ? `?${param}` : ""}`;
});

document.getElementById("saveBtn").addEventListener("click", async () => {
  localStorage.setItem(
    "squads.membersSelection",
    JSON.stringify(state.selectedByRole)
  );

  // Pega squadId da URL (pode ser squadId ou id)
  const params = new URLSearchParams(window.location.search);
  const squadId = params.get("squadId") || params.get("id");
  if (!squadId) {
    if (window.showNotification) {
      window.showNotification("error", "ID da Squad não encontrado na URL!");
    }
    return;
  }

  // Valida se há membros selecionados
  const totalSelected = Object.values(state.selectedByRole).reduce((sum, arr) => sum + (arr?.length || 0), 0);
  if (totalSelected === 0) {
    if (window.showNotification) {
      window.showNotification("error", "Selecione pelo menos um membro antes de salvar!");
    }
    return;
  }

  // Monta allocations
  const today = new Date();
  const startedAt = today.toISOString().split("T")[0]; // yyyy-mm-dd
  const allocations = [];
  const errors = [];
  
  Object.entries(state.selectedByRole).forEach(([roleId, memberIds]) => {
    const role = selectedRoles.find((r) => String(r.id) === String(roleId));
    const weekly = weeklyReqs.find((w) => String(w.id) === String(roleId));
    
    // Horas semanais alocadas
    const allocatedHours = weekly?.hours || 0;
    if (allocatedHours === 0) {
      errors.push(`Role "${role?.funcao || role?.title || roleId}" não tem horas definidas.`);
    }
    
    // Posição (função) - obrigatória
    const position = (role?.funcao || role?.title || role?.cargo || "").trim();
    if (!position) {
      errors.push(`Role ${roleId} não tem posição definida.`);
      return; // Pula esta role se não tiver posição
    }
    
    (memberIds || []).forEach((personId) => {
      if (!personId || isNaN(Number(personId))) {
        errors.push(`PersonId inválido: ${personId}`);
        return;
      }
      
      allocations.push({
        startedAt,
        allocatedHours: Number(allocatedHours), // Garante que é número
        personId: Number(personId),
        position,
      });
    });
  });
  
  // Valida antes de enviar
  if (errors.length > 0) {
    console.error("❌ Erros de validação:", errors);
    if (window.showNotification) {
      window.showNotification("error", `Erros encontrados:\n${errors.slice(0, 3).join("\n")}${errors.length > 3 ? "\n..." : ""}`);
    }
    return;
  }

  if (allocations.length === 0) {
    if (window.showNotification) {
      window.showNotification("error", "Nenhuma alocação para salvar!");
    }
    return;
  }

  console.log("💾 Salvando allocations:", { squadId, allocations });

  // Desabilita botão durante o salvamento
  const saveBtn = document.getElementById("saveBtn");
  const originalText = saveBtn.textContent;
  saveBtn.disabled = true;
  saveBtn.textContent = "Salvando...";

  try {
    // Aguarda apiService estar disponível
    const api = await apiService;
    
    console.log("📤 Enviando para API:", {
      squadId,
      allocationsCount: allocations.length,
      allocations: allocations.map(a => ({
        startedAt: a.startedAt,
        allocatedHours: a.allocatedHours,
        personId: a.personId,
        position: a.position
      }))
    });
    
    // Chama API
    const result = await api.insertSquadAllocations(squadId, allocations);
    
    console.log("📥 Resposta da API:", result);
    
    if (result && Array.isArray(result)) {
      if (window.showNotification) {
        window.showNotification("success", `Alocações salvas com sucesso! ${result.length} membro(s) alocado(s).`);
      }
      // Redireciona para a página de squads após salvar
      setTimeout(() => {
        window.location.href = "../../squads.html";
      }, 1500);
    } else {
      throw new Error("Resposta inválida da API - esperado array de allocations");
    }
  } catch (err) {
    console.error("❌ Erro ao salvar alocações:", err);
    console.error("❌ Detalhes do erro:", {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    
    let errorMessage = "Erro ao salvar alocações";
    if (err.message) {
      errorMessage += `: ${err.message}`;
    }
    
    if (window.showNotification) {
      window.showNotification("error", errorMessage);
    }
  } finally {
    // Reabilita botão
    saveBtn.disabled = false;
    saveBtn.textContent = originalText;
  }
});

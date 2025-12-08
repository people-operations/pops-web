function showSkeleton() {
  const container = document.getElementById("squad-list");
  if (!container) return;
  let skeletons = "";
  for (let i = 0; i < 3; i++) {
    skeletons += `
      <div class="skeleton-card">
        <div class="skeleton-header"></div>
        <div class="skeleton-line" style="width:90%"></div>
        <div class="skeleton-line" style="width:70%"></div>
        <div class="skeleton-line" style="width:60%"></div>
        <div class="skeleton-line" style="width:80%"></div>
        <div class="skeleton-btn"></div>
      </div>
    `;
  }
  container.innerHTML = skeletons;
}

import { apiService } from "../../../assets/js/apiService.js";

let squads = [];

// Função utilitária para interpolar variáveis em traduções
function interpolate(str, vars) {
  return str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

function renderSquads() {
  const container = document.getElementById("squad-list");
  container.innerHTML = "";
  const i18n = window.i18n;
  if (!squads || squads.length === 0) {
    container.innerHTML = `<p style="text-align:center;">Nenhuma squad encontrada.</p>`;
    return;
  }
  squads.forEach((squad) => {
    // Usa os campos vindos do backend
    const nome = squad.name || "-";
    const descricao = squad.description || "-";
    // Usar !== undefined para permitir 0 como valor válido
    const membros = squad.memberCount !== undefined ? squad.memberCount : 0;
    const tecnologias = squad.skills || [];
    const horasAlocadas = squad.allocatedHours !== undefined ? squad.allocatedHours : 0;
    const horasTotais = squad.totalHours !== undefined ? squad.totalHours : 0;
    const capacidade = squad.capacity !== undefined ? squad.capacity : 0;
    const porcentagem = (horasTotais > 0) ? (horasAlocadas / horasTotais) * 100 : 0;
    // Status: true = Ativo, false = Inativo (default: Ativo se não especificado)
    const statusText = squad.status === false ? "Inativo" : "Ativo";
    
    container.innerHTML += `
      <div class="squad-card">
        <div class="squad-header">
          <h3>${nome}</h3>
        </div>
        <div class="squad-status" style="margin-top: 2px; margin-bottom: 12px;">
          <span class="tag-green">${statusText}</span>
        </div>
        <p class="squad-description">${descricao}</p>
        <p>
          <img src="/assets/svg/members.svg" alt="Membros" style="vertical-align:middle; margin-right:4px; width:15px; height:15px;">
          <strong data-i18n="squads.members">${i18n.t("squads.members")}</strong> ${membros}
        </p>
        <p>
          <strong data-i18n="squads.capacity">${i18n.t("squads.capacity")}</strong> ${capacidade}h
        </p>
        ${Array.isArray(tecnologias) && tecnologias.length > 0 ? `
        <div class="tech-stack">
          ${tecnologias.map((tech) => `<span>${tech.name || tech}</span>`).join("")}
        </div>
        ` : ""}
        <div class="hours">
          <div class="hours-row">
            <span data-i18n="squads.allocated_hours">${i18n.t("squads.allocated_hours")}</span>
            <span class="hours-value">${horasAlocadas}h / ${horasTotais}h</span>
          </div>
          <div class="progress-bar">
            <div class="progress" style="width: ${porcentagem}%"></div>
          </div>
        </div>
        <div class="squad-footer">
          <button class="details-btn" data-i18n="squads.details" onclick="window.location.href='squads-detail/squads-detail.html?id=${squad.id}'">
            ${i18n.t("squads.details")}
          </button>
        </div>
      </div>
    `;
  });
}

async function fetchAndRenderSquads() {
  // Mostrar loader
  const loader = document.getElementById("loader");
  const mainContent = document.getElementById("main-content");
  if (loader) {
    loader.classList.remove("hidden");
    loader.innerHTML = '<div class="spinner"></div><p>Carregando squads...</p>';
  }
  if (mainContent) mainContent.classList.add("hidden");
  
  showSkeleton();
  try {
    // Verificar access_level
    const { getCurrentAccessLevel } = await import("../../../assets/js/permissions.js");
    const accessLevel = getCurrentAccessLevel();
    const isCollaborator = accessLevel === 3;
    
    let response = await apiService.getAllSquads();
    
    // Se for colaborador, filtrar apenas suas squads
    if (isCollaborator) {
      const userId = localStorage.getItem("userId");
      if (userId) {
        try {
          // Buscar alocações do colaborador
          const allocations = await apiService.getAllocationsByEmployeeId(userId);
          const squadIds = [...new Set(allocations.map(a => a.team?.id || a.teamId || a.squadId).filter(id => id != null))];
          
          // Filtrar squads
          if (Array.isArray(response)) {
            response = response.filter(s => squadIds.includes(s.id));
            console.log("✅ Squads filtradas para colaborador:", response.length);
          }
        } catch (error) {
          console.warn("⚠️ Erro ao filtrar squads do colaborador:", error);
        }
      }
    }
    
    // O apiService já retorna um array
    if (Array.isArray(response)) {
      squads = response;
    } else {
      squads = [];
    }
    
    renderSquads();
    
    // Ocultar loader e mostrar conteúdo
    if (loader) loader.classList.add("hidden");
    if (mainContent) mainContent.classList.remove("hidden");
  } catch (err) {
    window.showNotification &&
      window.showNotification("error", "Erro ao buscar squads.");
    console.error("Erro ao buscar squads:", err);
    squads = [];
    renderSquads();
    
    // Ocultar loader mesmo em caso de erro
    if (loader) loader.classList.add("hidden");
    if (mainContent) mainContent.classList.remove("hidden");
  }
}

if (typeof window !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    fetchAndRenderSquads();
    // Se quiser manter tradução:
    if (window.i18n) window.i18n.apply();
  });
}


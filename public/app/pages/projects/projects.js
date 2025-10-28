import { apiService } from "../../../assets/js/apiService.js";

let projects = [];

async function fetchAndRenderProjects() {
  try {
    projects = await apiService.getAllProjects();
    renderProjects(projects);
  } catch (err) {
    window.showNotification &&
      window.showNotification("error", "Erro ao buscar projetos.");
    console.error("Erro ao buscar projetos:", err);
  }
}

function interpolate(str, vars) {
  return str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

function renderProjects(projects) {
  const container = document.getElementById("project-list");
  container.innerHTML = "";
  const i18n = window.i18n;
  if (!Array.isArray(projects) || projects.length === 0) {
    container.innerHTML = `<div style="padding:32px; text-align:center; color:#888;">Nenhum projeto encontrado.</div>`;
    return;
  }
  projects.forEach((project) => {
    const statusName =
      project.status?.description || project.status?.name || "-";
    const typeName = project.type?.description || project.type?.name || "-";
    const area = project.area || "-";
    const budget = project.budget
      ? `R$ ${Number(project.budget).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
        })}`
      : "-";
    const startDate = project.startDate
      ? new Date(project.startDate).toLocaleDateString("pt-BR")
      : "-";
    const endDate = project.endDate
      ? new Date(project.endDate).toLocaleDateString("pt-BR")
      : "-";
    const skills = Array.isArray(project.requiredSkills)
      ? project.requiredSkills.map((s) => s.name).join(", ")
      : "-";
    container.innerHTML += `
      <div class="project-card">
        <div class="project-header">
          <h3>${project.name}</h3>
          <span class="tag-green">${statusName}</span>
        </div>
        <p class="project-description">${project.description || ""}</p>
        <p>
          <img src="/assets/svg/budget.svg" alt="budget" style="vertical-align:middle; margin-right:4px; width:15px; height:15px;">
          <strong data-i18n="projects.budget">${
            i18n?.t ? i18n.t("projects.budget") : "Budget"
          }</strong> ${budget}
        </p>
        <p>
          <img src="/assets/svg/calendar.svg" alt="Início" style="vertical-align:middle; margin-right:4px; width:15px; height:15px;">
          <strong data-i18n="projects.startedAt">${
            i18n?.t ? i18n.t("projects.startedAt") : "Início"
          }</strong> ${startDate}
        </p>
        <p>
          <img src="/assets/svg/calendar.svg" alt="Fim" style="vertical-align:middle; margin-right:4px; width:15px; height:15px;">
          <strong>Fim:</strong> ${endDate}
        </p>
        <div class="project-footer">
          <span></span>
          <button class="details-btn" data-i18n="projects.details" onclick="window.location.href='projects-detail/projects-detail.html?id=${
            project.id
          }'">
            ${i18n?.t ? i18n.t("projects.details") : "Detalhes"}
          </button>
        </div>
      </div>
    `;
  });
}

// Inicialização dinâmica para garantir tradução e fetch
if (typeof window !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    fetchAndRenderProjects();
    // Se quiser manter tradução:
    if (window.i18n) window.i18n.apply();
  });
}

// Inicialização dinâmica para garantir tradução
if (typeof window !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    if (typeof renderProjects === "function") {
      renderProjects();
      if (window.i18n) window.i18n.apply();
    }
  });
}

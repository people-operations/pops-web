import { apiService } from "../../../assets/js/apiService.js";

let projects = [];

async function fetchAndRenderProjects() {
  showSkeleton();
  try {
    projects = await apiService.getAllProjects();
    renderProjects(projects);
  } catch (err) {
    const i18n = window.i18n;
    window.showNotification &&
      window.showNotification(
        "error",
        i18n?.t ? i18n.t("projects.fetch_error") : "Erro ao buscar projetos."
      );
    console.error(
      i18n?.t ? i18n.t("projects.fetch_error") : "Erro ao buscar projetos:",
      err
    );
    renderProjects([]);
  }
}

function showSkeleton() {
  const container = document.getElementById("project-list");
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

function renderProjects(projects) {
  const container = document.getElementById("project-list");
  container.innerHTML = "";
  const i18n = window.i18n;
  if (!Array.isArray(projects) || projects.length === 0) {
    container.innerHTML = `<div style="padding:32px; text-align:center; color:#888;">${
      i18n?.t ? i18n.t("projects.not_found") : "Nenhum projeto encontrado."
    }</div>`;
    return;
  }
  projects.forEach((project) => {
    const statusName =
      project.status?.description || project.status?.name || "-";
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
            i18n?.t ? i18n.t("projects.budget") : "Budget:"
          }</strong> ${budget}
        </p>
        <p>
          <img src="/assets/svg/calendar.svg" alt="Início" style="vertical-align:middle; margin-right:4px; width:15px; height:15px;">
          <strong data-i18n="projects.startedAt">${
            i18n?.t ? i18n.t("projects.startedAt") : "Começou:"
          }</strong> ${startDate}
        </p>
        <p>
          <img src="/assets/svg/calendar.svg" alt="Fim" style="vertical-align:middle; margin-right:4px; width:15px; height:15px;">
          <strong data-i18n="projects.endedAt">${
            i18n?.t ? i18n.t("projects.endedAt") : "Fim:"
          }</strong> ${endDate}
        </p>
        <div class="project-footer">
          <span></span>
          <button class="details-btn" data-i18n="projects.details" onclick="window.location.href='projects-detail/projects-detail.html?id=${
            project.id
          }'">
            ${i18n?.t ? i18n.t("projects.details") : "Mais detalhes"}
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
    if (window.i18n) window.i18n.apply();
  });
}

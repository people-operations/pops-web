import { apiService } from "../../../../assets/js/apiService.js";

// Salva o HTML original da sidebar para restaurar depois do skeleton
let originalSidebarHTML = null;
function showSkeletonDetail() {
  const summary = document.querySelector(".summary");
  if (summary) {
    if (!originalSidebarHTML) {
      originalSidebarHTML = summary.innerHTML;
    }
    summary.innerHTML = `
      <div class="summary-header">
        <span class="skeleton-box" style="width:70px;height:23px;margin:0 auto 16px auto;"></span>
        <div class="skeleton-box" style="width:80%;height:22px;margin:0 auto 8px auto;"></div>
      </div>
      <span class="status-badge skeleton-box" style="width:60%;height:18px;margin:0 auto 8px auto;"></span>
      <p class="description skeleton-box" style="width:90%;height:16px;"></p>
      <p class="info-line skeleton-box" style="width:60%;height:18px;"></p>
      <p class="info-line skeleton-box" style="width:50%;height:18px;"></p>
      <p class="info-line skeleton-box" style="width:70%;height:18px;"></p>
    `;
  }
  // Financeiro
  const financeCard = document.querySelector(".finance-card-inside");
  if (financeCard) {
    financeCard.innerHTML = `
      <div>
        <p class="skeleton-box" style="width:60px;height:18px;margin:0 auto 8px auto;"></p>
        <div class="value pink-text skeleton-box" style="width:80px;height:22px;margin:0 auto 8px auto;"></div>
        <small class="skeleton-box" style="width:40px;height:14px;margin:0 auto 8px auto;"></small>
      </div>
      <div>
        <p class="skeleton-box" style="width:60px;height:18px;margin:0 auto 8px auto;"></p>
        <div class="value pink-text skeleton-box" style="width:80px;height:22px;margin:0 auto 8px auto;"></div>
        <small class="skeleton-box" style="width:40px;height:14px;margin:0 auto 8px auto;"></small>
      </div>
    `;
  }
  // Equipes
  const teamsList = document.querySelector(".teams-list");
  if (teamsList) {
    teamsList.innerHTML = `
      <div class="team-card pink">
        <h5 class="team-name skeleton-box" style="width:40%;height:18px;"></h5>
        <p class="team-info skeleton-box" style="width:60%;height:14px;"></p>
        <p class="team-info skeleton-box" style="width:40%;height:14px;"></p>
        <div class="skills">
          <span class="skill skeleton-box" style="width:40px;height:14px;"></span>
          <span class="skill skeleton-box" style="width:40px;height:14px;"></span>
        </div>
      </div>
      <div class="team-card cyan">
        <h5 class="team-name skeleton-box" style="width:40%;height:18px;"></h5>
        <p class="team-info skeleton-box" style="width:60%;height:14px;"></p>
        <p class="team-info skeleton-box" style="width:40%;height:14px;"></p>
        <div class="skills">
          <span class="skill skeleton-box" style="width:40px;height:14px;"></span>
        </div>
      </div>
      <div class="team-card purple">
        <h5 class="team-name skeleton-box" style="width:40%;height:18px;"></h5>
        <p class="team-info skeleton-box" style="width:60%;height:14px;"></p>
        <p class="team-info skeleton-box" style="width:40%;height:14px;"></p>
        <div class="skills">
          <span class="skill skeleton-box" style="width:40px;height:14px;"></span>
        </div>
      </div>
    `;
  }
}

function getProjectIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function formatCurrency(value) {
  if (!value) return "-";
  return `R$ ${Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
  })}`;
}

function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("pt-BR");
}

function addSidebarActionListeners() {
  // Modal delete
  const deleteBtn = document.querySelector(".delete-project-btn");
  if (deleteBtn) deleteBtn.addEventListener("click", showDeleteModal);
  const editBtn = document.querySelector(".edit-project-btn");
  if (editBtn) {
    editBtn.addEventListener("click", () => {
      const id = getProjectIdFromUrl();
      if (id) {
        window.location.href = `../projects-form/projects-form.html?id=${id}`;
      }
    });
  }
}

async function renderProjectDetail() {
  const id = getProjectIdFromUrl();
  if (!id) {
    window.showNotification &&
      window.showNotification("error", "ID do projeto não encontrado na URL.");
    // Remove skeleton e restaura sidebar
    if (originalSidebarHTML) {
      document.querySelector(".summary").innerHTML = originalSidebarHTML;
      addSidebarActionListeners();
    }
    return;
  }
  const project = await apiService.getProjectById(id);
  if (!project) {
    window.showNotification &&
      window.showNotification("error", "Projeto não encontrado.");
    if (originalSidebarHTML) {
      document.querySelector(".summary").innerHTML = originalSidebarHTML;
      addSidebarActionListeners();
    }
    return;
  }
  // Sidebar: restaura o HTML original antes de preencher
  if (originalSidebarHTML) {
    document.querySelector(".summary").innerHTML = originalSidebarHTML;
    addSidebarActionListeners();
  }
  document.querySelector(".project-title").textContent = project.name || "-";
  document.querySelector(".status-badge").textContent =
    project.status?.description || project.status?.name || "-";
  document.querySelector(".description").textContent =
    project.description || "-";
  document.querySelector(
    "[data-i18n='projects_detail.area']"
  ).nextSibling.textContent = ` ${project.area || "-"} • `;
  document.querySelector(
    "[data-i18n='projects_detail.squads_count']"
  ).textContent = `${project.squads?.length || 0} squads`;
  document.querySelector(
    "[data-i18n='projects_detail.budget']"
  ).nextSibling.textContent = ` ${formatCurrency(project.budget)}`;
  document.querySelector(
    "[data-i18n='projects_detail.dates']"
  ).nextSibling.textContent = ` ${formatDate(project.startDate)} – ${formatDate(
    project.endDate
  )}`;
  // Equipes (teams)
  const teamsList = document.querySelector(".teams-list");
  if (Array.isArray(project.squads) && project.squads.length) {
    teamsList.innerHTML = project.squads
      .map(
        (squad, idx) => `
          <div class="team-card ${["pink", "cyan", "purple"][idx % 3]}">
            <h5 class="team-name">${squad.name || "-"}</h5>
            <p class="team-info"><strong data-i18n="projects_detail.po">PO:</strong> ${
              squad.po || "-"
            } • ${squad.members?.length || 0} membros</p>
            <p class="team-info" data-i18n="projects_detail.skills_needed">Skills necessários do projeto:</p>
            <div class="skills">
              ${
                Array.isArray(squad.skills) && squad.skills.length
                  ? squad.skills
                      .map(
                        (skill) => `<span class="skill">${skill.name}</span>`
                      )
                      .join("")
                  : "-"
              }
            </div>
          </div>
        `
      )
      .join("");
  } else {
    teamsList.innerHTML =
      '<div style="padding:16px; color:#888;">Nenhuma equipe cadastrada.</div>';
  }
  // Financeiro (exemplo, ajuste conforme backend)
  const financeCard = document.querySelector(".finance-card-inside");
  if (financeCard) {
    financeCard.innerHTML = `
      <div>
        <p>Mensal</p>
        <div class="value pink-text">${formatCurrency(
          project.monthlyCost || 0
        )}</div>
        <small>Mensal</small>
      </div>
      <div>
        <p>Total</p>
        <div class="value pink-text">${formatCurrency(
          project.totalInvestment || 0
        )}</div>
        <small>Total</small>
      </div>
    `;
  }
}

function showDeleteModal() {
  document.getElementById("delete-modal").style.display = "flex";
}
function hideDeleteModal() {
  document.getElementById("delete-modal").style.display = "none";
}

async function handleDeleteProject() {
  const id = getProjectIdFromUrl();
  if (!id) return;
  const confirmBtn = document.getElementById("confirm-delete-btn");
  if (confirmBtn) confirmBtn.disabled = true;
  const success = await apiService.deleteProjectById(id);
  if (success) {
    window.showNotification &&
      window.showNotification("success", "Projeto excluído com sucesso!");
    setTimeout(() => {
      window.location.href = "../projects.html";
    }, 1800); // 1.8 segundos para o usuário ler a mensagem
  } else {
    window.showNotification &&
      window.showNotification("error", "Erro ao excluir projeto.");
    hideDeleteModal();
    if (confirmBtn) confirmBtn.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  showSkeletonDetail();
  setTimeout(renderProjectDetail, 0);
  // Modal delete (fora da sidebar)
  const cancelBtn = document.getElementById("cancel-delete-btn");
  if (cancelBtn) cancelBtn.addEventListener("click", hideDeleteModal);
  const confirmBtn = document.getElementById("confirm-delete-btn");
  if (confirmBtn) confirmBtn.addEventListener("click", handleDeleteProject);
});

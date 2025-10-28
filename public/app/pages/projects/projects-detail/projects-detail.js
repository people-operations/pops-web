import { apiService } from "../../../../assets/js/apiService.js";

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

async function renderProjectDetail() {
  const id = getProjectIdFromUrl();
  if (!id) {
    window.showNotification &&
      window.showNotification("error", "ID do projeto não encontrado na URL.");
    return;
  }
  const project = await apiService.getProjectById(id);
  if (!project) {
    window.showNotification &&
      window.showNotification("error", "Projeto não encontrado.");
    return;
  }
  // Sidebar
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
                  .map((skill) => `<span class="skill">${skill.name}</span>`)
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
  document.querySelector(".finance-card-inside .value.pink-text").textContent =
    formatCurrency(project.monthlyCost || 0);
  document.querySelectorAll(
    ".finance-card-inside .value.pink-text"
  )[1].textContent = formatCurrency(project.totalInvestment || 0);
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
  const success = await apiService.deleteProjectById(id);
  if (success) {
    window.showNotification && window.showNotification("success", "Projeto excluído com sucesso!");
    window.location.href = "../projects.html";
  } else {
    window.showNotification && window.showNotification("error", "Erro ao excluir projeto.");
    hideDeleteModal();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderProjectDetail();
  // Modal delete
  const deleteBtn = document.querySelector(".delete-project-btn");
  if (deleteBtn) deleteBtn.addEventListener("click", showDeleteModal);
  const cancelBtn = document.getElementById("cancel-delete-btn");
  if (cancelBtn) cancelBtn.addEventListener("click", hideDeleteModal);
  const confirmBtn = document.getElementById("confirm-delete-btn");
  if (confirmBtn) confirmBtn.addEventListener("click", handleDeleteProject);
  // Editar
  const editBtn = document.querySelector(".edit-project-btn");
  if (editBtn) {
    editBtn.addEventListener("click", () => {
      const id = getProjectIdFromUrl();
      if (id) {
        window.location.href = `../projects-form/projects-form.html?id=${id}`;
      }
    });
  }
});

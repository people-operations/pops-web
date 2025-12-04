import { apiService } from "../../../../assets/js/apiService.js";
import { hasAccess, hasAnyAccess, applyAccessControl, protectFunction } from "../../../../assets/js/permissions.js";

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
      <p class="info-line skeleton-box" style="width:50%;height:18px;"></p>
      <p class="info-line skeleton-box" style="width:60%;height:18px;"></p>
      <p class="info-line skeleton-box" style="width:70%;height:18px;"></p>
      <p class="info-line skeleton-box" style="width:70%;height:18px;"></p>
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

function capitalizeFirst(str) {
  if (!str || typeof str !== "string") return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Cache de funcionários para evitar múltiplas chamadas
const employeeCache = new Map();

async function getEmployeeWithCache(employeeId) {
  if (employeeCache.has(employeeId)) {
    return employeeCache.get(employeeId);
  }
  
  try {
    const employee = await apiService.getCollaboratorById(employeeId);
    if (employee) {
      employeeCache.set(employeeId, employee);
    }
    return employee;
  } catch (err) {
    console.error(`Erro ao buscar funcionário ${employeeId}:`, err);
    return null;
  }
}

async function calculateLaborCost(project) {
  try {
    if (!project.squads || project.squads.length === 0) {
      return 0;
    }
    
    let totalCost = 0;
    const employeePromises = [];
    const allocationData = [];
    
    // Coletar todas as alocações primeiro
    for (const squad of project.squads) {
      try {
        const allocations = await apiService.getSquadAllocations(squad.id);
        if (allocations && allocations.length > 0) {
          allocations.forEach((allocation) => {
            if (allocation.employee && allocation.employee.id) {
              allocationData.push({
                employeeId: allocation.employee.id,
                allocatedHours: allocation.allocatedHours || 0
              });
            }
          });
        }
      } catch (err) {
        console.error(`Erro ao buscar alocações do squad ${squad.id}:`, err);
      }
    }
    
    // Buscar todos os funcionários em paralelo
    const uniqueEmployeeIds = [...new Set(allocationData.map(a => a.employeeId))];
    const employeePromisesList = uniqueEmployeeIds.map(id => getEmployeeWithCache(id));
    const employees = await Promise.all(employeePromisesList);
    
    // Criar mapa de funcionários
    const employeeMap = new Map();
    employees.forEach((emp, index) => {
      if (emp) {
        employeeMap.set(uniqueEmployeeIds[index], emp);
      }
    });
    
    // Calcular custo total
    allocationData.forEach(({ employeeId, allocatedHours }) => {
      const employee = employeeMap.get(employeeId);
      if (employee && employee.salary) {
        // Calcular proporção do salário baseado nas horas alocadas
        // Assumindo 160 horas/mês como padrão
        const monthlyHours = 160;
        const hourlyRate = employee.salary / monthlyHours;
        const cost = hourlyRate * allocatedHours;
        totalCost += cost;
      }
    });
    
    return totalCost;
  } catch (err) {
    console.error("Erro ao calcular custo de mão de obra:", err);
    return 0;
  }
}

function addSidebarActionListeners() {
  // Aplicar controle de acesso aos botões
  applyAccessControl();
  
  // Modal disable - apenas manager (1 ou 2) pode desativar
  const deleteBtn = document.querySelector(".delete-project-btn");
  if (deleteBtn) {
    // Remover event listeners anteriores para evitar duplicação
    const newDeleteBtn = deleteBtn.cloneNode(true);
    deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
    // Adicionar novo listener
    newDeleteBtn.addEventListener("click", protectFunction([1, 2], showDisableModal));
  }
  
  // Botão ativar - apenas manager (1 ou 2) pode ativar
  const activateBtn = document.querySelector(".activate-project-btn");
  if (activateBtn) {
    // Remover event listeners anteriores para evitar duplicação
    const newActivateBtn = activateBtn.cloneNode(true);
    activateBtn.parentNode.replaceChild(newActivateBtn, activateBtn);
    // Adicionar novo listener
    newActivateBtn.addEventListener("click", protectFunction([1, 2], showEnableModal));
  }
  
  // Botão editar - manager (1 ou 2) pode editar
  const editBtn = document.querySelector(".edit-project-btn");
  if (editBtn) {
    // Remover event listeners anteriores para evitar duplicação
    const newEditBtn = editBtn.cloneNode(true);
    editBtn.parentNode.replaceChild(newEditBtn, editBtn);
    // Adicionar novo listener
    newEditBtn.addEventListener("click", protectFunction([1, 2], () => {
      const id = getProjectIdFromUrl();
      if (id) {
        window.location.href = `../projects-form/projects-form.html?id=${id}`;
      }
    }));
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
  
  // Debug: verificar se as squads estão vindo na resposta
  console.log("Projeto carregado:", project);
  console.log("Squads recebidas:", project.squads);
  // Sidebar: restaura o HTML original antes de preencher
  if (originalSidebarHTML) {
    document.querySelector(".summary").innerHTML = originalSidebarHTML;
  }
  
  // Configurar botão de ação baseado no status ativo/inativo
  const actionBtnContainer = document.getElementById("project-action-btn");
  if (actionBtnContainer) {
    const isActive = project.active !== false; // Considera true ou undefined como ativo
    
    if (isActive) {
      // Projeto ativo: mostrar ícone de lixeira para desativar
      actionBtnContainer.innerHTML = `
        <img
          src="../../../../assets/svg/trash-button.svg"
          alt="Desativar"
          class="action-icon delete-project-btn"
          title="Desativar"
          data-require-access="1,2"
          style="vertical-align: middle; width: 34px; height: 34px; cursor:pointer;"
        />
      `;
    } else {
      // Projeto inativo: mostrar ícone de seta verde para ativar
      actionBtnContainer.innerHTML = `
        <button class="action-icon activate-project-btn" title="Ativar" data-require-access="1,2" style="background: none; border: none; cursor: pointer; padding: 0; vertical-align: middle; display: inline-block; width: 34px; height: 34px; line-height: 0;">
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block;">
            <rect x="0.5" y="0.5" width="33" height="33" rx="3.5" fill="white"/>
            <rect x="0.5" y="0.5" width="33" height="33" rx="3.5" stroke="#4CAF50"/>
            <path d="M17 10L17 20M12 15L17 10L22 15" stroke="#4CAF50" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      `;
    }
  }
  
  // Sempre adiciona os listeners após preencher os dados
  // Aplicar controle de acesso primeiro
  applyAccessControl();
  addSidebarActionListeners();
  document.querySelector(".project-title").textContent = project.name || "-";
  document.querySelector(".status-badge").textContent =
    capitalizeFirst(project.status?.name || project.status?.description || "-");
  document.querySelector(".description").textContent =
    project.description || "-";
  
  // Área
  const areaElement = document.getElementById("project-area");
  if (areaElement) {
    areaElement.textContent = project.area || "-";
  }
  
  // Qtd. Squads
  const squadsCountElement = document.getElementById("project-squads-count");
  if (squadsCountElement) {
    squadsCountElement.textContent = project.squads?.length || 0;
  }
  
  // Tipo
  const typeElement = document.getElementById("project-type");
  if (typeElement) {
    typeElement.textContent = capitalizeFirst(project.type?.name || "-");
  }
  
  // Budget
  const budgetElement = document.getElementById("project-budget");
  if (budgetElement) {
    budgetElement.textContent = formatCurrency(project.budget);
  }
  
  // Mão de obra aplicada
  const laborCostElement = document.getElementById("project-labor-cost");
  if (laborCostElement) {
    const laborCost = await calculateLaborCost(project);
    const laborCostFormatted = laborCost > 0
      ? `R$ ${Number(laborCost).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
        })}`
      : "-";
    laborCostElement.textContent = laborCostFormatted;
  }
  
  // Datas
  const datesElement = document.getElementById("project-dates");
  if (datesElement) {
    datesElement.textContent = `${formatDate(project.startDate)} – ${formatDate(project.endDate)}`;
  }
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
}

function showDisableModal() {
  const modal = document.getElementById("disable-modal");
  if (modal) {
    modal.style.display = "flex";
  }
}

function hideDisableModal() {
  const modal = document.getElementById("disable-modal");
  if (modal) {
    modal.style.display = "none";
  }
}

async function handleDisableProject() {
  const id = getProjectIdFromUrl();
  if (!id) return;
  const confirmBtn = document.getElementById("confirm-disable-btn");
  if (confirmBtn) confirmBtn.disabled = true;
  
  try {
    await apiService.disableProject(id);
    window.showNotification &&
      window.showNotification("success", "Projeto desativado com sucesso!");
    setTimeout(() => {
      window.location.href = "../projects.html";
    }, 1800);
  } catch (error) {
    window.showNotification &&
      window.showNotification("error", "Erro ao desativar projeto.");
    hideDisableModal();
    if (confirmBtn) confirmBtn.disabled = false;
  }
}

function showEnableModal() {
  const modal = document.getElementById("enable-modal");
  if (modal) {
    modal.style.display = "flex";
  }
}

function hideEnableModal() {
  const modal = document.getElementById("enable-modal");
  if (modal) {
    modal.style.display = "none";
  }
}

async function handleEnableProject() {
  const id = getProjectIdFromUrl();
  if (!id) return;
  const confirmBtn = document.getElementById("confirm-enable-btn");
  if (confirmBtn) confirmBtn.disabled = true;
  
  try {
    await apiService.enableProject(id);
    window.showNotification &&
      window.showNotification("success", "Projeto ativado com sucesso!");
    setTimeout(() => {
      window.location.reload(); // Recarrega a página para atualizar o ícone
    }, 1800);
  } catch (error) {
    window.showNotification &&
      window.showNotification("error", "Erro ao ativar projeto.");
    hideEnableModal();
    if (confirmBtn) confirmBtn.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  showSkeletonDetail();
  setTimeout(renderProjectDetail, 0);
  // Modal disable (fora da sidebar)
  const cancelDisableBtn = document.getElementById("cancel-disable-btn");
  if (cancelDisableBtn) cancelDisableBtn.addEventListener("click", hideDisableModal);
  const confirmDisableBtn = document.getElementById("confirm-disable-btn");
  if (confirmDisableBtn) confirmDisableBtn.addEventListener("click", handleDisableProject);
  
  // Modal enable (fora da sidebar)
  const cancelEnableBtn = document.getElementById("cancel-enable-btn");
  if (cancelEnableBtn) cancelEnableBtn.addEventListener("click", hideEnableModal);
  const confirmEnableBtn = document.getElementById("confirm-enable-btn");
  if (confirmEnableBtn) confirmEnableBtn.addEventListener("click", handleEnableProject);
});

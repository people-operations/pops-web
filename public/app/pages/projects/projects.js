import { apiService } from "../../../assets/js/apiService.js";

let projects = [];
let allProjects = [];
let projectTypes = [];
let projectStatuses = [];
let currentPage = 1;
const itemsPerPage = 9;

async function fetchAndRenderProjects() {
  showSkeleton();
  try {
    const { getAuthTokenOrThrow } = await import("../../../assets/js/apiService.js");
    const token = getAuthTokenOrThrow();
    
    // Buscar projetos ativos e inativos
    const [activeProjects, inactiveProjects, activeTypes, inactiveTypes, activeStatuses, inactiveStatuses] = await Promise.all([
      apiService.getAllProjects(),
      fetch("http://localhost:8082/api/projects/inactive", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }).then(res => res.ok && res.status !== 204 ? res.json() : []).catch(() => []),
      apiService.getProjectTypes(),
      fetch("http://localhost:8082/api/project-types/inactive", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }).then(res => res.ok && res.status !== 204 ? res.json() : []).catch(() => []),
      apiService.getProjectStatuses(),
      fetch("http://localhost:8082/api/project-status/inactive", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }).then(res => res.ok && res.status !== 204 ? res.json() : []).catch(() => [])
    ]);
    
    // Combinar projetos ativos e inativos
    const active = Array.isArray(activeProjects) ? activeProjects : [];
    const inactive = Array.isArray(inactiveProjects) ? inactiveProjects : [];
    allProjects = [...active, ...inactive];
    
    // Ordenar alfabeticamente por nome
    allProjects.sort((a, b) => {
      const nameA = (a.name || "").toLowerCase();
      const nameB = (b.name || "").toLowerCase();
      return nameA.localeCompare(nameB, 'pt-BR');
    });
    
    projects = [...allProjects];
    
    projectTypes = [...(Array.isArray(activeTypes) ? activeTypes : []), ...(Array.isArray(inactiveTypes) ? inactiveTypes : [])];
    projectStatuses = [...(Array.isArray(activeStatuses) ? activeStatuses : []), ...(Array.isArray(inactiveStatuses) ? inactiveStatuses : [])];
    
    populateFilters();
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

function populateFilters() {
  const statusFilter = document.getElementById("status-filter");
  const typeFilter = document.getElementById("type-filter");
  
  if (statusFilter && projectStatuses) {
    // Ordenar: ativos primeiro, depois inativos
    const sortedStatuses = [...projectStatuses].sort((a, b) => {
      if (a.active === b.active) return 0;
      return a.active ? -1 : 1;
    });
    
    sortedStatuses.forEach((status) => {
      const option = document.createElement("option");
      option.value = status.id;
      const statusName = capitalizeFirst(status.name);
      option.textContent = status.active ? statusName : `${statusName} (Inativo)`;
      if (!status.active) {
        option.style.color = "#888";
        option.style.fontStyle = "italic";
      }
      statusFilter.appendChild(option);
    });
  }
  
  if (typeFilter && projectTypes) {
    // Ordenar: ativos primeiro, depois inativos
    const sortedTypes = [...projectTypes].sort((a, b) => {
      if (a.active === b.active) return 0;
      return a.active ? -1 : 1;
    });
    
    sortedTypes.forEach((type) => {
      const option = document.createElement("option");
      option.value = type.id;
      const typeName = capitalizeFirst(type.name);
      option.textContent = type.active ? typeName : `${typeName} (Inativo)`;
      if (!type.active) {
        option.style.color = "#888";
        option.style.fontStyle = "italic";
      }
      typeFilter.appendChild(option);
    });
  }
}

function capitalizeFirst(str) {
  if (!str || typeof str !== "string") return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function applyFilters() {
  const nameFilter = document.getElementById("name-filter")?.value?.trim().toLowerCase() || "";
  const activeFilter = document.getElementById("active-filter")?.value || "all";
  const statusFilter = document.getElementById("status-filter")?.value;
  const typeFilter = document.getElementById("type-filter")?.value;
  const areaFilter = document.getElementById("area-filter")?.value || "";
  const sortBy = document.getElementById("sort-by")?.value || "name";
  
  projects = allProjects.filter((project) => {
    // Filtro por nome ou descrição (busca avançada)
    const searchText = nameFilter.toLowerCase();
    const matchesName = !searchText || 
      (project.name || "").toLowerCase().includes(searchText) ||
      (project.description || "").toLowerCase().includes(searchText);
    
    // Filtro de ativo/inativo
    let matchesActive = true;
    if (activeFilter === "active") {
      matchesActive = project.active !== false; // Considera true ou undefined como ativo
    } else if (activeFilter === "inactive") {
      matchesActive = project.active === false;
    }
    
    // Filtro de status
    const matchesStatus = !statusFilter || project.status?.id == statusFilter;
    
    // Filtro de tipo
    const matchesType = !typeFilter || project.type?.id == typeFilter;
    
    // Filtro de área
    const matchesArea = !areaFilter || (project.area || "").toLowerCase().includes(areaFilter.toLowerCase());
    
    return matchesName && matchesActive && matchesStatus && matchesType && matchesArea;
  });
  
  // Ordenação
  projects.sort((a, b) => {
    switch (sortBy) {
      case "name":
        const nameA = (a.name || "").toLowerCase();
        const nameB = (b.name || "").toLowerCase();
        return nameA.localeCompare(nameB, 'pt-BR');
      
      case "startDate":
        const dateA = a.startDate ? new Date(a.startDate) : new Date(0);
        const dateB = b.startDate ? new Date(b.startDate) : new Date(0);
        return dateB - dateA; // Mais recente primeiro
      
      case "endDate":
        const endDateA = a.endDate ? new Date(a.endDate) : new Date(0);
        const endDateB = b.endDate ? new Date(b.endDate) : new Date(0);
        return endDateA - endDateB; // Mais próximo primeiro
      
      case "budget":
        const budgetA = a.budget ? Number(a.budget) : 0;
        const budgetB = b.budget ? Number(b.budget) : 0;
        return budgetB - budgetA; // Maior primeiro
      
      default:
        return 0;
    }
  });
  
  // Resetar para primeira página ao aplicar filtros
  currentPage = 1;
  
  renderProjects(projects);
}

function showSkeleton() {
  const container = document.getElementById("project-list");
  if (!container) return;
  let skeletons = "";
  for (let i = 0; i < itemsPerPage; i++) {
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

async function renderProjects(projects) {
  const container = document.getElementById("project-list");
  container.innerHTML = "";
  const i18n = window.i18n;
  
  if (!Array.isArray(projects) || projects.length === 0) {
    container.innerHTML = `<div style="padding:32px; text-align:center; color:#888;">${
      i18n?.t ? i18n.t("projects.not_found") : "Nenhum projeto encontrado."
    }</div>`;
    updatePagination(0);
    return;
  }
  
  // Calcular paginação
  const totalPages = Math.ceil(projects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProjects = projects.slice(startIndex, endIndex);
  
  // Atualizar paginação
  updatePagination(projects.length);
  
  for (const project of paginatedProjects) {
    const statusName =
      capitalizeFirst(project.status?.name || project.status?.description || "-");
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
    
    // Calcular mão de obra aplicada
    const laborCost = await calculateLaborCost(project);
    const laborCostFormatted = laborCost > 0
      ? `R$ ${Number(laborCost).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
        })}`
      : "-";
    
    const card = document.createElement("div");
    card.className = "project-card";
    card.innerHTML = `
      <div class="project-header">
        <h3>${project.name}</h3>
      </div>
      <div style="margin-bottom: 12px;">
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
        <img src="/assets/svg/person-icon.svg" alt="Mão de obra" style="vertical-align:middle; margin-right:4px; width:15px; height:15px;">
        <strong>Mão de obra aplicada: R$ </strong> ${laborCostFormatted}
      </p>
      <p>
        <img src="/assets/svg/calendar.svg" alt="Início" style="vertical-align:middle; margin-right:4px; width:15px; height:15px;">
        <strong data-i18n="projects.startedAt">${
          i18n?.t ? i18n.t("projects.startedAt") : "Início:"
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
    `;
    container.appendChild(card);
  }
}

function updatePagination(totalItems) {
  const paginationContainer = document.getElementById("pagination-container");
  if (!paginationContainer) return;
  
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Mostrar/ocultar paginação
  if (totalItems > itemsPerPage) {
    paginationContainer.style.display = "flex";
  } else {
    paginationContainer.style.display = "none";
  }

  // Atualizar texto de informação
  const paginationText = document.getElementById("pagination-text");
  const totalCount = document.getElementById("total-count");
  if (paginationText && totalCount) {
    totalCount.textContent = totalItems;
    paginationText.textContent = totalItems === 0 
      ? "Nenhum resultado encontrado" 
      : `Mostrando ${startItem}-${endItem} de ${totalItems} resultados`;
  }

  // Atualizar botões anterior/próximo
  const prevButton = document.getElementById("prev-page");
  const nextButton = document.getElementById("next-page");
  if (prevButton) {
    prevButton.disabled = currentPage === 1;
  }
  if (nextButton) {
    nextButton.disabled = currentPage >= totalPages || totalPages === 0;
  }

  // Renderizar números de página
  renderPaginationNumbers(totalPages);
}

function renderPaginationNumbers(totalPages) {
  const paginationNumbers = document.getElementById("pagination-numbers");
  if (!paginationNumbers) return;

  paginationNumbers.innerHTML = "";

  if (totalPages === 0) return;

  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  // Ajustar início se estiver próximo do final
  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  // Primeira página
  if (startPage > 1) {
    addPageNumber(1, paginationNumbers);
    if (startPage > 2) {
      addEllipsis(paginationNumbers);
    }
  }

  // Páginas visíveis
  for (let i = startPage; i <= endPage; i++) {
    addPageNumber(i, paginationNumbers);
  }

  // Última página
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      addEllipsis(paginationNumbers);
    }
    addPageNumber(totalPages, paginationNumbers);
  }
}

function addPageNumber(pageNum, container) {
  const numberButton = document.createElement("button");
  numberButton.className = `pagination-number ${pageNum === currentPage ? "active" : ""}`;
  numberButton.textContent = pageNum;
  numberButton.addEventListener("click", () => {
    currentPage = pageNum;
    renderProjects(projects);
    updatePagination(projects.length);
    // Scroll para o topo da lista
    document.getElementById("project-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  container.appendChild(numberButton);
}

function addEllipsis(container) {
  const ellipsis = document.createElement("span");
  ellipsis.className = "pagination-ellipsis";
  ellipsis.textContent = "...";
  container.appendChild(ellipsis);
}

// Inicialização dinâmica para garantir tradução e fetch
if (typeof window !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    fetchAndRenderProjects();
    if (window.i18n) window.i18n.apply();
    
    // Event listeners para filtros
    const nameFilter = document.getElementById("name-filter");
    const activeFilter = document.getElementById("active-filter");
    const statusFilter = document.getElementById("status-filter");
    const typeFilter = document.getElementById("type-filter");
    const areaFilter = document.getElementById("area-filter");
    const sortBy = document.getElementById("sort-by");
    const clearFiltersBtn = document.getElementById("clear-filters");
    const prevPageBtn = document.getElementById("prev-page");
    const nextPageBtn = document.getElementById("next-page");
    
    // Filtro por nome/descrição (com debounce)
    let nameFilterTimeout;
    if (nameFilter) {
      nameFilter.addEventListener("input", () => {
        clearTimeout(nameFilterTimeout);
        nameFilterTimeout = setTimeout(() => {
          applyFilters();
        }, 300); // Aguarda 300ms após parar de digitar
      });
    }
    
    // Filtro por área (com debounce)
    let areaFilterTimeout;
    if (areaFilter) {
      areaFilter.addEventListener("input", () => {
        clearTimeout(areaFilterTimeout);
        areaFilterTimeout = setTimeout(() => {
          applyFilters();
        }, 300);
      });
    }
    
    if (activeFilter) {
      activeFilter.addEventListener("change", applyFilters);
    }
    
    if (statusFilter) {
      statusFilter.addEventListener("change", applyFilters);
    }
    
    if (typeFilter) {
      typeFilter.addEventListener("change", applyFilters);
    }
    
    if (sortBy) {
      sortBy.addEventListener("change", applyFilters);
    }
    
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener("click", () => {
        if (nameFilter) nameFilter.value = "";
        if (activeFilter) activeFilter.value = "all";
        if (statusFilter) statusFilter.value = "";
        if (typeFilter) typeFilter.value = "";
        if (areaFilter) areaFilter.value = "";
        if (sortBy) sortBy.value = "name";
        applyFilters();
      });
    }
    
    // Event listeners para paginação
    if (prevPageBtn) {
      prevPageBtn.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage--;
          renderProjects(projects);
          updatePagination(projects.length);
          document.getElementById("project-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }
    
    if (nextPageBtn) {
      nextPageBtn.addEventListener("click", () => {
        const totalPages = Math.ceil(projects.length / itemsPerPage);
        if (currentPage < totalPages) {
          currentPage++;
          renderProjects(projects);
          updatePagination(projects.length);
          document.getElementById("project-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }
  });
}

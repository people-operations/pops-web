import { apiService } from "../../../assets/js/apiService.js";

document.addEventListener("DOMContentLoaded", async () => {
  const searchInput = document.querySelector(".search-bar input");
  const searchButton = document.querySelector(".search-bar button");
  const clearSearchButton = document.querySelector(
    ".search-bar button.outline"
  );
  const applyFiltersButton = document.querySelector(".filters button");
  const clearFiltersButton = document.querySelector(".filters button.outline");
  const generateReportButton = document.querySelector(".actions button");
  const overviewTitle = document.querySelector(".table-container h3");

  const areaSelect = document.querySelector(".filters select:nth-of-type(1)");
  const cargoSelect = document.querySelector(".filters select:nth-of-type(2)");
  const projetoSelect = document.querySelector(
    ".filters select:nth-of-type(3)"
  );
  const squadSelect = document.querySelector(".filters select:nth-of-type(4)");

  let allEmployees = [];
  let currentEmployees = [];
  let currentPage = 1;
  const itemsPerPage = 10;
  const percentagesCache = new Map(); // Cache para evitar recarregar dados

  async function fetchCollaborators(filters = {}) {
    showSkeleton();
    try {
      const employees = await apiService.getCollaborators(filters);
      if (!allEmployees.length) allEmployees = employees;
      
      // Inicializar colaboradores com porcentagens padrão (serão carregadas depois)
      const employeesWithDefaults = employees.map((emp) => {
        // Verificar se já está no cache
        const cached = percentagesCache.get(emp.id);
        const weeklyHours = emp.workHoursPerWeek || 40;
        return {
          ...emp,
          allocatedPercent: cached?.allocatedPercent || 0,
          availablePercent: cached?.availablePercent || 100,
          overloadPercent: cached?.overloadPercent || 0,
          idlePercent: cached?.idlePercent || 100,
          totalAllocatedHours: cached?.totalAllocatedHours || 0,
          availableHours: cached?.availableHours ?? weeklyHours,
          weeklyHours: weeklyHours,
          _percentagesLoaded: !!cached,
        };
      });
      
      currentEmployees = employeesWithDefaults;
      currentPage = 1; // Reset para primeira página ao carregar novos dados
      populateFilters();
      renderTable(employeesWithDefaults);
      updatePagination(employeesWithDefaults.length);
      
      // Carregar porcentagens de forma assíncrona apenas para os que não estão em cache
      setTimeout(() => loadPercentagesAsync(employeesWithDefaults), 200);
    } catch (error) {
      console.error("Erro ao carregar colaboradores:", error);
    }
  }

  async function loadPercentagesAsync(employees) {
    // Carregar porcentagens apenas para a página atual
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedEmployees = employees.slice(startIndex, endIndex);
    
    // Filtrar apenas os que ainda não têm porcentagens carregadas ou não estão no cache
    const employeesToLoad = paginatedEmployees.filter(emp => {
      return !emp._percentagesLoaded && !percentagesCache.has(emp.id);
    });
    
    if (employeesToLoad.length === 0) return;
    
    // Carregar porcentagens em paralelo apenas para os itens que precisam
    const percentagePromises = employeesToLoad.map(async (emp) => {
      // Verificar cache primeiro
      if (percentagesCache.has(emp.id)) {
        Object.assign(emp, percentagesCache.get(emp.id));
        emp._percentagesLoaded = true;
        return emp;
      }
      
      const percentages = await calculatePercentages(emp);
      // Armazenar no cache
      percentagesCache.set(emp.id, percentages);
      // Atualizar o objeto original
      Object.assign(emp, percentages);
      emp._percentagesLoaded = true;
      return emp;
    });
    
    await Promise.all(percentagePromises);
    
    // Re-renderizar a tabela completa
    renderTable(currentEmployees);
    updatePagination(currentEmployees.length);
  }

  async function calculatePercentages(employee) {
    try {
      const weeklyHours = employee.workHoursPerWeek || 40;
      let totalAllocatedHours = 0;

      // Buscar alocações do colaborador
      try {
        const allocations = await apiService.getSquadsByCollaboratorId(employee.id);
        if (allocations && Array.isArray(allocations) && allocations.length > 0) {
          totalAllocatedHours = allocations.reduce((sum, allocation) => {
            return sum + (allocation.allocatedHours || 0);
          }, 0);
        }
      } catch (allocationError) {
        // Se não conseguir buscar alocações, assume 0
        console.warn(`Não foi possível buscar alocações para ${employee.id}:`, allocationError);
      }

      // Calcular porcentagens
      const allocatedPercent = weeklyHours > 0 
        ? Math.round((totalAllocatedHours / weeklyHours) * 100)
        : 0;
      
      const availablePercent = Math.max(0, 100 - allocatedPercent);
      const overloadPercent = allocatedPercent > 100 ? allocatedPercent - 100 : 0;
      const idlePercent = allocatedPercent < 100 ? 100 - allocatedPercent : 0;

      // Calcular horas disponíveis (livres)
      const availableHours = Math.max(0, weeklyHours - totalAllocatedHours);

      return {
        allocatedPercent,
        availablePercent,
        overloadPercent,
        idlePercent,
        totalAllocatedHours,
        availableHours,
        weeklyHours,
      };
    } catch (error) {
      console.error(`Erro ao calcular porcentagens para ${employee.id}:`, error);
      return {
        allocatedPercent: 0,
        availablePercent: 100,
        overloadPercent: 0,
        idlePercent: 100,
        totalAllocatedHours: 0,
        availableHours: employee.workHoursPerWeek || 40,
        weeklyHours: employee.workHoursPerWeek || 40,
      };
    }
  }

  function showSkeleton() {
    const tbody = document.querySelector(".collaborators-table tbody");
    tbody.innerHTML = "";
    for (let i = 0; i < 3; i++) {
      const row = document.createElement("tr");
      row.className = "skeleton-row";
      row.innerHTML = `
        <td><span class='skeleton-cell' style='width: 80px'></span></td>
        <td><span class='skeleton-cell' style='width: 60px'></span></td>
        <td><span class='skeleton-cell' style='width: 100px'></span></td>
        <td><span class='skeleton-cell' style='width: 50px'></span></td>
        <td><span class='skeleton-cell' style='width: 50px'></span></td>
        <td><span class='skeleton-cell' style='width: 50px'></span></td>
        <td><span class='skeleton-cell' style='width: 50px'></span></td>
        <td><span class='skeleton-cell' style='width: 60px'></span></td>
      `;
      tbody.appendChild(row);
    }
    overviewTitle.textContent = "Carregando colaboradores...";
  }

  function populateFilters() {
    const areas = [
      ...new Set(
        allEmployees.map((emp) => emp.departament?.name).filter((a) => a)
      ),
    ];
    areaSelect.innerHTML =
      `<option>Todas as áreas</option>` +
      areas.map((a) => `<option>${a}</option>`).join("");
    const cargos = [
      ...new Set(allEmployees.map((emp) => emp.jobTitle).filter((j) => j)),
    ];
    cargoSelect.innerHTML =
      `<option>Todos os cargos</option>` +
      cargos.map((c) => `<option>${c}</option>`).join("");
  }

  function getMockSquads(employeeId) {
    const squadsMock = {
      1423: ["Squad A", "Squad B"],
      1235: ["Squad C"],
      1288: ["Squad D", "Squad E"],
      1258: ["Squad F"],
      1197: ["Squad G"],
    };
    return squadsMock[employeeId] || ["—"];
  }

  function renderTable(employees) {
    const tbody = document.querySelector(".collaborators-table tbody");
    tbody.innerHTML = "";

    // Calcular índices para paginação
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedEmployees = employees.slice(startIndex, endIndex);

    overviewTitle.textContent = `Visão Geral de Pessoas (${employees.length} resultados)`;

    paginatedEmployees.forEach((emp) => {
      const squads = getMockSquads(emp.id);
      const row = document.createElement("tr");
      row.classList.add("collaborator-row");
      const totalAllocatedHours = emp.totalAllocatedHours || 0;
      const availableHours = emp.availableHours ?? (emp.weeklyHours || 40);
      const overloadPercent = emp.overloadPercent || 0;
      const idlePercent = emp.idlePercent || 100;
      const allocatedPercent = emp.allocatedPercent || 0;

      row.innerHTML = `
        <td>${emp.name || "—"}</td>
        <td>${emp.jobTitle || "—"}</td>
        <td>
          <div class="avatars-group">
            ${squads
              .map((s) => `<div class="avatar-sm">${s[0]}</div>`)
              .join("")}
          </div>
        </td>
        <td>
          <span class="percentage-badge ${allocatedPercent > 100 ? 'overload' : ''}">
            ${totalAllocatedHours}h
          </span>
        </td>
        <td>
          <span class="percentage-badge">
            ${availableHours}h
          </span>
        </td>
        <td>
          <span class="status-badge ${
            emp.activeEmployee ? "active" : "inactive"
          }">
            ${emp.activeEmployee ? "Ativo" : "Inativo"}
          </span>
        </td>
      `;

      row.addEventListener("click", (e) => {
        if (e.target.tagName === "BUTTON") return;
        window.location.href = `collaborators-detail/collaborators-detail.html?id=${emp.id}`;
      });

      tbody.appendChild(row);
    });
  }

  function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

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
      renderTable(currentEmployees);
      updatePagination(currentEmployees.length);
      // Scroll para o topo da tabela
      document.querySelector(".table-container")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    container.appendChild(numberButton);
  }

  function addEllipsis(container) {
    const ellipsis = document.createElement("span");
    ellipsis.className = "pagination-ellipsis";
    ellipsis.textContent = "...";
    container.appendChild(ellipsis);
  }

  searchButton.addEventListener("click", () => {
    const searchQuery = searchInput.value.trim();
    currentPage = 1; // Reset para primeira página
    if (!searchQuery) return;
    fetchCollaborators({ employeeName: searchQuery });
  });

  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const searchQuery = searchInput.value.trim();
      currentPage = 1; // Reset para primeira página
      if (!searchQuery) return;
      fetchCollaborators({ employeeName: searchQuery });
    }
  });

  clearSearchButton.addEventListener("click", () => {
    searchInput.value = "";
    currentPage = 1; // Reset para primeira página
    fetchCollaborators();
  });

  applyFiltersButton.addEventListener("click", () => {
    const filters = {
      departament:
        areaSelect.value !== "Todas as áreas" ? areaSelect.value : undefined,
      jobTitle:
        cargoSelect.value !== "Todos os cargos" ? cargoSelect.value : undefined,
      project:
        projetoSelect.value !== "Todos os projetos"
          ? projetoSelect.value
          : undefined,
      squad:
        squadSelect.value !== "Todas os squads" ? squadSelect.value : undefined,
    };
    currentPage = 1; // Reset para primeira página
    fetchCollaborators(filters);
  });

  clearFiltersButton.addEventListener("click", () => {
    areaSelect.value = "Todas as áreas";
    cargoSelect.value = "Todos os cargos";
    projetoSelect.value = "Todos os projetos";
    squadSelect.value = "Todas os squads";
    currentPage = 1; // Reset para primeira página
    fetchCollaborators();
  });

  // Event listeners para paginação
  const prevPageButton = document.getElementById("prev-page");
  const nextPageButton = document.getElementById("next-page");

  if (prevPageButton) {
    prevPageButton.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderTable(currentEmployees);
        updatePagination(currentEmployees.length);
        setTimeout(() => loadPercentagesAsync(currentEmployees), 100);
        document.querySelector(".table-container")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  if (nextPageButton) {
    nextPageButton.addEventListener("click", () => {
      const totalPages = Math.ceil(currentEmployees.length / itemsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        renderTable(currentEmployees);
        updatePagination(currentEmployees.length);
        setTimeout(() => loadPercentagesAsync(currentEmployees), 100);
        document.querySelector(".table-container")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  generateReportButton.addEventListener("click", () => {
    if (!currentEmployees.length) return;

    const headers = [
      "Nome",
      "Cargo",
      "Squads",
      "% Alocadas",
      "% Disponíveis",
      "Status",
    ];
    const rows = currentEmployees.map((emp) => {
      const squads = getMockSquads(emp.id).join(", ");
      return [
        emp.name || "",
        emp.jobTitle || "",
        squads,
        emp.allocatedPercent || "0",
        emp.availablePercent || "100",
        emp.activeEmployee ? "Ativo" : "Inativo",
      ]
        .map((field) => `"${field}"`)
        .join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "colaboradores.csv");
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // Função para simular valores de sobrecarga (disponível no console)
  window.simulateOverload = function(employeeNameOrId, overloadPercent, allocatedHours = null) {
    const employee = currentEmployees.find(emp => 
      emp.name === employeeNameOrId || emp.id === employeeNameOrId || emp.id.toString() === employeeNameOrId.toString()
    );
    
    if (!employee) {
      console.error('Colaborador não encontrado. Colaboradores disponíveis:', 
        currentEmployees.map(e => ({ id: e.id, name: e.name }))
      );
      return;
    }
    
    const weeklyHours = employee.weeklyHours || employee.workHoursPerWeek || 40;
    
    // Se allocatedHours for fornecido, usar esse valor
    // Caso contrário, calcular baseado na sobrecarga
    let totalAllocatedHours;
    if (allocatedHours !== null) {
      totalAllocatedHours = allocatedHours;
    } else {
      // Calcular horas alocadas para gerar a sobrecarga desejada
      // overloadPercent = (allocatedHours / weeklyHours - 1) * 100
      // allocatedHours = weeklyHours * (1 + overloadPercent / 100)
      totalAllocatedHours = weeklyHours * (1 + overloadPercent / 100);
    }
    
    const allocatedPercent = Math.round((totalAllocatedHours / weeklyHours) * 100);
    const availablePercent = Math.max(0, 100 - allocatedPercent);
    const calculatedOverloadPercent = allocatedPercent > 100 ? allocatedPercent - 100 : 0;
    const idlePercent = allocatedPercent < 100 ? 100 - allocatedPercent : 0;
    const availableHours = Math.max(0, weeklyHours - totalAllocatedHours);
    
    // Atualizar o objeto do colaborador
    employee.allocatedPercent = allocatedPercent;
    employee.availablePercent = availablePercent;
    employee.overloadPercent = calculatedOverloadPercent;
    employee.idlePercent = idlePercent;
    employee.totalAllocatedHours = totalAllocatedHours;
    employee.availableHours = availableHours;
    
    // Atualizar o cache
    percentagesCache.set(employee.id, {
      allocatedPercent,
      availablePercent,
      overloadPercent: calculatedOverloadPercent,
      idlePercent,
      totalAllocatedHours,
      availableHours,
      weeklyHours
    });
    
    // Re-renderizar a tabela
    renderTable(currentEmployees);
    updatePagination(currentEmployees.length);
    
    console.log(`✅ Sobrecarga simulada para ${employee.name}:`, {
      'Horas Alocadas': `${totalAllocatedHours.toFixed(1)}h`,
      '% Alocadas': `${allocatedPercent}%`,
      '% Sobrecarga': `${calculatedOverloadPercent}%`,
      '% Ociosidade': `${idlePercent}%`,
      'Horas Disponíveis': `${availableHours.toFixed(1)}h`
    });
    
    return employee;
  };
  
  // Função para simular sobrecarga em múltiplos colaboradores
  window.simulateMultipleOverloads = function(overloads) {
    // overloads = [{ name: 'João', overloadPercent: 50 }, ...]
    overloads.forEach(({ name, id, overloadPercent, allocatedHours }) => {
      window.simulateOverload(name || id, overloadPercent, allocatedHours);
    });
  };
  
  // Exemplo de uso no console:
  console.log('%c📊 Funções de Simulação de Sobrecarga Disponíveis:', 'color: #7d1bff; font-weight: bold; font-size: 14px;');
  console.log('%c1. simulateOverload("Nome do Colaborador", 50)', 'color: #666; font-size: 12px;', 
    '\n   → Simula 50% de sobrecarga para um colaborador específico');
  console.log('%c2. simulateOverload("Nome do Colaborador", 0, 60)', 'color: #666; font-size: 12px;', 
    '\n   → Simula 60 horas alocadas diretamente (calcula sobrecarga automaticamente)');
  console.log('%c3. simulateMultipleOverloads([{name: "João", overloadPercent: 50}, {name: "Maria", overloadPercent: 30}])', 
    'color: #666; font-size: 12px;', '\n   → Simula sobrecarga para múltiplos colaboradores de uma vez');
  console.log('%c💡 Dica: Você também pode usar o ID do colaborador em vez do nome!', 'color: #ff6b35; font-size: 11px;');

  fetchCollaborators();
});

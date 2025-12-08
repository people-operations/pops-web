import { apiService } from "../../../assets/js/apiService.js";
import { requireAuth, requireAccess } from "../../../assets/js/permissions.js";

document.addEventListener("DOMContentLoaded", async () => {
  // Verificar autenticação
  if (!requireAuth()) {
    return; // Redireciona para login
  }
  
  // Verificar acesso - apenas access_level 1 ou 2 (managers)
  if (!requireAccess([1, 2], "../../dashboard/dashboard.html")) {
    return; // Redireciona para dashboard com mensagem de erro
  }
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
  const allocationsCache = new Map(); // Cache para alocações de colaboradores
  const loadingPercentages = new Set(); // Prevenir múltiplas execuções simultâneas
  const loadingAllocations = new Set(); // Prevenir múltiplas requisições simultâneas para alocações
  let isLoadingPercentages = false; // Flag para prevenir múltiplas execuções

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
        const monthlyHours = weeklyHours * 4; // 40h/semana × 4 = 160h/mês
        return {
          ...emp,
          allocatedPercent: cached?.allocatedPercent || 0,
          availablePercent: cached?.availablePercent || 100,
          overloadPercent: cached?.overloadPercent || 0,
          idlePercent: cached?.idlePercent || 100,
          totalAllocatedHours: cached?.totalAllocatedHours || 0,
          availableHours: cached?.availableHours ?? monthlyHours,
          weeklyHours: weeklyHours,
          monthlyHours: monthlyHours,
          _percentagesLoaded: !!cached,
        };
      });
      
      currentEmployees = employeesWithDefaults;
      currentPage = 1; // Reset para primeira página ao carregar novos dados
      populateFilters();
      
      // Aplicar valores do cache imediatamente antes de renderizar
      currentEmployees.forEach((emp) => {
        if (percentagesCache.has(emp.id)) {
          const cached = percentagesCache.get(emp.id);
          // Marcar como carregado ANTES de atribuir os valores
          emp._percentagesLoaded = true;
          Object.assign(emp, cached);
        }
      });
      
      renderTable(currentEmployees);
      updatePagination(currentEmployees.length);
      
      // Carregar porcentagens de forma assíncrona apenas para os que não estão em cache
      loadPercentagesAsync();
    } catch (error) {
      console.error("Erro ao carregar colaboradores:", error);
    }
  }

  async function loadPercentagesAsync() {
    // Prevenir múltiplas execuções simultâneas
    if (isLoadingPercentages) {
      console.warn("⚠️ loadPercentagesAsync já está em execução, ignorando chamada duplicada");
      return;
    }
    
    isLoadingPercentages = true;
    
    try {
      // SEMPRE usar currentEmployees para garantir consistência
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedEmployees = currentEmployees.slice(startIndex, endIndex);
      
      // Primeiro, aplicar valores do cache se existirem e atualizar currentEmployees
      let hasCachedData = false;
      paginatedEmployees.forEach(emp => {
        if (percentagesCache.has(emp.id)) {
          const cached = percentagesCache.get(emp.id);
          // Marcar como carregado ANTES de atribuir os valores
          emp._percentagesLoaded = true;
          Object.assign(emp, cached);
          hasCachedData = true;
        }
      });
      
      // Re-renderizar imediatamente se houver dados em cache
      if (hasCachedData) {
        renderTable(currentEmployees);
      }
      
      // Filtrar apenas os que ainda não têm porcentagens carregadas ou não estão no cache
      const employeesToLoad = paginatedEmployees.filter(emp => {
        return !emp._percentagesLoaded && !percentagesCache.has(emp.id) && !loadingPercentages.has(emp.id);
      });
      
      if (employeesToLoad.length === 0) {
        return;
      }
      
      // Marcar como carregando
      employeesToLoad.forEach(emp => loadingPercentages.add(emp.id));
      
      // Carregar porcentagens em paralelo apenas para os itens que precisam
      const percentagePromises = employeesToLoad.map(async (emp) => {
        try {
          // Verificar cache novamente (pode ter sido adicionado enquanto aguardava)
          if (percentagesCache.has(emp.id)) {
            const cached = percentagesCache.get(emp.id);
            // Encontrar o objeto correto em currentEmployees
            const empInCurrent = currentEmployees.find(e => e.id === emp.id);
            if (empInCurrent) {
              // Marcar como carregado ANTES de atribuir os valores
              empInCurrent._percentagesLoaded = true;
              Object.assign(empInCurrent, cached);
            }
            return emp;
          }
          
          const percentages = await calculatePercentages(emp);
          // Armazenar no cache
          percentagesCache.set(emp.id, percentages);
          
          // Atualizar o objeto em currentEmployees (sempre usar o objeto real)
          const empInCurrent = currentEmployees.find(e => e.id === emp.id);
          if (empInCurrent) {
            // Marcar como carregado ANTES de atribuir os valores
            empInCurrent._percentagesLoaded = true;
            Object.assign(empInCurrent, percentages);
          }
          
          return emp;
        } catch (error) {
          console.error(`Erro ao calcular porcentagens para ${emp.id}:`, error);
          return emp;
        } finally {
          loadingPercentages.delete(emp.id);
        }
      });
      
      await Promise.all(percentagePromises);
      
      // Re-renderizar a tabela completa após carregar
      renderTable(currentEmployees);
      updatePagination(currentEmployees.length);
    } finally {
      isLoadingPercentages = false;
    }
  }

  async function getSquadsByCollaboratorIdWithCache(employeeId) {
    // Verificar cache primeiro
    if (allocationsCache.has(employeeId)) {
      return allocationsCache.get(employeeId);
    }
    
    // Se já está sendo carregado, aguardar
    if (loadingAllocations.has(employeeId)) {
      let attempts = 0;
      while (loadingAllocations.has(employeeId) && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        if (allocationsCache.has(employeeId)) {
          return allocationsCache.get(employeeId);
        }
      }
      return [];
    }
    
    loadingAllocations.add(employeeId);
    try {
      const allocations = await apiService.getSquadsByCollaboratorId(employeeId);
      if (allocations && Array.isArray(allocations)) {
        allocationsCache.set(employeeId, allocations);
      }
      return allocations || [];
    } catch (error) {
      console.error(`Erro ao buscar alocações para ${employeeId}:`, error);
      return [];
    } finally {
      loadingAllocations.delete(employeeId);
    }
  }

  async function calculatePercentages(employee) {
    try {
      const weeklyHours = employee.workHoursPerWeek || 40;
      // Calcular horas mensais: 40h/semana × 4 semanas = 160h/mês
      const monthlyHours = weeklyHours * 4;
      let totalAllocatedHours = 0;

      // Buscar alocações do colaborador (usando cache)
      try {
        const allocations = await getSquadsByCollaboratorIdWithCache(employee.id);
        if (allocations && Array.isArray(allocations) && allocations.length > 0) {
          // Soma horas mensais alocadas: calcula a partir de horas semanais (horas semanais × 4)
          totalAllocatedHours = allocations.reduce((sum, allocation) => {
            const weeklyHours = allocation.allocatedHours || 0;
            // Converte horas semanais para mensais (× 4 semanas)
            const monthlyHours = weeklyHours * 4;
            return sum + monthlyHours;
          }, 0);
        }
      } catch (allocationError) {
        // Se não conseguir buscar alocações, assume 0
        console.warn(`Não foi possível buscar alocações para ${employee.id}:`, allocationError);
      }

      // Calcular porcentagens baseado em horas mensais (160h/mês)
      const allocatedPercent = monthlyHours > 0 
        ? Math.round((totalAllocatedHours / monthlyHours) * 100)
        : 0;
      
      const availablePercent = Math.max(0, 100 - allocatedPercent);
      const overloadPercent = allocatedPercent > 100 ? allocatedPercent - 100 : 0;
      const idlePercent = allocatedPercent < 100 ? 100 - allocatedPercent : 0;

      // Calcular horas disponíveis (livres) - baseado em horas mensais
      const availableHours = Math.max(0, monthlyHours - totalAllocatedHours);

      return {
        allocatedPercent,
        availablePercent,
        overloadPercent,
        idlePercent,
        totalAllocatedHours,
        availableHours,
        weeklyHours,
        monthlyHours, // Adicionar horas mensais ao retorno
      };
    } catch (error) {
      console.error(`Erro ao calcular porcentagens para ${employee.id}:`, error);
      const weeklyHours = employee.workHoursPerWeek || 40;
      const monthlyHours = weeklyHours * 4;
      return {
        allocatedPercent: 0,
        availablePercent: 100,
        overloadPercent: 0,
        idlePercent: 100,
        totalAllocatedHours: 0,
        availableHours: monthlyHours,
        weeklyHours: weeklyHours,
        monthlyHours: monthlyHours,
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
      
      // Só usar valores se estiverem 100% prontos (_percentagesLoaded === true)
      const isReady = emp._percentagesLoaded === true;
      
      let totalAllocatedHours, availableHours, allocatedPercent, overloadPercent, idlePercent;
      
      if (isReady) {
        // Valores estão prontos, usar os valores calculados
        totalAllocatedHours = emp.totalAllocatedHours ?? 0;
        const weeklyHours = emp.weeklyHours || emp.workHoursPerWeek || 40;
        const monthlyHours = emp.monthlyHours || (weeklyHours * 4);
        availableHours = emp.availableHours ?? monthlyHours;
        allocatedPercent = emp.allocatedPercent ?? 0;
        overloadPercent = emp.overloadPercent ?? 0;
        idlePercent = emp.idlePercent ?? 100;
      } else {
        // Valores não estão prontos, usar placeholders
        totalAllocatedHours = null;
        availableHours = null;
        allocatedPercent = 0;
        overloadPercent = 0;
        idlePercent = 100;
      }

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
          ${isReady ? `
            <span class="percentage-badge ${allocatedPercent > 100 ? 'overload' : ''}">
              ${totalAllocatedHours}h
            </span>
          ` : `
            <span class="percentage-badge" style="opacity: 0.5;">
              —
            </span>
          `}
        </td>
        <td>
          ${isReady ? `
            <span class="percentage-badge">
              ${availableHours}h
            </span>
          ` : `
            <span class="percentage-badge" style="opacity: 0.5;">
              —
            </span>
          `}
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
      // Aplicar valores do cache antes de renderizar
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedEmployees = currentEmployees.slice(startIndex, endIndex);
      paginatedEmployees.forEach(emp => {
        if (percentagesCache.has(emp.id)) {
          const cached = percentagesCache.get(emp.id);
          // Marcar como carregado ANTES de atribuir os valores
          emp._percentagesLoaded = true;
          Object.assign(emp, cached);
        }
      });
      renderTable(currentEmployees);
      updatePagination(currentEmployees.length);
      // Carregar porcentagens para a nova página
      loadPercentagesAsync();
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
        // Aplicar valores do cache antes de renderizar
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedEmployees = currentEmployees.slice(startIndex, endIndex);
        paginatedEmployees.forEach(emp => {
          if (percentagesCache.has(emp.id)) {
            const cached = percentagesCache.get(emp.id);
            Object.assign(emp, cached);
            emp._percentagesLoaded = true;
          }
        });
        renderTable(currentEmployees);
        updatePagination(currentEmployees.length);
        loadPercentagesAsync();
        document.querySelector(".table-container")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  if (nextPageButton) {
    nextPageButton.addEventListener("click", () => {
      const totalPages = Math.ceil(currentEmployees.length / itemsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        // Aplicar valores do cache antes de renderizar
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedEmployees = currentEmployees.slice(startIndex, endIndex);
        paginatedEmployees.forEach(emp => {
          if (percentagesCache.has(emp.id)) {
            const cached = percentagesCache.get(emp.id);
            Object.assign(emp, cached);
            emp._percentagesLoaded = true;
          }
        });
        renderTable(currentEmployees);
        updatePagination(currentEmployees.length);
        loadPercentagesAsync();
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
    const monthlyHours = weeklyHours * 4; // 40h/semana × 4 = 160h/mês
    
    // Se allocatedHours for fornecido, usar esse valor
    // Caso contrário, calcular baseado na sobrecarga
    let totalAllocatedHours;
    if (allocatedHours !== null) {
      totalAllocatedHours = allocatedHours;
    } else {
      // Calcular horas alocadas para gerar a sobrecarga desejada
      // overloadPercent = (allocatedHours / monthlyHours - 1) * 100
      // allocatedHours = monthlyHours * (1 + overloadPercent / 100)
      totalAllocatedHours = monthlyHours * (1 + overloadPercent / 100);
    }
    
    // Calcular porcentagens baseado em horas mensais (160h/mês)
    const allocatedPercent = Math.round((totalAllocatedHours / monthlyHours) * 100);
    const availablePercent = Math.max(0, 100 - allocatedPercent);
    const calculatedOverloadPercent = allocatedPercent > 100 ? allocatedPercent - 100 : 0;
    const idlePercent = allocatedPercent < 100 ? 100 - allocatedPercent : 0;
    const availableHours = Math.max(0, monthlyHours - totalAllocatedHours);
    
    // Atualizar o objeto do colaborador
    employee.allocatedPercent = allocatedPercent;
    employee.availablePercent = availablePercent;
    employee.overloadPercent = calculatedOverloadPercent;
    employee.idlePercent = idlePercent;
    employee.totalAllocatedHours = totalAllocatedHours;
    employee.availableHours = availableHours;
    employee.monthlyHours = monthlyHours;
    
    // Atualizar o cache
    percentagesCache.set(employee.id, {
      allocatedPercent,
      availablePercent,
      overloadPercent: calculatedOverloadPercent,
      idlePercent,
      totalAllocatedHours,
      availableHours,
      weeklyHours,
      monthlyHours
    });
    
    // Aplicar valores do cache antes de renderizar
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedEmployees = currentEmployees.slice(startIndex, endIndex);
    paginatedEmployees.forEach(emp => {
      if (percentagesCache.has(emp.id)) {
        const cached = percentagesCache.get(emp.id);
        Object.assign(emp, cached);
        emp._percentagesLoaded = true;
      }
    });
    
    // Re-renderizar a tabela
    renderTable(currentEmployees);
    updatePagination(currentEmployees.length);
    
    // Carregar porcentagens se necessário
    loadPercentagesAsync();
    
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

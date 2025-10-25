document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("idToken");
  if (!token) {
    console.warn("Usuário não autenticado! Redirecionando para login...");
    window.location.href = "../../../auth/login.html";
    return;
  }

  const searchInput = document.querySelector(".search-bar input");
  const searchButton = document.querySelector(".search-bar button");
  const applyFiltersButton = document.querySelector(".filters button");
  const overviewTitle = document.querySelector('.table-container h3'); // Título "Visão Geral"

  // Função para buscar colaboradores
  async function fetchCollaborators(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.jobTitle) params.append("jobTitle", filters.jobTitle);
      if (filters.workHoursPerWeek) params.append("workHoursPerWeek", filters.workHoursPerWeek);
      if (filters.skillName) params.append("skillName", filters.skillName);

      const response = await fetch(`http://localhost:8081/api/employees?${params.toString()}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

      const employees = await response.json();
      renderTable(employees);
      updateOverviewCount(employees.length); // Atualiza o contador
    } catch (error) {
      console.error("Erro ao carregar colaboradores:", error);
    }
  }

  // Mock de squads
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

  // Atualiza o número de colaboradores no título
  function updateOverviewCount(count) {
    overviewTitle.textContent = `Visão Geral de Pessoas (${count} resultados)`;
  }

  // Renderiza tabela
  function renderTable(employees) {
    const tbody = document.querySelector('.collaborators-table tbody');
    tbody.innerHTML = ''; // Limpa tabela

    employees.forEach(emp => {
      const row = document.createElement('tr');
      row.classList.add('collaborator-row');

      const squads = getMockSquads(emp.id);

      row.innerHTML = `
        <td>${emp.name || "—"}</td>
        <td>${emp.jobTitle || "—"}</td>
        <td>
          <div class="avatars-group">
            ${squads.map(s => `<div class="avatar-sm">${s[0]}</div>`).join('')}
          </div>
        </td>
        <td>0%</td>
        <td>100%</td>
        <td>
          <span class="status-badge ${emp.activeEmployee ? 'active' : 'inactive'}">
            ${emp.activeEmployee ? 'Ativo' : 'Inativo'}
          </span>
        </td>
      `;

      row.addEventListener('click', e => {
        if (e.target.tagName === 'BUTTON') return;
        window.location.href = `collaborators-detail/collaborators-detail.html?id=${emp.id}`;
      });

      tbody.appendChild(row);
    });
  }

  // Botão de busca
  searchButton.addEventListener("click", () => {
    const query = searchInput.value.trim();
    fetchCollaborators({ skillName: query, jobTitle: query });
  });

  // Botão de aplicar filtros
  applyFiltersButton.addEventListener("click", () => {
    const filters = {
      // Exemplo: jobTitle: document.querySelector('select').value
    };
    fetchCollaborators(filters);
  });

  // Carrega tabela inicial sem filtros
  fetchCollaborators();
});

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

  async function fetchCollaborators(filters = {}) {
    showSkeleton();
    try {
      const employees = await apiService.getCollaborators(filters);
      if (!allEmployees.length) allEmployees = employees;
      currentEmployees = employees;
      populateFilters();
      renderTable(employees);
      overviewTitle.textContent = `Visão Geral de Pessoas (${employees.length} resultados)`;
    } catch (error) {
      console.error("Erro ao carregar colaboradores:", error);
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

    employees.forEach((emp) => {
      const squads = getMockSquads(emp.id);
      const row = document.createElement("tr");
      row.classList.add("collaborator-row");
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

  searchButton.addEventListener("click", () => {
    const searchQuery = searchInput.value.trim();
    if (!searchQuery) return;
    fetchCollaborators({ employeeName: searchQuery });
  });

  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const searchQuery = searchInput.value.trim();
      if (!searchQuery) return;
      fetchCollaborators({ employeeName: searchQuery });
    }
  });

  clearSearchButton.addEventListener("click", () => {
    searchInput.value = "";
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
    fetchCollaborators(filters);
  });

  clearFiltersButton.addEventListener("click", () => {
    areaSelect.value = "Todas as áreas";
    cargoSelect.value = "Todos os cargos";
    projetoSelect.value = "Todos os projetos";
    squadSelect.value = "Todas os squads";
    fetchCollaborators();
  });

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

  fetchCollaborators();
});

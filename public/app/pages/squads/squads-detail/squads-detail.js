import { apiService } from "../../../../assets/js/apiService.js";

document.addEventListener("DOMContentLoaded", function () {
  // Seletores dos botões do modal (fixos)
  const modal = document.getElementById("delete-modal");
  const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
  const cancelDeleteBtn = document.getElementById("cancel-delete-btn");

  // Função para adicionar listeners nos botões de editar e excluir após renderização dinâmica
  function bindSummaryActionButtons() {
    const editBtn = document.querySelector(
      '.summary-actions .action-icon[alt="Editar"]'
    );
    const trashBtn = document.querySelector(
      '.summary-actions .action-icon[alt="Remover"]'
    );
    if (editBtn) {
      editBtn.addEventListener("click", function () {
        const squadId = getSquadIdFromUrl();
        if (squadId) {
          window.location.href = `../squads-form/squads-form.html?id=${squadId}`;
        } else {
          window.location.href = "../squads-form/squads-form.html";
        }
      });
    }
    if (trashBtn) {
      trashBtn.addEventListener("click", function (e) {
        e.preventDefault();
        showDeleteModal();
      });
    }
  }

  // Função utilitária para pegar o ID da squad da query string
  function getSquadIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
  }

  // Função para mostrar skeleton enquanto carrega
  function showSkeletonDetail() {
    // Summary skeleton
    const summary = document.querySelector(".summary");
    if (summary) {
      summary.innerHTML = `
        <div class="summary-header">
          <span class="skeleton-box" style="width:70px;height:23px;margin:0 auto 16px auto;"></span>
        </div>
        <div class="d-flex text-center flex-column">
          <div class="skeleton-box" style="width:80%;height:22px;margin:0 auto 8px auto;"></div>
          <div class="skeleton-box" style="width:60%;height:18px;margin:0 auto 8px auto;"></div>
        </div>
        <div class="skeleton-box" style="width:90%;height:16px;"></div>
        <div class="skills d-flex flex-column">
          <div class="skeleton-box" style="width:60%;height:18px;"></div>
          <div class="skeleton-box" style="width:40%;height:18px;"></div>
        </div>
        <div class="skeleton-box" style="width:60%;height:18px;"></div>
        <div class="data-block">
          <div class="skeleton-box" style="width:100%;height:18px;"></div>
          <div class="skeleton-box" style="width:100%;height:18px;"></div>
        </div>
        <div class="skeleton-box" style="width:60%;height:18px;"></div>
        <div class="data-block">
          <div class="skeleton-box" style="width:100%;height:18px;"></div>
          <div class="skeleton-box" style="width:100%;height:18px;"></div>
        </div>
      `;
    }
    // Skeleton para cards de estatísticas
    const stats = document.querySelectorAll(".stats-container .card");
    if (stats && stats.length) {
      stats.forEach((card) => {
        card.innerHTML = `
          <div class="skeleton-box" style="width:60%;height:22px;margin:0 auto 12px auto;"></div>
          <div class="skeleton-box" style="width:80%;height:28px;margin:0 auto 8px auto;"></div>
          <div class="skeleton-box" style="width:50%;height:16px;margin:0 auto 0 auto;"></div>
        `;
      });
    }
    // Skeleton para cards de finanças
    const finances = document.querySelectorAll(".financial-overview .card");
    if (finances && finances.length) {
      finances.forEach((card) => {
        card.innerHTML = `
          <div class="skeleton-box" style="width:60%;height:22px;margin:0 auto 12px auto;"></div>
          <div class="skeleton-box" style="width:80%;height:28px;margin:0 auto 8px auto;"></div>
          <div class="skeleton-box" style="width:50%;height:16px;margin:0 auto 0 auto;"></div>
        `;
      });
    }
    // Skeleton para equipe
    const membersList = document.getElementById("members-list");
    if (membersList) {
      membersList.innerHTML = `
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
      `;
    }
    // Skeleton para projetos
    const projectsCards = document.getElementById("projects-cards");
    if (projectsCards) {
      projectsCards.innerHTML = `
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
      `;
    }
  }

  // Função para popular os detalhes da squad
  async function fetchAndRenderSquadDetails() {
    showSkeletonDetail();
    const squadId = getSquadIdFromUrl();
    if (!squadId) {
      removeSkeletons();
      renderSquadDetails(null, []);
      return;
    }
    try {
      const [squad, allocations] = await Promise.all([
        apiService.getSquadById(squadId),
        apiService.getSquadAllocations(squadId),
      ]);
      
      // Busca projeto associado à squad se houver projectId
      let project = null;
      if (squad && squad.projectId) {
        try {
          project = await apiService.getProjectById(squad.projectId);
        } catch (err) {
          console.warn("Erro ao buscar projeto da squad:", err);
        }
      }
      
      // Se houver projeto, adiciona à lista de projetos
      if (project) {
        squad.projectsList = [project];
      }
      
      removeSkeletons();
      renderSquadDetails(squad, allocations);
    } catch (err) {
      console.error("Erro ao buscar detalhes da squad:", err);
      removeSkeletons();
      renderSquadDetails(null, []);
    }
  }

  // Remove skeletons dos cards de stats, finanças, equipe e projetos
  function removeSkeletons() {
    // Remove skeleton da sidebar
    const summary = document.querySelector(".summary");
    if (summary) {
      summary.innerHTML = `
        <div class="summary-header">
          <h2 data-i18n="squads_detail.team_title"></h2>
          <div class="summary-actions">
            <img
              src="../../../../assets/svg/edit-button.svg"
              alt="Editar"
              class="action-icon"
              style="vertical-align: middle; width: 34px; height: 34px"
              title=""
              data-i18n="squads_detail.edit"
            />
            <img
              src="../../../../assets/svg/trash-button.svg"
              alt="Remover"
              class="action-icon"
              style="vertical-align: middle; width: 34px; height: 34px"
              title=""
              data-i18n="squads_detail.remove"
            />
          </div>
        </div>
        <div class="projects-count" data-i18n="squads_detail.active_projects"></div>
        <div class="description" data-i18n="squads_detail.description"></div>
        <div class="info-line"></div>
        <div class="info-line"></div>
        <div class="skills d-flex flex-column"></div>
        <div class="data-block"></div>
        <div class="data-block"></div>
      `;
      // Adiciona os listeners nos botões após renderizar
      bindSummaryActionButtons();
    }
    // Remove skeleton dos cards de stats
    const stats = document.querySelectorAll(".stats-container .card");
    if (stats && stats.length) {
      // Espera-se 3 cards: horas alocadas, índice de sobrecarga
      if (stats[0])
        stats[0].innerHTML = `
        <span class="stats-title" data-i18n="squads_detail.allocated_hours"></span>
        <span id="allocated-hours"></span>
        <span id="allocated-hours-available" class="stats-available"></span>
      `;
      if (stats[1])
        stats[1].innerHTML = `
        <span class="stats-title" data-i18n="squads_detail.overload_index"></span>
        <span id="overload-index"></span>
      `;
    }
    // Remove skeleton dos cards de finanças
    const finances = document.querySelectorAll(".financial-overview .card");
    if (finances && finances.length) {
      // Espera-se 2 cards: investimento mensal, orçamento total
      if (finances[0])
        finances[0].innerHTML = `
        <span class="stats-title" data-i18n="squads_detail.monthly_investment"></span>
        <span id="monthly-investment"></span>
      `;
      if (finances[1])
        finances[1].innerHTML = `
        <span class="stats-title" data-i18n="squads_detail.total_budget"></span>
        <span id="total-budget"></span>
      `;
    }
    // Remove skeleton da equipe
    const membersList = document.getElementById("members-list");
    if (membersList) {
      membersList.innerHTML = "";
    }
    // Remove skeleton dos projetos
    const projectsCards = document.getElementById("projects-cards");
    if (projectsCards) {
      projectsCards.innerHTML = "";
    }
  }

  // Função para preencher os campos do HTML com os dados da squad
  function renderSquadDetails(squad, allocations) {
    // Fallback para '-'
    const get = (obj, key, fallback = "-") =>
      obj && obj[key] ? obj[key] : fallback;
    // Título (preenche o <h2> da summary com o nome do backend)
    const summaryTitle = document.querySelector(".summary-header h2");
    const squadName = get(squad, "name");
    if (summaryTitle) {
      summaryTitle.textContent = squadName;
      summaryTitle.removeAttribute("data-i18n");
    }
    // Título da página (title)
    const pageTitle = document.querySelector(
      "title[data-i18n='squads_detail.team_title']"
    );
    if (pageTitle) {
      pageTitle.textContent = squadName;
      pageTitle.removeAttribute("data-i18n");
    }
    // Descrição
    const descEl = document.querySelector(
      '.description[data-i18n="squads_detail.description"]'
    );
    if (descEl) descEl.textContent = get(squad, "description");
    // Área e membros
    const infoLines = document.querySelectorAll(".info-line");
    if (infoLines && infoLines.length > 0) {
      // Primeira info-line: membros
      const memberCount = allocations && Array.isArray(allocations)
        ? allocations.length
        : (squad.memberCount || get(squad, "members", 0));
      infoLines[0].innerHTML = `<strong data-i18n="squads_detail.members"></strong> ${memberCount}`;
    }
    // Projetos ativos
    const projectsCountEl = document.querySelector(
      '.projects-count[data-i18n="squads_detail.active_projects"]'
    );
    if (projectsCountEl) {
      // Tenta buscar projetos da squad ou usar contagem
      const projectCount = squad.projectsList && Array.isArray(squad.projectsList)
        ? squad.projectsList.length
        : (squad.activeProjects || get(squad, "projetosAtivos", "0"));
      projectsCountEl.textContent = `${projectCount} projetos ativos`;
    }
    // Stats e finanças (usa os campos se existirem, senão '-')
    let used, total, percent, score, monthlyValue, budgetValue;
    if (squad) {
      used = get(squad, "allocatedHours", get(squad, "horasAlocadas", "-"));
      total = get(squad, "totalHours", get(squad, "horasTotais", "-"));
      percent =
        used !== "-" &&
        total !== "-" &&
        !isNaN(used) &&
        !isNaN(total) &&
        Number(total) > 0
          ? Math.round((Number(used) / Number(total)) * 100)
          : "-";
      monthlyValue = get(squad, "monthlyInvestment", get(squad, "preco", "-"));
      budgetValue = get(
        squad,
        "totalBudget",
        get(squad, "orcamentoTotal", "-")
      );
    } else {
      used = total = percent = score = monthlyValue = budgetValue = "-";
    }
    // Preenche campos de stats
    const i18n = window.i18n;
    if (i18n) {
      const elAllocatedHours = document.getElementById("allocated-hours");
      if (elAllocatedHours)
        elAllocatedHours.textContent =
          used !== "-"
            ? i18n
                .t("squads_detail.allocated_hours_value")
                .replace("{used}", used)
            : "-";

      const elAllocatedHoursAvailable = document.getElementById(
        "allocated-hours-available"
      );
      if (elAllocatedHoursAvailable && total !== "-") {
        elAllocatedHoursAvailable.textContent = i18n
          .t("squads_detail.allocated_hours_available")
          .replace("{total}", total);
      }

      const elOverloadIndex = document.getElementById("overload-index");
      if (elOverloadIndex)
        elOverloadIndex.textContent =
          percent !== "-"
            ? i18n
                .t("squads_detail.overload_index_value")
                .replace("{percent}", percent)
            : "-";

      const elMonthlyInvestment = document.getElementById("monthly-investment");
      if (elMonthlyInvestment)
        elMonthlyInvestment.textContent =
          monthlyValue !== "-"
            ? i18n
                .t("squads_detail.monthly_investment_value")
                .replace("{value}", monthlyValue)
            : "-";

      const elTotalBudget = document.getElementById("total-budget");
      if (elTotalBudget)
        elTotalBudget.textContent =
          budgetValue !== "-"
            ? i18n
                .t("squads_detail.total_budget_value")
                .replace("{value}", budgetValue)
            : "-";
    }
    // Membros (usando allocations)
    renderMembros(allocations);
    // Projetos
    renderProjetos(squad && squad.projectsList);
  }

  // Função para mostrar o modal
  function showDeleteModal() {
    if (modal) modal.style.display = "flex";
  }

  // Função para esconder o modal
  function hideDeleteModal() {
    if (modal) modal.style.display = "none";
  }

  // Fecha o modal ao cancelar
  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener("click", function () {
      hideDeleteModal();
    });
  }

  // Confirma exclusão (adiciona delay para o toast aparecer)
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", async function () {
      const squadId = getSquadIdFromUrl();
      if (!squadId) {
        hideDeleteModal();
        return;
      }
      try {
        await apiService.deleteSquadById(squadId);
        hideDeleteModal();
        // Exibe toast de sucesso se existir
        if (window.toast && typeof window.toast.success === "function") {
          window.toast.success("Squad excluída com sucesso!");
        }
        setTimeout(() => {
          window.location.href = "../squads.html";
        }, 1200); // 1.2s para garantir exibição do toast
      } catch (err) {
        hideDeleteModal();
        alert("Erro ao excluir a squad. Tente novamente.");
      }
    });
  }

  // FILTRO DE PROJETOS POR STATUS
  const statusSelect = document.getElementById("status-select");
  const projectCards = document.querySelectorAll(".project-card");

  if (statusSelect) {
    statusSelect.addEventListener("change", function () {
      const selected = statusSelect.value;
      projectCards.forEach((card) => {
        const statusSpan = card.querySelector(".project-status");
        if (!statusSpan) return;
        const statusText = statusSpan.textContent.trim();
        if (
          selected === "Todos" ||
          selected === "" ||
          statusText === selected
        ) {
          card.style.display = "flex";
        } else {
          card.style.display = "none";
        }
      });
    });
  }

  // Função para renderizar membros
  function renderMembros(allocations) {
    const membersList = document.getElementById("members-list");
    if (!membersList) return;
    if (!Array.isArray(allocations) || allocations.length === 0) {
      membersList.innerHTML = "<p style='text-align: center; color: #666;'>Nenhum membro alocado</p>";
      return;
    }
    
    // Busca dados dos colaboradores para calcular horas disponíveis
    Promise.all(
      allocations.map(async (aloc) => {
        try {
          const employee = aloc.employee;
          if (!employee || !employee.id) return aloc;
          
          // Busca alocações do colaborador para calcular horas disponíveis
          const allAllocations = await apiService.getSquadsByCollaboratorId(employee.id);
          const weeklyHours = employee.workHoursPerWeek || 40;
          const monthlyHours = weeklyHours * 4;
          
          // Calcula horas mensais alocadas (soma todas as alocações × 4)
          const totalAllocatedMonthly = allAllocations && Array.isArray(allAllocations)
            ? allAllocations.reduce((sum, alloc) => {
                const weekly = alloc.allocatedHours || 0;
                return sum + (weekly * 4); // Converte para mensal
              }, 0)
            : 0;
          
          const availableMonthly = Math.max(0, monthlyHours - totalAllocatedMonthly);
          const allocatedWeekly = aloc.allocatedHours || 0;
          const allocatedMonthly = allocatedWeekly * 4; // Horas mensais desta alocação
          
          return {
            ...aloc,
            allocatedMonthly,
            availableMonthly,
            weeklyHours,
            monthlyHours
          };
        } catch (error) {
          console.error("Erro ao buscar dados do colaborador:", error);
          const allocatedWeekly = aloc.allocatedHours || 0;
          return {
            ...aloc,
            allocatedMonthly: allocatedWeekly * 4,
            availableMonthly: "-",
            weeklyHours: 40,
            monthlyHours: 160
          };
        }
      })
    ).then((membersWithHours) => {
      membersList.innerHTML = membersWithHours
        .map((aloc) => {
          const nome = aloc.employee?.name || "-";
          const status = aloc.employee?.status || "Ativo";
          const funcao = aloc.position || "-";
          const horasAlocadasMensais = aloc.allocatedMonthly || 0;
          const horasDisponiveis = aloc.availableMonthly !== undefined ? aloc.availableMonthly : "-";
          
          return `
            <div class="member-card card">
              <div class="member-header">
                <strong>${nome}</strong>
                <span class="status-badge">${status}</span>
              </div>
              <p class="custom-p custom-margin function"><span data-i18n="squads_detail.functions"></span></p>
              <div class="tags">
                <span>${funcao}</span>
              </div>
              <p class="custom-p"><span data-i18n="squads_detail.allocated"></span> ${horasAlocadasMensais}h/mês</p>
              <p class="custom-p"><span data-i18n="squads_detail.available"></span> ${horasDisponiveis !== "-" ? horasDisponiveis + "h/mês" : "-"}</p>
            </div>
          `;
        })
        .join("");
      if (window.i18n) window.i18n.apply();
    });
  }

  // Função para renderizar projetos
  function renderProjetos(projetos) {
    const projectsCards = document.getElementById("projects-cards");
    if (!projectsCards) return;
    if (!Array.isArray(projetos) || projetos.length === 0) {
      projectsCards.innerHTML = "<p style='text-align: center; color: #666;'>Nenhum projeto associado</p>";
      return;
    }
    
    projectsCards.innerHTML = projetos
      .map((projeto) => {
        const nome = projeto.name || projeto.titulo || projeto.title || "-";
        const status = projeto.status || "-";
        const startedAt = projeto.startedAt || projeto.comeco || projeto.start || "-";
        const endedAt = projeto.endedAt || projeto.fim || projeto.end || "-";
        
        // Formata datas se necessário
        const formatDate = (dateStr) => {
          if (!dateStr || dateStr === "-") return "-";
          try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString("pt-BR");
          } catch {
            return dateStr;
          }
        };
        
        return `
          <div class="project-card card">
            <div class="project-info">
              <div class="project-title">
                <strong class="project-title">${nome}</strong>
                <span class="project-status">${status}</span>
              </div>
              <div class="dates">
                <span>
                  <img src="../../../../assets/svg/calendar.svg" style="height: 16px; width: 16px; vertical-align: middle; margin-right: 4px;" />
                  <span data-i18n="squads_detail.start"></span> ${formatDate(startedAt)}
                </span>
                ${endedAt !== "-" ? `
                <span>
                  <img src="../../../../assets/svg/calendar.svg" style="height: 16px; width: 16px; vertical-align: middle; margin-right: 4px;" />
                  <span data-i18n="squads_detail.end"></span> ${formatDate(endedAt)}
                </span>
                ` : ""}
              </div>
            </div>
          </div>
        `;
      })
      .join("");
    if (window.i18n) window.i18n.apply();
  }

  fetchAndRenderSquadDetails();

  // CSS skeleton (apenas se não existir)
  if (!document.getElementById("skeleton-style")) {
    const style = document.createElement("style");
    style.id = "skeleton-style";
    style.innerHTML = `
      .skeleton-box {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.2s infinite linear alternate;
        border-radius: 6px;
        min-height: 18px;
        margin-bottom: 8px;
      }
      .skeleton-card {
        min-width: 180px;
        height: 80px;
        border-radius: 8px;
        margin-right: 16px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.2s infinite linear alternate;
      }
      @keyframes skeleton-loading {
        0% { background-position: -200px 0; }
        100% { background-position: calc(200px + 100%) 0; }
      }
    `;
    document.head.appendChild(style);
  }
});

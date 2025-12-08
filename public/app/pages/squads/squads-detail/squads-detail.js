import { apiService } from "../../../../assets/js/apiService.js";
import { applyAccessControl, isCollaborator } from "../../../../assets/js/permissions.js";

document.addEventListener("DOMContentLoaded", function () {
  // Aplicar controle de acesso
  applyAccessControl();
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
        // Mostra loader antes de redirecionar
        const loader = document.getElementById("loader");
        const mainContent = document.getElementById("main-content");
        if (loader) {
          loader.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;">
              <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #7d1bff; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin-bottom: 20px;"></div>
              <p style="color: #7d1bff; font-size: 16px;">Carregando dados da squad...</p>
            </div>
            <style>
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          `;
          loader.style.display = "flex";
        }
        if (mainContent) {
          mainContent.classList.add("hidden");
        }
        // Redireciona após um pequeno delay para garantir que o loader apareça
        setTimeout(() => {
          if (squadId) {
            window.location.href = `../squads-form/squads-form.html?id=${squadId}`;
          } else {
            window.location.href = "../squads-form/squads-form.html";
          }
        }, 100);
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
    // Cards de stats e finanças foram removidos
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

  // Função para esconder o loader e mostrar o conteúdo principal
  function hideLoaderAndShowContent() {
    const loader = document.getElementById("loader");
    const mainContent = document.getElementById("main-content");
    if (loader) {
      loader.style.display = "none";
      loader.classList.add("hidden");
    }
    if (mainContent) {
      mainContent.classList.remove("hidden");
    }
  }

  // Função para popular os detalhes da squad
  async function fetchAndRenderSquadDetails() {
    // Esconde o loader e mostra o conteúdo antes de carregar os dados
    hideLoaderAndShowContent();
    showSkeletonDetail();
    const squadId = getSquadIdFromUrl();
    if (!squadId) {
      removeSkeletons();
      renderSquadDetails(null, null, 0);
      return;
    }
    try {
      const [squad, squadDetails] = await Promise.all([
        apiService.getSquadById(squadId),
        apiService.getSquadDetails(squadId),
      ]);
      
      // Buscar todos os projetos ativos e contar quantos têm essa squad vinculada
      let activeProjectsCount = 0;
      let projectsList = [];
      
      try {
        const allProjects = await apiService.getAllProjects();
        if (allProjects && Array.isArray(allProjects)) {
          // Filtrar projetos que têm essa squad (team) vinculada
          // A squad pode estar vinculada através do fk_project OU através da lista de squads do projeto
          projectsList = allProjects.filter(project => {
            // Verifica se o projeto tem essa squad na lista de squads
            if (project.squads && Array.isArray(project.squads)) {
              return project.squads.some(s => s.id === parseInt(squadId) || s.id === squadId);
            }
            // Também verifica se o projectId da squad corresponde ao ID do projeto
            if (squad && squad.projectId && project.id) {
              return project.id === squad.projectId || project.id === parseInt(squad.projectId);
            }
            return false;
          });
          // Contar apenas projetos ativos
          activeProjectsCount = projectsList.filter(p => p.active !== false).length;
        }
      } catch (err) {
        console.warn("Erro ao buscar projetos para contar:", err);
        // Se falhar, tentar buscar apenas o projeto principal
        if (squad && squad.projectId) {
          try {
            const project = await apiService.getProjectById(squad.projectId);
            if (project) {
              projectsList = [project];
              if (project.active !== false) {
                activeProjectsCount = 1;
              }
            }
          } catch (err2) {
            console.warn("Erro ao buscar projeto principal:", err2);
          }
        }
      }
      
      // Se não encontrou projetos através da busca, usar o projeto principal
      if (projectsList.length === 0 && squad && squad.projectId) {
        try {
          const project = await apiService.getProjectById(squad.projectId);
          if (project) {
            projectsList = [project];
            if (project.active !== false) {
              activeProjectsCount = 1;
            }
          }
        } catch (err) {
          console.warn("Erro ao buscar projeto da squad:", err);
        }
      }
      
      squad.projectsList = projectsList;
      
      removeSkeletons();
      renderSquadDetails(squad, squadDetails, activeProjectsCount);
    } catch (err) {
      console.error("Erro ao buscar detalhes da squad:", err);
      removeSkeletons();
      renderSquadDetails(null, null, 0);
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
        <div class="projects-count" id="projects-count" style="display: inline-block; background: #2f7d32; color: #fff; border-radius: 50px; padding: 4px 10px; font-size: 14px; font-weight: 500; margin-bottom: 12px;">0 projetos ativos</div>
        <div class="description" data-i18n="squads_detail.description"></div>
        <div class="info-line">
          <strong data-i18n="squads_detail.members"></strong> <span id="members-count">0</span>
        </div>
        <div class="info-line" id="hours-info">
          <strong>Horas totais:</strong> <span id="total-hours">-</span> • 
          <strong>Horas aplicadas:</strong> <span id="allocated-hours-info">-</span>
        </div>
        <div class="info-line" id="po-info" style="display: none;">
          <strong>PO:</strong> <span id="po-name">-</span>
        </div>
        <div class="info-line" id="sprint-info" style="display: none;">
          <strong>Duração do Sprint:</strong> <span id="sprint-duration">-</span> semanas
        </div>
        <div class="skills d-flex flex-column"></div>
        <div class="data-block"></div>
        <div class="data-block"></div>
      `;
      // Adiciona os listeners nos botões após renderizar
      bindSummaryActionButtons();
      // Aplicar controle de acesso após renderizar os botões
      applyAccessControl();
    }
    // Cards de stats e finanças foram removidos
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
  function renderSquadDetails(squad, squadDetails, activeProjectsCount = 0) {
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
    if (descEl) {
      const description = get(squad, "description", get(squadDetails, "teamDescription", "-"));
      descEl.textContent = description;
      descEl.removeAttribute("data-i18n");
    }
    
    // Projetos ativos - atualizar dinamicamente
    const projectsCountEl = document.getElementById("projects-count");
    if (projectsCountEl) {
      projectsCountEl.textContent = `${activeProjectsCount} projeto${activeProjectsCount !== 1 ? 's' : ''} ativo${activeProjectsCount !== 1 ? 's' : ''}`;
    }
    
    // Membros
    const membersCountEl = document.getElementById("members-count");
    if (membersCountEl) {
      const memberCount = squadDetails && squadDetails.membersCount !== undefined
        ? squadDetails.membersCount
        : (squad && squad.memberCount) || 0;
      membersCountEl.textContent = memberCount;
    }
    
    // Horas totais e aplicadas
    const totalHoursEl = document.getElementById("total-hours");
    const allocatedHoursInfoEl = document.getElementById("allocated-hours-info");
    let totalHours = "-";
    let allocatedHours = "-";
    
    if (totalHoursEl) {
      totalHours = (squadDetails?.totalHours) ?? (squad?.totalHours) ?? "-";
      totalHoursEl.textContent = totalHours !== "-" ? `${totalHours}h` : "-";
    }
    if (allocatedHoursInfoEl) {
      allocatedHours = (squadDetails?.allocatedHours) ?? (squad?.allocatedHours) ?? "-";
      allocatedHoursInfoEl.textContent = allocatedHours !== "-" ? `${allocatedHours}h` : "-";
    }
    
    // Índice de sobrecarga (calculado com base nos colaboradores e nas horas alocadas e disponíveis)
    const overloadInfoEl = document.getElementById("overload-info");
    const overloadPercentEl = document.getElementById("overload-percent");
    if (overloadInfoEl && overloadPercentEl) {
      let overloadPercent = "-";
      
      // Tenta calcular baseado nas horas disponíveis reais dos colaboradores
      if (squadDetails && squadDetails.members && Array.isArray(squadDetails.members) && squadDetails.members.length > 0) {
        // Calcula horas disponíveis totais dos colaboradores para a sprint
        let totalAvailableHours = 0;
        const sprintDuration = squadDetails.sprintDuration || squad?.sprintDuration || 4;
        
        console.log("Calculando índice de sobrecarga - Sprint duration:", sprintDuration);
        
        squadDetails.members.forEach((member, index) => {
          // Tenta pegar horas semanais do colaborador
          let memberWeeklyHours = 0;
          
          if (member.workHoursPerWeek) {
            memberWeeklyHours = Number(member.workHoursPerWeek);
          } else if (member.monthlyHours) {
            // Se só temos monthlyHours, divide por 4 para obter semanais
            memberWeeklyHours = Number(member.monthlyHours) / 4;
          } else {
            // Default: 40 horas semanais
            memberWeeklyHours = 40;
          }
          
          if (memberWeeklyHours > 0) {
            const memberAvailableForSprint = memberWeeklyHours * sprintDuration;
            totalAvailableHours += memberAvailableForSprint;
            console.log(`Membro ${index + 1} (${member.name}): ${memberWeeklyHours}h/semana × ${sprintDuration} semanas = ${memberAvailableForSprint}h disponíveis`);
          }
        });
        
        console.log("Total de horas disponíveis:", totalAvailableHours);
        
        // Horas alocadas totais
        let totalAllocatedHours = 0;
        if (allocatedHours !== "-" && !isNaN(Number(allocatedHours))) {
          totalAllocatedHours = Number(allocatedHours);
        } else if (squadDetails.allocatedHours !== undefined && squadDetails.allocatedHours !== null) {
          totalAllocatedHours = Number(squadDetails.allocatedHours) || 0;
        }
        
        console.log("Total de horas alocadas:", totalAllocatedHours);
        
        // Calcula índice de sobrecarga
        if (totalAvailableHours > 0 && totalAllocatedHours >= 0) {
          const percent = Math.round((totalAllocatedHours / totalAvailableHours) * 100);
          overloadPercent = `${percent}%`;
          console.log(`Índice de sobrecarga calculado: ${overloadPercent}`);
        }
      } else if (totalHours !== "-" && allocatedHours !== "-" && 
          !isNaN(Number(totalHours)) && !isNaN(Number(allocatedHours)) && 
          Number(totalHours) > 0) {
        // Fallback: usa o cálculo baseado em totalHours da squad
        const percent = Math.round((Number(allocatedHours) / Number(totalHours)) * 100);
        overloadPercent = `${percent}%`;
        console.log(`Índice de sobrecarga (fallback): ${overloadPercent}`);
      }
      
      overloadPercentEl.textContent = overloadPercent;
      overloadInfoEl.style.display = "block";
      console.log("Elemento de sobrecarga exibido:", overloadPercent);
    } else {
      // Tenta novamente após um delay caso os elementos ainda não estejam no DOM
      setTimeout(() => {
        const retryOverloadInfoEl = document.getElementById("overload-info");
        const retryOverloadPercentEl = document.getElementById("overload-percent");
        if (retryOverloadInfoEl && retryOverloadPercentEl) {
          let overloadPercent = "-";
          if (totalHours !== "-" && allocatedHours !== "-" && 
              !isNaN(Number(totalHours)) && !isNaN(Number(allocatedHours)) && 
              Number(totalHours) > 0) {
            const percent = Math.round((Number(allocatedHours) / Number(totalHours)) * 100);
            overloadPercent = `${percent}%`;
          }
          retryOverloadPercentEl.textContent = overloadPercent;
          retryOverloadInfoEl.style.display = "block";
        }
      }, 500);
    }
    
    // Duração do Sprint
    const sprintInfoEl = document.getElementById("sprint-info");
    const sprintDurationEl = document.getElementById("sprint-duration");
    if (sprintInfoEl && sprintDurationEl) {
      const sprintDuration = (squadDetails?.sprintDuration) ?? (squad?.sprintDuration) ?? null;
      if (sprintDuration && sprintDuration !== "-") {
        sprintDurationEl.textContent = sprintDuration;
        sprintInfoEl.style.display = "block";
      } else {
        sprintInfoEl.style.display = "none";
      }
    }
    
    // Cards de stats e finanças foram removidos - não precisamos mais preencher
    // Membros (usando squadDetails)
    renderMembros(squadDetails);
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
  function renderMembros(squadDetails) {
    const membersList = document.getElementById("members-list");
    if (!membersList) return;
    
    // Verificar se temos detalhes da squad com membros
    if (!squadDetails || !squadDetails.members || !Array.isArray(squadDetails.members) || squadDetails.members.length === 0) {
      membersList.innerHTML = "<p style='text-align: center; color: #666; padding: 20px;'>Nenhum membro alocado</p>";
      return;
    }
    
    // Função para formatar moeda
    function formatCurrency(value) {
      if (!value) return "-";
      return `R$ ${Number(value).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    
    // Verificar se é colaborador (access_level 3)
    const isColab = isCollaborator();
    
    // Total investido da squad - ocultar se for colaborador
    const totalInvestedFormatted = (!isColab && squadDetails.totalInvestedValue) 
      ? formatCurrency(squadDetails.totalInvestedValue)
      : null;
    
    // Agregar todas as skills únicas
    const allSkillsMap = new Map();
    squadDetails.members.forEach(member => {
      if (member.skills && Array.isArray(member.skills)) {
        member.skills.forEach(skill => {
          if (!allSkillsMap.has(skill.id)) {
            allSkillsMap.set(skill.id, skill);
          }
        });
      }
    });
    const allSkills = Array.from(allSkillsMap.values());
    
    // HTML do total investido - ocupa 2 colunas
    let topSectionHTML = "";
    if (totalInvestedFormatted || allSkills.length > 0) {
      topSectionHTML = `
        <div class="total-invested-card" style="grid-column: 1 / -1; margin-bottom: 20px; padding: 14px; background: rgba(245, 245, 245, 0.9); border-radius: 8px; border: 1px solid #e0e0e0;">
          ${totalInvestedFormatted ? `
            <div style="margin-bottom: ${allSkills.length > 0 ? '14px' : '0'}; padding-bottom: ${allSkills.length > 0 ? '14px' : '0'}; border-bottom: ${allSkills.length > 0 ? '1px solid #e0e0e0' : 'none'};">
              <strong style="font-size: 14px; color: #333; display: block; margin-bottom: 4px;">Total investido na squad:</strong>
              <span style="font-size: 16px; color: #2f7d32; font-weight: 700;">${totalInvestedFormatted}</span>
            </div>
          ` : ''}
          ${allSkills.length > 0 ? `
            <div>
              <strong style="font-size: 14px; color: #333; display: block; margin-bottom: 10px;">Skills agregadas da equipe:</strong>
              <div id="skills-container" style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
                <div id="skills-list" style="display: flex; flex-wrap: wrap; gap: 6px;">
                  ${allSkills.slice(0, 3).map(skill => 
                    `<span style="padding: 5px 10px; background: #e0f2ff; color: #0366d6; border-radius: 12px; font-size: 12px; font-weight: 500;">${skill.name}</span>`
                  ).join("")}
                </div>
                ${allSkills.length > 3 ? `
                  <button 
                    id="show-all-skills-btn" 
                    data-showing-all="false"
                    style="padding: 5px 12px; background: #7d1bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-family: poppins; font-weight: 500; transition: background 0.2s;"
                    onmouseover="this.style.background='#5e13c6'"
                    onmouseout="this.style.background='#7d1bff'">
                    Ver todas (${allSkills.length})
                  </button>
                  <span style="font-size: 11px; color: #666; margin-left: 6px;">
                    Mostrando 3 de ${allSkills.length}
                  </span>
                ` : ''}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }
    
    // HTML dos membros com background mais cinza - 2 por linha
    const membersHTML = squadDetails.members
      .map((member, idx) => {
        const nome = member.name || "N/A";
        const jobTitle = member.jobTitle || null;
        const allocatedHours = member.allocatedHours || 0;
        // Ocultar investedValue se for colaborador
        const investedValueFormatted = (!isColab && member.investedValue) 
          ? formatCurrency(member.investedValue)
          : null;
        const memberSkills = member.skills || [];
        
        return `
          <div class="member-item" style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #e0e0e0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <strong style="font-size: 15px; color: #333;">${nome}</strong>
              <span style="font-size: 13px; color: #666; font-weight: 600;">${allocatedHours}h</span>
            </div>
            <div style="font-size: 12px; color: #555; margin-top: 6px;">
              ${jobTitle ? `
                <div style="margin-bottom: 6px;">
                  <strong>Cargo:</strong> ${jobTitle}
                </div>
              ` : ''}
              ${memberSkills.length > 0 ? `
                <div style="margin-bottom: 6px;">
                  <strong style="font-size: 11px; color: #666;">Skills:</strong>
                  <div id="member-skills-${idx}" style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px;">
                    ${memberSkills.slice(0, 3).map(skill => 
                      `<span style="padding: 3px 8px; background: #e8e8e8; color: #555; border-radius: 10px; font-size: 10px;">${skill.name}</span>`
                    ).join("")}
                    ${memberSkills.length > 3 ? `
                      <button 
                        class="show-member-skills-btn" 
                        data-member-idx="${idx}" 
                        data-showing-all="false"
                        style="padding: 3px 8px; background: #ddd; color: #555; border: none; border-radius: 10px; cursor: pointer; font-size: 10px; font-weight: 500;">
                        +${memberSkills.length - 3}
                      </button>
                    ` : ''}
                  </div>
                </div>
              ` : ''}
              ${investedValueFormatted ? `
                <div style="margin-top: 8px; padding: 8px; background: rgba(255, 255, 255, 0.9); border-radius: 4px; border-left: 3px solid #28a745;">
                  <div style="font-size: 11px; color: #000; font-weight: 600;">
                    <strong>Parte do salário aplicado no projeto:</strong> ${investedValueFormatted}
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      })
      .join("");
    
    membersList.innerHTML = topSectionHTML + membersHTML;
    
    // Adicionar event listeners para paginação de skills
    setTimeout(() => {
      // Botão "Ver todas" para skills agregadas
      const showAllSkillsBtn = document.getElementById("show-all-skills-btn");
      if (showAllSkillsBtn) {
        const newBtn = showAllSkillsBtn.cloneNode(true);
        showAllSkillsBtn.parentNode.replaceChild(newBtn, showAllSkillsBtn);
        newBtn.addEventListener("click", function() {
          const showingAll = this.getAttribute("data-showing-all") === "true";
          const skillsList = document.getElementById("skills-list");
          if (skillsList) {
            if (showingAll) {
              skillsList.innerHTML = allSkills.slice(0, 3).map(skill => 
                `<span style="padding: 5px 10px; background: #e0f2ff; color: #0366d6; border-radius: 12px; font-size: 12px; font-weight: 500;">${skill.name}</span>`
              ).join("");
              this.textContent = `Ver todas (${allSkills.length})`;
              this.setAttribute("data-showing-all", "false");
              this.nextElementSibling.textContent = `Mostrando 3 de ${allSkills.length}`;
            } else {
              skillsList.innerHTML = allSkills.map(skill => 
                `<span style="padding: 5px 10px; background: #e0f2ff; color: #0366d6; border-radius: 12px; font-size: 12px; font-weight: 500;">${skill.name}</span>`
              ).join("");
              this.textContent = "Ver menos";
              this.setAttribute("data-showing-all", "true");
              this.nextElementSibling.textContent = `Mostrando todas (${allSkills.length})`;
            }
          }
        });
      }
      
      // Botões "Ver mais" para skills individuais dos membros
      document.querySelectorAll(".show-member-skills-btn").forEach((btn) => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener("click", function() {
          const memberIdx = parseInt(this.getAttribute("data-member-idx"));
          const showingAll = this.getAttribute("data-showing-all") === "true";
          const memberSkillsDiv = document.getElementById(`member-skills-${memberIdx}`);
          const member = squadDetails.members[memberIdx];
          const memberSkills = member?.skills || [];
          
          if (memberSkillsDiv) {
            if (showingAll) {
              memberSkillsDiv.innerHTML = memberSkills.slice(0, 3).map(skill => 
                `<span style="padding: 3px 8px; background: #e8e8e8; color: #555; border-radius: 10px; font-size: 10px;">${skill.name}</span>`
              ).join("") + 
              `<button class="show-member-skills-btn" data-member-idx="${memberIdx}" data-showing-all="false" style="padding: 3px 8px; background: #ddd; color: #555; border: none; border-radius: 10px; cursor: pointer; font-size: 10px; font-weight: 500;">+${memberSkills.length - 3}</button>`;
            } else {
              memberSkillsDiv.innerHTML = memberSkills.map(skill => 
                `<span style="padding: 3px 8px; background: #e8e8e8; color: #555; border-radius: 10px; font-size: 10px;">${skill.name}</span>`
              ).join("") + 
              `<button class="show-member-skills-btn" data-member-idx="${memberIdx}" data-showing-all="true" style="padding: 3px 8px; background: #ddd; color: #555; border: none; border-radius: 10px; cursor: pointer; font-size: 10px; font-weight: 500;">Ver menos</button>`;
            }
            
            // Re-adicionar listener ao novo botão
            const newBtn2 = memberSkillsDiv.querySelector(".show-member-skills-btn");
            if (newBtn2) {
              const clonedBtn = newBtn2.cloneNode(true);
              newBtn2.parentNode.replaceChild(clonedBtn, newBtn2);
              clonedBtn.addEventListener("click", arguments.callee);
            }
          }
        });
      });
    }, 100);
    
    if (window.i18n) window.i18n.apply();
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
        
        // Tratar status corretamente (pode ser objeto ou string)
        let statusText = "-";
        let statusObj = projeto.status;
        if (statusObj) {
          if (typeof statusObj === 'object' && statusObj !== null) {
            statusText = statusObj.name || statusObj.description || statusObj.status || "-";
          } else if (typeof statusObj === 'string') {
            statusText = statusObj;
          }
        }
        
        const startedAt = projeto.startedAt || projeto.comeco || projeto.start || projeto.startDate || "-";
        const endedAt = projeto.endedAt || projeto.fim || projeto.end || projeto.endDate || "-";
        
        // Formata datas se necessário
        const formatDate = (dateStr) => {
          if (!dateStr || dateStr === "-") return "-";
          try {
            // Se for string ISO, tenta parsear
            if (typeof dateStr === 'string') {
              const date = new Date(dateStr);
              if (!isNaN(date.getTime())) {
                return date.toLocaleDateString("pt-BR");
              }
            }
            return dateStr;
          } catch {
            return dateStr;
          }
        };
        
        return `
          <div class="project-card card">
            <div class="project-info">
              <div class="project-title">
                <strong class="project-title">${nome}</strong>
                <span class="project-status">${statusText}</span>
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

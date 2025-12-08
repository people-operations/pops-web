import { apiService } from "../../../../assets/js/apiService.js";
import { hasAccess, hasAnyAccess, applyAccessControl, protectFunction, isCollaborator } from "../../../../assets/js/permissions.js";

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
  return new Promise(async (resolve) => {
    const id = getProjectIdFromUrl();
    if (!id) {
      window.showNotification &&
        window.showNotification("error", "ID do projeto não encontrado na URL.");
      // Remove skeleton e restaura sidebar
      if (originalSidebarHTML) {
        document.querySelector(".summary").innerHTML = originalSidebarHTML;
        addSidebarActionListeners();
      }
      resolve();
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
      resolve();
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
  
  // Verificar se é colaborador (access_level 3)
  const isColab = isCollaborator();
  
  // Budget - ocultar se for colaborador
  const budgetElement = document.getElementById("project-budget");
  if (budgetElement) {
    if (isColab) {
      budgetElement.textContent = "-";
      // Ocultar o elemento pai (linha inteira)
      const budgetLine = budgetElement.closest('.info-line');
      if (budgetLine) budgetLine.style.display = 'none';
    } else {
      budgetElement.textContent = formatCurrency(project.budget);
    }
  }
  
  // Mão de obra aplicada será calculada depois de buscar os membros dos teams
  const laborCostElement = document.getElementById("project-labor-cost");
  if (laborCostElement) {
    if (isColab) {
      laborCostElement.textContent = "-";
      // Ocultar o elemento pai (linha inteira)
      const laborCostLine = laborCostElement.closest('.info-line');
      if (laborCostLine) laborCostLine.style.display = 'none';
    } else {
      // Inicializar com "-" enquanto carrega
      laborCostElement.textContent = "-";
    }
  }
  
  // Datas
  const datesElement = document.getElementById("project-dates");
  if (datesElement) {
    datesElement.textContent = `${formatDate(project.startDate)} – ${formatDate(project.endDate)}`;
  }
    // Equipes (teams) - Buscar informações detalhadas com valores financeiros
    const teamsList = document.querySelector(".teams-list");
    console.log("🔍 Elemento teamsList encontrado:", teamsList);
    console.log("📊 project.squads:", project.squads);
    console.log("📊 É array?", Array.isArray(project.squads));
    console.log("📊 Tem length?", project.squads?.length);
    
    if (!teamsList) {
      console.error("❌ ERRO: Elemento .teams-list não encontrado no DOM!");
    }
    
    if (Array.isArray(project.squads) && project.squads.length) {
      console.log("✅ Squads válidas, processando...");
      // Buscar informações detalhadas dos teams com valores financeiros
      let teamDetailsData = null;
      try {
        teamDetailsData = await apiService.getProjectTeamDetails(id);
        console.log("✅ teamDetailsData recebido:", teamDetailsData);
        console.log("✅ teamDetailsData.teams:", teamDetailsData?.teams);
      } catch (error) {
        console.warn("⚠️ Erro ao buscar detalhes dos teams:", error);
        // Continua com os dados básicos dos squads
      }
      
      // Buscar membros de cada team usando getSquadDetails (mesmo método usado em squads-detail)
      const teamsWithMembers = await Promise.all(
        project.squads.map(async (squad) => {
          try {
            console.log(`🔍 Buscando detalhes do squad ${squad.id}...`);
            const squadDetails = await apiService.getSquadDetails(squad.id);
            console.log(`✅ Squad ${squad.id} detalhes:`, squadDetails);
            
            // Se temos teamDetailsData, usar os dados financeiros de lá
            const teamDetail = teamDetailsData?.teams?.find(t => t.teamId === squad.id);
            
            return {
              teamId: squad.id,
              teamName: squad.name,
              teamDescription: squad.description,
              po: squad.po || teamDetail?.po,
              members: squadDetails?.members || [],
              membersCount: squadDetails?.membersCount || (squadDetails?.members?.length || 0),
              totalInvestedValue: teamDetail?.totalInvestedValue || null,
              // Manter referência aos detalhes completos
              squadDetails: squadDetails
            };
          } catch (error) {
            console.warn(`⚠️ Erro ao buscar detalhes do squad ${squad.id}:`, error);
            // Fallback: usar dados básicos
            const teamDetail = teamDetailsData?.teams?.find(t => t.teamId === squad.id);
            return {
              teamId: squad.id,
              teamName: squad.name,
              teamDescription: squad.description,
              po: squad.po || teamDetail?.po,
              members: [],
              membersCount: 0,
              totalInvestedValue: teamDetail?.totalInvestedValue || null,
              squadDetails: null
            };
          }
        })
      );
      
      console.log("📋 Teams com membros:", teamsWithMembers);
      
      // Calcular Mão de obra aplicada baseado nos membros buscados - apenas se não for colaborador
      if (laborCostElement && !isColab) {
        try {
          // Calcular total investido somando o investedValue de todos os membros de todos os teams
          let totalInvested = 0;
          
          console.log("💰 Calculando total investido...");
          console.log("💰 teamsWithMembers:", teamsWithMembers);
          
          // Primeiro, tentar usar totalInvestedValue dos teams se disponível
          teamsWithMembers.forEach((team, idx) => {
            console.log(`💰 Team ${idx} (${team.teamName}):`, {
              totalInvestedValue: team.totalInvestedValue,
              squadDetailsTotalInvested: team.squadDetails?.totalInvestedValue,
              membersCount: team.members?.length || 0
            });
            
            if (team.totalInvestedValue) {
              totalInvested += Number(team.totalInvestedValue);
              console.log(`💰 Team ${idx} - usando totalInvestedValue: ${team.totalInvestedValue}`);
            } else if (team.squadDetails?.totalInvestedValue) {
              // Usar totalInvestedValue do squadDetails se disponível
              totalInvested += Number(team.squadDetails.totalInvestedValue);
              console.log(`💰 Team ${idx} - usando squadDetails.totalInvestedValue: ${team.squadDetails.totalInvestedValue}`);
            } else if (team.members && Array.isArray(team.members)) {
              // Se não tiver totalInvestedValue, calcular somando investedValue dos membros
              let teamTotal = 0;
              team.members.forEach((member, memberIdx) => {
                if (member.investedValue) {
                  const memberValue = Number(member.investedValue);
                  teamTotal += memberValue;
                  console.log(`💰 Team ${idx} - Membro ${memberIdx} (${member.name}): investedValue = ${member.investedValue}`);
                }
              });
              totalInvested += teamTotal;
              console.log(`💰 Team ${idx} - Total calculado dos membros: ${teamTotal}`);
            }
          });
          
          const totalInvestedFormatted = totalInvested > 0
            ? formatCurrency(totalInvested)
            : "-";
          laborCostElement.textContent = totalInvestedFormatted;
          console.log("💰 Total investido calculado:", totalInvested, "Formatado:", totalInvestedFormatted);
        } catch (error) {
          console.warn("Erro ao calcular total investido:", error);
          laborCostElement.textContent = "-";
        }
      } else {
        console.warn("⚠️ Elemento project-labor-cost não encontrado no DOM");
      }
      
      // Salvar referência do project para usar nos event listeners
      window.currentProject = project;
      window.teamDetailsData = teamDetailsData; // Salvar também os detalhes
      window.teamsWithMembers = teamsWithMembers; // Salvar teams com membros
      
      // Usar teamsWithMembers que tem os membros buscados
      const teamsToRender = teamsWithMembers;
      console.log("📋 Teams para renderizar:", teamsToRender);
      console.log("📋 Quantidade:", teamsToRender?.length);
      
      if (!teamsList) {
        console.error("❌ ERRO: teamsList ainda não existe!");
        return;
      }
      
      // Gerar HTML primeiro
      const htmlContent = teamsToRender
      .map(
        (team, idx) => {
          // Usar dados do team que já tem os membros buscados via getSquadDetails
          const members = Array.isArray(team.members) ? team.members : [];
          
          const teamData = {
            teamId: team.teamId,
            teamName: team.teamName,
            teamDescription: team.teamDescription,
            po: team.po,
            membersCount: team.membersCount || members.length,
            members: members,
            totalInvestedValue: team.totalInvestedValue || null
          };
          
          console.log(`✅ Team ${idx} (${teamData.teamName}) - DADOS:`, {
            membersCount: teamData.membersCount,
            membersArrayLength: teamData.members?.length || 0,
            membersArray: teamData.members,
            hasSkills: teamData.members.some(m => m.skills && Array.isArray(m.skills) && m.skills.length > 0)
          });
          
          // Agregar todas as skills dos membros
          const allSkills = [];
          if (teamData.members && teamData.members.length > 0) {
            console.log(`🔧 Processando skills para team ${idx}, ${teamData.members.length} membros`);
            const skillsMap = new Map();
            teamData.members.forEach((member, memberIdx) => {
              console.log(`🔧 Membro ${memberIdx}:`, member);
              console.log(`🔧 Membro ${memberIdx}.skills:`, member.skills);
              if (member.skills && Array.isArray(member.skills)) {
                member.skills.forEach(skill => {
                  // A skill pode ser um objeto com 'name' ou apenas uma string
                  const skillName = typeof skill === 'string' ? skill : (skill.name || skill.skillName || skill);
                  if (skillName && !skillsMap.has(skillName)) {
                    skillsMap.set(skillName, typeof skill === 'string' ? { name: skill } : skill);
                  }
                });
              }
            });
            allSkills.push(...Array.from(skillsMap.values()));
            console.log(`🔧 Skills agregadas para team ${idx}:`, allSkills);
          } else {
            console.log(`⚠️ Team ${idx} não tem membros ou membros está vazio`);
          }
          
          return `
          <div class="team-card ${["pink", "cyan", "purple"][idx % 3]}">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <h5 class="team-name" style="margin: 0;">${teamData.teamName || "-"}</h5>
              <button class="toggle-team-btn" data-team-idx="${idx}" style="background: none; border: none; cursor: pointer; padding: 4px 8px; font-size: 18px; color: #666; transition: transform 0.2s;" title="Expandir/Recolher">
                <span class="toggle-icon" data-team-idx="${idx}">▶</span>
              </button>
            </div>
            <p class="team-info">
              <strong>${teamData.members?.length || teamData.membersCount || 0} membros</strong>
              ${!isColab && teamData.totalInvestedValue ? ` • <strong style="color: #28a745;">Total investido: ${formatCurrency(teamData.totalInvestedValue)}</strong>` : ''}
            </p>
            
            <!-- Skills agregadas (sempre visíveis) -->
            <div class="team-skills-always-visible" style="margin: 12px 0;">
              <p class="team-info" data-i18n="projects_detail.skills_present" style="margin-bottom: 8px;">
                <strong>Skills agregadas da equipe:</strong>
              </p>
              <div class="skills-container" data-team-idx="${idx}">
                ${
                  allSkills.length > 0
                    ? `
                      <div class="skills-list" id="skills-list-${idx}">
                        ${allSkills
                          .slice(0, 5)
                          .map(
                            (skill) => {
                              const skillName = typeof skill === 'string' ? skill : (skill.name || skill.skillName || 'N/A');
                              return `<span class="skill">${skillName}</span>`;
                            }
                          )
                          .join("")}
                      </div>
                      ${
                        allSkills.length > 5
                          ? `
                            <div class="skills-pagination" style="margin-top: 8px;">
                              <button class="show-all-skills-btn" data-team-idx="${idx}" data-showing-all="false" style="background: #7d1bff; color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-family: poppins;">
                                Ver todas (${allSkills.length})
                              </button>
                              <span style="font-size: 11px; color: #666; margin-left: 8px;">
                                Mostrando 5 de ${allSkills.length}
                              </span>
                            </div>
                          `
                          : ''
                      }
                    `
                    : '<span style="color: #888; font-style: italic;">Nenhuma skill cadastrada</span>'
                }
              </div>
            </div>
            
            <!-- Membros da equipe (expansível) -->
            <div class="team-members team-content-${idx}" style="margin: 12px 0; display: none;">
              <p class="team-info" style="font-weight: 600; margin-bottom: 8px;">
                <strong>Membros:</strong>
              </p>
              ${
                teamData.members && Array.isArray(teamData.members) && teamData.members.length > 0
                  ? (() => {
                      console.log(`👥 Renderizando ${teamData.members.length} membros para team ${idx}:`, teamData.members);
                      return teamData.members
                        .map(
                          (member) => {
                            // Formatar valor investido - ocultar se for colaborador
                            const investedValueFormatted = (!isColab && member.investedValue) 
                              ? formatCurrency(member.investedValue)
                              : null;
                            
                            // Obter allocatedHours de diferentes possíveis campos
                            const allocatedHours = member.allocatedHours || member.hours || 0;
                            
                            // Obter nome de diferentes possíveis campos
                            const memberName = member.name || member.employeeName || "N/A";
                            
                            // Obter jobTitle/position de diferentes possíveis campos
                            const jobTitle = member.jobTitle || member.position || null;
                            
                            return `
                            <div class="member-item" style="background: rgba(255,255,255,0.5); padding: 10px; border-radius: 6px; margin-bottom: 8px;">
                              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                <strong style="font-size: 14px;">${memberName}</strong>
                                <span style="font-size: 12px; color: #666; font-weight: 600;">${allocatedHours}h</span>
                              </div>
                              <div style="font-size: 11px; color: #555; margin-top: 4px;">
                                ${jobTitle ? `
                                  <div style="margin-bottom: 4px;">
                                    <strong>Cargo:</strong> ${jobTitle}
                                  </div>
                                ` : ''}
                                ${investedValueFormatted ? `
                                  <div style="margin-top: 6px; padding: 6px; background: rgba(255, 255, 255, 0.94); border-radius: 4px; border-left: 3px solid rgba(255, 255, 255, 0.3);">
                                    <div style="font-size: 11px; color:rgb(0, 0, 0); font-weight: 600; margin-bottom: 2px;">
                                      <strong>Parte do salário aplicado no projeto:</strong> ${investedValueFormatted}
                                    </div>
                                  </div>
                                ` : ''}
                              </div>
                            </div>
                          `;
                          }
                        )
                        .join("");
                    })()
                  : '<span style="color: #888; font-style: italic; font-size: 13px;">Nenhum membro alocado</span>'
              }
            </div>
          </div>
        `;
        }
      )
      .join("");
      
      console.log("✅ HTML gerado. Tamanho:", htmlContent.length);
      console.log("✅ Primeiros 300 caracteres:", htmlContent.substring(0, 300));
      
      // Atribuir o HTML ao elemento
      teamsList.innerHTML = htmlContent;
      console.log("✅ HTML atribuído ao teamsList. innerHTML.length:", teamsList.innerHTML.length);
      console.log("✅ Elemento teamsList após atribuição:", teamsList);
      console.log("✅ Número de team-cards renderizados:", teamsList.querySelectorAll('.team-card').length);
      
      // Forçar reflow para garantir que o navegador renderize
      void teamsList.offsetHeight;
      
      // Adicionar event listeners para os botões "Ver todas" após renderizar
      setTimeout(() => {
        document.querySelectorAll(".show-all-skills-btn").forEach((btn) => {
          // Remover listener anterior se existir para evitar duplicação
          const newBtn = btn.cloneNode(true);
          btn.parentNode.replaceChild(newBtn, btn);
          
          newBtn.addEventListener("click", function() {
            const teamIdx = parseInt(this.getAttribute("data-team-idx"));
            // Buscar skills agregadas do team usando teamsWithMembers
            const team = window.teamsWithMembers?.[teamIdx];
            if (team && team.members) {
              const allSkills = [];
              const skillsMap = new Map();
              team.members.forEach(member => {
                if (member.skills && Array.isArray(member.skills)) {
                  member.skills.forEach(skill => {
                    // A skill pode ser um objeto com 'name' ou apenas uma string
                    const skillName = typeof skill === 'string' ? skill : (skill.name || skill.skillName || skill);
                    if (skillName && !skillsMap.has(skillName)) {
                      skillsMap.set(skillName, typeof skill === 'string' ? { name: skill } : skill);
                    }
                  });
                }
              });
              allSkills.push(...Array.from(skillsMap.values()));
              toggleAllSkills(teamIdx, { skills: allSkills });
            }
          });
        });
        
        // Adicionar event listeners para os botões de expandir/recolher equipe
        document.querySelectorAll(".toggle-team-btn").forEach((btn) => {
          const newBtn = btn.cloneNode(true);
          btn.parentNode.replaceChild(newBtn, btn);
          
          newBtn.addEventListener("click", function() {
            const teamIdx = parseInt(this.getAttribute("data-team-idx"));
            toggleTeamContent(teamIdx);
          });
        });
      }, 100);
    } else {
      console.warn("⚠️ Nenhuma squad encontrada ou array vazio");
      if (teamsList) {
        teamsList.innerHTML =
          '<div style="padding:16px; color:#888;">Nenhuma equipe cadastrada.</div>';
      } else {
        console.error("❌ ERRO: teamsList não existe para mostrar mensagem de 'nenhuma equipe'");
      }
    }
    
    resolve();
  });
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

// Função para alternar visualização de todas as skills
function toggleAllSkills(teamIdx, squadOrSkills) {
  const skillsList = document.getElementById(`skills-list-${teamIdx}`);
  const btn = document.querySelector(`button.show-all-skills-btn[data-team-idx="${teamIdx}"]`);
  const paginationDiv = btn?.parentElement;
  const countSpan = paginationDiv?.querySelector("span");
  
  // Aceitar tanto squad com skills quanto objeto direto com skills
  const skills = squadOrSkills.skills || squadOrSkills;
  
  if (!skillsList || !btn || !skills || !Array.isArray(skills)) return;
  
  const showingAll = btn.getAttribute("data-showing-all") === "true";
  
  // Função auxiliar para extrair o nome da skill
  const getSkillName = (skill) => {
    if (typeof skill === 'string') return skill;
    return skill.name || skill.skillName || 'N/A';
  };
  
  if (showingAll) {
    // Mostrar apenas 5
    skillsList.innerHTML = skills
      .slice(0, 5)
      .map((skill) => `<span class="skill">${getSkillName(skill)}</span>`)
      .join("");
    btn.textContent = `Ver todas (${skills.length})`;
    btn.setAttribute("data-showing-all", "false");
    if (countSpan) {
      countSpan.textContent = `Mostrando 5 de ${skills.length}`;
    }
  } else {
    // Mostrar todas
    skillsList.innerHTML = skills
      .map((skill) => `<span class="skill">${getSkillName(skill)}</span>`)
      .join("");
    btn.textContent = "Ver menos";
    btn.setAttribute("data-showing-all", "true");
    if (countSpan) {
      countSpan.textContent = `Mostrando todas (${skills.length})`;
    }
  }
}

// Função para expandir/recolher conteúdo da equipe
function toggleTeamContent(teamIdx) {
  // Apenas os membros devem ser expandidos/recolhidos, não as skills
  const teamMembers = document.querySelector(`.team-members.team-content-${teamIdx}`);
  const toggleBtn = document.querySelector(`.toggle-team-btn[data-team-idx="${teamIdx}"]`);
  const toggleIcon = document.querySelector(`.toggle-icon[data-team-idx="${teamIdx}"]`);
  
  if (!teamMembers) return;
  
  // Verificar se está expandido (display: block) ou recolhido (display: none)
  const isExpanded = teamMembers.style.display !== "none";
  
  if (isExpanded) {
    // Recolher - esconder apenas os membros
    teamMembers.style.display = "none";
  } else {
    // Expandir - mostrar os membros
    teamMembers.style.display = "block";
  }
  
  // Atualizar ícone
  if (toggleIcon) {
    toggleIcon.textContent = isExpanded ? "▶" : "▼";
    toggleIcon.style.transform = isExpanded ? "rotate(-90deg)" : "rotate(0deg)";
  }
}

// Função para buscar membros e skills
function filterTeamsBySearch(searchText) {
  if (!searchText || searchText.trim() === "") {
    // Mostrar todos os cards
    document.querySelectorAll(".team-card").forEach(card => {
      card.style.display = "block";
    });
    document.querySelectorAll(".member-item").forEach(item => {
      item.style.display = "block";
    });
    return;
  }
  
  const searchLower = searchText.toLowerCase().trim();
  const teamCards = document.querySelectorAll(".team-card");
  
  teamCards.forEach(card => {
    let hasMatch = false;
    
    // Buscar nos membros
    const memberItems = card.querySelectorAll(".member-item");
    memberItems.forEach(member => {
      const memberName = member.querySelector("strong")?.textContent?.toLowerCase() || "";
      const memberJobTitle = member.textContent?.toLowerCase() || "";
      const matches = memberName.includes(searchLower) || memberJobTitle.includes(searchLower);
      
      if (matches) {
        hasMatch = true;
        member.style.display = "block";
      } else {
        member.style.display = "none";
      }
    });
    
    // Buscar nas skills
    const skills = card.querySelectorAll(".skill");
    skills.forEach(skill => {
      const skillName = skill.textContent?.toLowerCase() || "";
      if (skillName.includes(searchLower)) {
        hasMatch = true;
      }
    });
    
    // Mostrar/ocultar card baseado em matches
    if (hasMatch) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  showSkeletonDetail();
  setTimeout(() => {
    renderProjectDetail();
  }, 0);
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
  
  // Busca de membros e skills
  const teamSearch = document.getElementById("team-search");
  const clearTeamSearch = document.getElementById("clear-team-search");
  
  let searchTimeout;
  if (teamSearch) {
    teamSearch.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        filterTeamsBySearch(teamSearch.value);
      }, 300);
    });
  }
  
  if (clearTeamSearch) {
    clearTeamSearch.addEventListener("click", () => {
      if (teamSearch) teamSearch.value = "";
      filterTeamsBySearch("");
    });
  }
});

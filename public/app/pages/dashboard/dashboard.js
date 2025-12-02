import { apiService } from "../../../assets/js/apiService.js";
import { getCurrentAccessLevel, applyAccessControl, requireAuth, requireAccess } from "../../../assets/js/permissions.js";

// Estado global
let dashboardData = {
  projects: [],
  squads: [],
  collaborators: [],
  allocations: [],
  skills: [],
  currentTimeFilter: "month",
  currentSquadFilter: "all",
  userRole: "manager", // "manager" ou "collaborator"
  userId: null,
};

// Estado de paginação
let paginationState = {
  topSquads: { currentPage: 1, itemsPerPage: 5 },
  idleSquads: { currentPage: 1, itemsPerPage: 5 },
  overloadSquads: { currentPage: 1, itemsPerPage: 5 },
  collaborators: { currentPage: 1, itemsPerPage: 5 },
  marketSkills: { currentPage: 1, itemsPerPage: 5 },
  employeeSkills: { currentPage: 1, itemsPerPage: 5 },
  collabProjects: { currentPage: 1, itemsPerPage: 5 },
  collabSquads: { currentPage: 1, itemsPerPage: 10 },
};

// Verificar se Chart.js está carregado
if (typeof Chart === 'undefined') {
  console.error("❌ Chart.js não está carregado!");
} else {
  console.log("✅ Chart.js versão:", Chart.version);
}

// Inicialização
document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM Carregado - Iniciando dashboard");
  
  // Verificar autenticação
  if (!requireAuth()) {
    return; // Redireciona para login
  }
  
  // Verificar acesso ao dashboard
  // Níveis 1 e 2: dashboard de gestão
  // Nível 3: dashboard de colaborador
  const accessLevel = getCurrentAccessLevel();
  // Removido redirecionamento - agora nível 3 tem acesso à dashboard de colaborador
  
  // Verificar novamente se Chart.js está disponível
  if (typeof Chart === 'undefined') {
    console.error("❌ Chart.js não está disponível no DOMContentLoaded");
    alert("Erro: Chart.js não carregou. Verifique sua conexão com a internet.");
    return;
  }
  
  await initializeDashboard();
});

// Garantir que as abas funcionem mesmo se houver erro
window.addEventListener("load", () => {
  console.log("Window Load - Verificando abas");
  setTimeout(() => {
    const tabButtons = document.querySelectorAll(".tab-button");
    if (tabButtons.length > 0 && !tabButtons[0].hasAttribute("data-tabs-setup")) {
      console.log("Configurando abas no window.load");
      setupTabs();
      tabButtons.forEach(btn => btn.setAttribute("data-tabs-setup", "true"));
    }
  }, 200);
});

async function initializeDashboard() {
  try {
    // Garantir que o loader seja escondido e o conteúdo principal seja mostrado
    const loader = document.getElementById("loader");
    const mainContent = document.getElementById("main-content");
    if (loader) loader.classList.add("hidden");
    if (mainContent) mainContent.classList.remove("hidden");

    // Detectar tipo de usuário baseado no access_level do token
    const accessLevel = getCurrentAccessLevel();
    
    // DEFINIR userId ANTES de qualquer coisa
    dashboardData.userId = localStorage.getItem("userId");
    console.log("🔑 userId definido:", dashboardData.userId);
    
    // Se não houver userId, tentar usar o primeiro colaborador disponível (para testes)
    if (!dashboardData.userId && accessLevel === 3) {
      console.warn("⚠️ userId não encontrado no localStorage, será definido após carregar dados");
    }
    
    // Usa o access_level do token para determinar o role
    dashboardData.userRole = determineUserRole(accessLevel);
    console.log("👤 userRole:", dashboardData.userRole);

    // Aplicar controle de acesso aos elementos da página
    applyAccessControl();

    // Carregar dados
    await loadAllData();
    
    // Se ainda não tiver userId e for colaborador, usar o primeiro colaborador
    if (!dashboardData.userId && dashboardData.userRole === "collaborator" && dashboardData.collaborators.length > 0) {
      dashboardData.userId = dashboardData.collaborators[0].id;
      localStorage.setItem("userId", dashboardData.userId);
      console.log("✅ userId definido como primeiro colaborador:", dashboardData.userId);
    }

    // Configurar filtros
    setupFilters();

    // Renderizar dashboard apropriado
    if (dashboardData.userRole === "manager") {
      renderManagerDashboard();
    } else {
      renderCollaboratorDashboard();
    }
    
    // Garantir que o filtro de squad esteja oculto para colaboradores na inicialização
    if (dashboardData.userRole === "collaborator") {
      const squadFilterGroup = document.getElementById("squadFilterGroup");
      if (squadFilterGroup) {
        squadFilterGroup.style.display = "none";
      }
    }

    // Configurar eventos
    setupEventListeners();
    
    // Configurar tooltips
    setTimeout(() => {
      setupInfoTooltips();
    }, 200);
  } catch (error) {
    console.error("Erro ao inicializar dashboard:", error);
    // Mesmo com erro, garantir que o conteúdo seja mostrado
    const loader = document.getElementById("loader");
    const mainContent = document.getElementById("main-content");
    if (loader) loader.classList.add("hidden");
    if (mainContent) mainContent.classList.remove("hidden");
  } finally {
    // Sempre configurar abas, mesmo se houver erro
    setTimeout(() => {
      setupTabs();
    }, 100);
  }
}

// Configurar sistema de abas
function setupTabs() {
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  console.log("Setup Tabs - Botões encontrados:", tabButtons.length);
  console.log("Setup Tabs - Conteúdos encontrados:", tabContents.length);

  if (tabButtons.length === 0) {
    console.error("Nenhum botão de aba encontrado!");
    return;
  }

  tabButtons.forEach((button, index) => {
    console.log(`Botão ${index}:`, button.getAttribute("data-tab"));
    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const targetTab = button.getAttribute("data-tab");
      console.log("Aba clicada:", targetTab);

      // Remover active de todos
      tabButtons.forEach(btn => btn.classList.remove("active"));
      tabContents.forEach(content => content.classList.remove("active"));

      // Adicionar active no selecionado
      button.classList.add("active");
      const targetContent = document.getElementById(`tab-${targetTab}`);
      if (targetContent) {
        targetContent.classList.add("active");
        console.log("Conteúdo ativado:", `tab-${targetTab}`);
        
        // Atualizar gráficos da aba ativa
        setTimeout(() => {
          updateChartsForTab(targetTab);
        }, 100);
      } else {
        console.error("Conteúdo não encontrado:", `tab-${targetTab}`);
      }
    });
  });

  // Inicializar a primeira aba se nenhuma estiver ativa
  let activeTab = document.querySelector(".tab-button.active");
  if (!activeTab && tabButtons.length > 0) {
    // Se for dashboard do colaborador, ativar a aba "Indicadores"
    const collaboratorDashboard = document.getElementById("collaborator-dashboard");
    if (collaboratorDashboard && !collaboratorDashboard.classList.contains("hidden")) {
      const indicatorsTab = Array.from(tabButtons).find(btn => btn.getAttribute("data-tab") === "indicators");
      if (indicatorsTab) {
        console.log("Dashboard do colaborador detectado, ativando aba Indicadores");
        activeTab = indicatorsTab;
      } else {
        activeTab = tabButtons[0];
      }
    } else {
      activeTab = tabButtons[0];
    }
    activeTab.classList.add("active");
    const firstTab = activeTab.getAttribute("data-tab");
    const firstContent = document.getElementById(`tab-${firstTab}`);
    if (firstContent) {
      firstContent.classList.add("active");
    }
  }

  if (activeTab) {
    const initialTab = activeTab.getAttribute("data-tab");
    console.log("Inicializando aba ativa:", initialTab);
    setTimeout(() => {
      updateChartsForTab(initialTab);
      setupInfoTooltips(); // Recriar tooltips após atualizar abas
    }, 200);
  }
  
  // Garantir que tooltips sejam criados
  setTimeout(() => {
    setupInfoTooltips();
  }, 300);
}

// Criar gráfico de teste simples
function createTestChart() {
  console.log("🧪 Criando gráfico de teste...");
  const ctx = document.getElementById("costDeviationChart");
  if (!ctx) {
    console.error("Canvas não encontrado para teste");
    return;
  }
  
  try {
    const testChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Squad A', 'Squad B', 'Squad C'],
        datasets: [{
          label: 'Teste',
          data: [12000, -5000, 8000],
          backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(75, 192, 192, 0.6)', 'rgba(255, 26, 240, 0.6)'],
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
    console.log("✅ Gráfico de teste criado com sucesso!", testChart);
  } catch (error) {
    console.error("❌ Erro ao criar gráfico de teste:", error);
  }
}

// Atualizar gráficos específicos de cada aba
function updateChartsForTab(tabName) {
  console.log("Atualizando gráficos para aba:", tabName);
  
  switch (tabName) {
    case "overview":
      // Visão geral não tem mais KPIs nem gráficos
      console.log("Aba Overview - sem gráficos");
      break;
    case "costs":
      console.log("Atualizando aba de Custos");
      // Atualizar KPIs de custos
      updateCostKPIs();
      setTimeout(() => {
        updateCostDeviationChart();
        updateCostAllocatedChart();
      }, 50);
      break;
    case "allocation":
      console.log("Atualizando aba de Alocação");
      // Atualizar KPIs de alocação
      updateAllocationKPIs();
      setTimeout(() => {
        updateAllocationDistributionChart();
        updateOverloadIdleComparisonChart();
        updateWorkloadDistributionChart();
      }, 50);
      break;
    case "competencies":
      console.log("Atualizando aba de Competências");
      // Atualizar KPIs de certificados
      updateCompetenciesKPIs();
      setTimeout(() => {
        updateSkillsChart();
        updateSeniorityChart();
        updateSkillsHeatmapChart();
      }, 50);
      break;
    case "analysis":
      console.log("Atualizando aba de Análises");
      setTimeout(() => {
        updateStrategicViewChart();
        updateAllTables();
      }, 50);
      break;
    // Abas do Dashboard do Colaborador
    case "indicators":
      console.log("Atualizando aba de Indicadores do Colaborador");
      updateCollaboratorKPIs();
      break;
    case "workload":
      console.log("Atualizando aba de Carga Horária");
      setTimeout(() => {
        updateCollaboratorWorkloadCharts();
      }, 50);
      break;
    case "projects":
      console.log("Atualizando aba de Projetos");
      setTimeout(() => {
        updateCollaboratorProjectsComparisonChart();
        updateCollaboratorProjectsTable();
      }, 50);
      break;
    case "squads":
      console.log("Atualizando aba de Squads");
      setTimeout(() => {
        updateCollaboratorSquadsComparisonChart();
        updateCollaboratorSquadsTable();
      }, 50);
      break;
  }
}

function determineUserRole(accessLevel = null) {
  // Se não foi passado, tenta obter do token
  if (!accessLevel) {
    accessLevel = getCurrentAccessLevel();
  }
  
  // Converte para número se necessário
  const numLevel = Number(accessLevel);
  
  // Mapeia access_level numérico para role do dashboard
  // 1 ou 2 = manager, 3 = collaborator
  if (numLevel === 1 || numLevel === 2) {
    return 'manager';
  } else if (numLevel === 3) {
    return 'collaborator';
  }
  
  // Padrão: collaborator se não reconhecer o nível
  return 'collaborator';
}

// Função para gerar dados mockados
function generateMockData() {
  // Obter userId ANTES de gerar dados
  const currentUserId = localStorage.getItem("userId");
  const targetUserId = currentUserId ? parseInt(currentUserId) : 1; // Usar ID 1 como padrão se não houver
  
  console.log("🎲 Gerando dados mockados para userId:", targetUserId);
  
  const mockSquads = [
    { id: 1, name: "Backend Team Alpha" },
    { id: 2, name: "Frontend Squad Beta" },
    { id: 3, name: "DevOps Team Gamma" },
    { id: 4, name: "QA Team Delta" },
    { id: 5, name: "Mobile Squad Epsilon" },
    { id: 6, name: "Data Science Team" },
  ];

  const mockSkills = [
    { id: 1, name: "JavaScript" },
    { id: 2, name: "Python" },
    { id: 3, name: "Java" },
    { id: 4, name: "React" },
    { id: 5, name: "Node.js" },
    { id: 6, name: "Docker" },
    { id: 7, name: "Kubernetes" },
    { id: 8, name: "AWS" },
    { id: 9, name: "TypeScript" },
    { id: 10, name: "SQL" },
  ];

  const jobTitles = [
    "Desenvolvedor Júnior",
    "Desenvolvedor Pleno",
    "Desenvolvedor Sênior",
    "Tech Lead",
    "Arquiteto de Software",
    "DevOps Engineer",
    "QA Engineer",
    "Data Scientist",
  ];

  const mockCollaborators = [];
  for (let i = 1; i <= 45; i++) {
    const jobTitle = jobTitles[Math.floor(Math.random() * jobTitles.length)];
    const workHours = 40;
    const salary = 5000 + Math.random() * 15000;
    const hourlyCost = salary / (workHours * 4.33);
    
    // Gerar skills aleatórias
    const numSkills = Math.floor(Math.random() * 5) + 2;
    const collabSkills = [];
    const usedSkillIds = new Set();
    for (let j = 0; j < numSkills; j++) {
      let skillId;
      do {
        skillId = Math.floor(Math.random() * mockSkills.length) + 1;
      } while (usedSkillIds.has(skillId));
      usedSkillIds.add(skillId);
      collabSkills.push({
        id: skillId,
        name: mockSkills.find(s => s.id === skillId)?.name,
        lastUsed: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    // Gerar certificados para alguns colaboradores
    const certificates = [];
    if (Math.random() > 0.5) {
      const certNames = ["AWS Certified", "Scrum Master", "Kubernetes Admin", "Docker Certified"];
      const certName = certNames[Math.floor(Math.random() * certNames.length)];
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + Math.floor(Math.random() * 60) - 10);
      certificates.push({
        name: certName,
        expirationDate: expirationDate.toISOString(),
        uploadDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    mockCollaborators.push({
      id: i,
      name: `Colaborador ${i}`,
      jobTitle,
      workHoursPerWeek: workHours,
      salary,
      hourlyCost,
      skills: collabSkills,
      certificates,
      activeEmployee: Math.random() > 0.1,
      departament: { name: ["Desenvolvimento", "QA", "DevOps", "Data"][Math.floor(Math.random() * 4)] },
    });
  }

  const projectNames = [
    "Sistema de Gestão Financeira",
    "Plataforma E-commerce",
    "App Mobile de Delivery",
    "Dashboard Analytics",
    "API de Integração",
    "Sistema de CRM",
    "Plataforma de E-learning",
    "App de Fitness",
    "Sistema de Vendas",
    "Plataforma de Streaming",
    "Sistema de RH",
    "App de Turismo",
  ];

  // REGRA DE NEGÓCIO: Um projeto pode ter vários squads, mas um squad só pode ter um projeto
  // Primeiro criar os projetos
  const mockProjects = [];
  const now = Date.now();
  const numProjects = 6; // Criar menos projetos para que cada um tenha vários squads
  
  for (let i = 1; i <= numProjects; i++) {
    const budget = 50000 + Math.random() * 200000;
    const spent = budget * (0.7 + Math.random() * 0.4); // 70% a 110% do budget
    const statuses = ["EM_ANDAMENTO", "PLANEJAMENTO", "EM_ANDAMENTO", "EM_ANDAMENTO"];
    
    // Garantir que alguns projetos são recentes (última semana/mês)
    let daysAgo;
    if (i <= 2) {
      // Primeiros 2 projetos: nos últimos 7 dias
      daysAgo = Math.random() * 7;
    } else if (i <= 4) {
      // Próximos 2: no último mês
      daysAgo = 7 + Math.random() * 23;
    } else {
      // Restantes: distribuídos nos últimos 6 meses
      daysAgo = 30 + Math.random() * 150;
    }
    
    const startDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
    
    mockProjects.push({
      id: i,
      name: projectNames[i - 1] || `Projeto ${i}`,
      budget,
      estimatedCost: budget,
      spentCost: spent,
      actualCost: spent,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      // Não definir squadId aqui - será feito depois
      startDate: startDate.toISOString(),
      createdAt: startDate.toISOString(),
    });
  }
  
  // Agora atribuir cada squad a um único projeto
  // Distribuir os squads entre os projetos (alguns projetos terão múltiplos squads)
  const squadsPerProject = Math.ceil(mockSquads.length / mockProjects.length);
  mockSquads.forEach((squad, squadIdx) => {
    // Atribuir cada squad a um projeto (distribuindo de forma equilibrada)
    const projectIndex = Math.floor(squadIdx / squadsPerProject);
    const assignedProject = mockProjects[projectIndex] || mockProjects[0];
    squad.projectId = assignedProject.id;
  });

  const mockAllocations = [];
  // Distribuir colaboradores pelos squads de forma mais realista
  const squadSizes = [8, 7, 6, 6, 5, 4]; // Tamanhos aproximados dos squads
  let collabIndex = 0;
  
  mockSquads.forEach((squad, squadIdx) => {
    const squadSize = squadSizes[squadIdx] || 5;
    for (let i = 0; i < squadSize && collabIndex < mockCollaborators.length; i++) {
      const collab = mockCollaborators[collabIndex];
      const baseHours = collab.workHoursPerWeek;
      // Alguns colaboradores têm sobrecarga, outros ociosidade
      const allocationFactor = 0.7 + Math.random() * 0.6; // 70% a 130%
      const hours = baseHours * allocationFactor;
      
      // Garantir que a maioria das alocações são recentes (últimos 30 dias para melhor visibilidade)
      const daysAgo = Math.random() * 30; // Últimos 30 dias
      const startDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000);

      mockAllocations.push({
        id: mockAllocations.length + 1,
        employeeId: collab.id,
        squadId: squad.id,
        hours: Math.round(hours),
        startDate: startDate.toISOString(),
        date: startDate.toISOString(),
      });
      collabIndex++;
    }
  });

  // GARANTIR DADOS SUFICIENTES PARA O COLABORADOR LOGADO
  // Se o colaborador logado existe, garantir que ele tenha EXATAMENTE 2 squads e 3 projetos
  const targetCollab = mockCollaborators.find(c => c.id === targetUserId);
  console.log("🔍 Procurando colaborador com ID:", targetUserId, "Encontrado:", !!targetCollab);
  
  if (targetCollab) {
    // Garantir que o colaborador logado está em EXATAMENTE 2 squads diferentes
    const selectedSquads = [];
    const availableSquads = [...mockSquads];
    
    // Selecionar exatamente 2 squads
    while (selectedSquads.length < 2 && availableSquads.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableSquads.length);
      const randomSquad = availableSquads[randomIndex];
      selectedSquads.push(randomSquad);
      availableSquads.splice(randomIndex, 1); // Remover para não repetir
    }

    console.log(`✅ Selecionados ${selectedSquads.length} squads para o colaborador ${targetUserId}:`, selectedSquads.map(s => s.name));

    // Criar alocações para o colaborador logado nos 2 squads
    selectedSquads.forEach((squad, idx) => {
      // Distribuir horas entre os 2 squads (60% no primeiro, 40% no segundo)
      const hoursPerSquad = idx === 0 
        ? Math.round(targetCollab.workHoursPerWeek * 0.6) // 60% no primeiro squad (24h)
        : Math.round(targetCollab.workHoursPerWeek * 0.4); // 40% no segundo squad (16h)
      
      // Garantir que as alocações são recentes (últimos 30 dias)
      const daysAgo = Math.random() * 30;
      const startDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000);

      const allocation = {
        id: mockAllocations.length + 1,
        employeeId: targetUserId,
        squadId: squad.id,
        hours: hoursPerSquad,
        startDate: startDate.toISOString(),
        date: startDate.toISOString(),
      };
      
      mockAllocations.push(allocation);
      console.log(`✅ Alocação criada para colaborador ${targetUserId} no squad ${squad.name}: ${hoursPerSquad}h`);
    });

    // REGRA DE NEGÓCIO: Um squad só pode ter um projeto
    // Garantir que os squads do colaborador tenham projetos atribuídos
    // Se os squads selecionados ainda não têm projetos, criar novos projetos para eles
    selectedSquads.forEach((squad, squadIdx) => {
      // Verificar se o squad já tem um projeto atribuído
      if (!squad.projectId) {
        // Criar um novo projeto para este squad
        const projectIndex = mockProjects.length + 1;
        const daysAgo = Math.random() * 30;
        const startDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
        
        const projectName = projectNames[(projectIndex - 1) % projectNames.length] || `Projeto ${projectIndex}`;
        
        const newProject = {
          id: projectIndex,
          name: projectName,
          budget: 50000 + Math.random() * 200000,
          estimatedCost: 50000 + Math.random() * 200000,
          spentCost: (50000 + Math.random() * 200000) * (0.7 + Math.random() * 0.4),
          actualCost: (50000 + Math.random() * 200000) * (0.7 + Math.random() * 0.4),
          status: ["EM_ANDAMENTO", "PLANEJAMENTO"][Math.floor(Math.random() * 2)],
          startDate: startDate.toISOString(),
          createdAt: startDate.toISOString(),
        };
        
        mockProjects.push(newProject);
        squad.projectId = newProject.id;
        console.log(`✅ Projeto criado: ${projectName} atribuído ao squad ${squad.name}`);
      } else {
        console.log(`✅ Squad ${squad.name} já tem projeto atribuído (ID: ${squad.projectId})`);
      }
    });
  }

  // Adicionar algumas alocações extras (colaboradores em múltiplos squads)
  for (let i = 0; i < 10; i++) {
    const collab = mockCollaborators[Math.floor(Math.random() * mockCollaborators.length)];
    const squad = mockSquads[Math.floor(Math.random() * mockSquads.length)];
    const hours = Math.round(collab.workHoursPerWeek * (0.2 + Math.random() * 0.3)); // 20% a 50% de horas extras
    
    // Alocações extras também nos últimos 30 dias
    const daysAgo = Math.random() * 30;
    const startDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000);

    mockAllocations.push({
      id: mockAllocations.length + 1,
      employeeId: collab.id,
      squadId: squad.id,
      hours,
      startDate: startDate.toISOString(),
      date: startDate.toISOString(),
    });
  }

  return {
    squads: mockSquads,
    collaborators: mockCollaborators,
    projects: mockProjects,
    skills: mockSkills,
    allocations: mockAllocations,
  };
}

async function loadAllData() {
  try {
    // Garantir que userId está definido antes de gerar dados mockados
    if (!dashboardData.userId) {
      dashboardData.userId = localStorage.getItem("userId");
    }
    
    let projects, squads, collaborators, skills;
    
    try {
      [projects, squads, collaborators, skills] = await Promise.all([
        apiService.getAllProjects(),
        apiService.getAllSquads(),
        apiService.getCollaborators(),
        apiService.getSkills(),
      ]);
    } catch (error) {
      console.warn("Erro ao carregar dados da API, usando dados mockados:", error);
    }

    // Se não houver dados suficientes, usar dados mockados
    const hasEnoughData = 
      Array.isArray(projects) && projects.length >= 5 &&
      Array.isArray(squads) && squads.length >= 3 &&
      Array.isArray(collaborators) && collaborators.length >= 10;

    if (!hasEnoughData) {
      console.log("Usando dados mockados para demonstração");
      const mockData = generateMockData();
      dashboardData.projects = mockData.projects;
      dashboardData.squads = mockData.squads;
      dashboardData.collaborators = mockData.collaborators;
      dashboardData.skills = mockData.skills;
      dashboardData.allocations = mockData.allocations;
      
      console.log("✅ Dados mockados carregados:");
      console.log("  - Projetos:", dashboardData.projects.length);
      console.log("  - Squads:", dashboardData.squads.length);
      console.log("  - Colaboradores:", dashboardData.collaborators.length);
      console.log("  - Skills:", dashboardData.skills.length);
      console.log("  - Alocações:", dashboardData.allocations.length);
      
      // Se não houver userId e for colaborador, usar o primeiro colaborador
      if (!dashboardData.userId && dashboardData.userRole === "collaborator" && dashboardData.collaborators.length > 0) {
        dashboardData.userId = dashboardData.collaborators[0].id;
        localStorage.setItem("userId", dashboardData.userId);
        console.log("✅ userId definido como primeiro colaborador:", dashboardData.userId);
      }
      
      // Log específico para colaborador logado
      if (dashboardData.userId) {
        const userAllocations = dashboardData.allocations.filter(a => 
          String(a.employeeId) === String(dashboardData.userId)
        );
        const userSquads = [...new Set(userAllocations.map(a => a.squadId))];
        // REGRA DE NEGÓCIO: Buscar projetos através do projectId dos squads
        const userSquadObjects = dashboardData.squads.filter(s => userSquads.includes(s.id));
        const userProjectIds = [...new Set(userSquadObjects.map(s => s.projectId).filter(id => id != null))];
        const userProjects = dashboardData.projects.filter(p => 
          userProjectIds.includes(p.id)
        );
        console.log(`📊 Dados do colaborador (ID: ${dashboardData.userId}):`);
        console.log("  - Alocações:", userAllocations.length);
        console.log("  - Squads:", userSquads.length);
        console.log("  - Projetos:", userProjects.length);
        console.log("  - Total de horas:", userAllocations.reduce((sum, a) => sum + (a.hours || 0), 0));
        
        // Se não houver dados para o colaborador, criar agora (2 squads e 3 projetos)
        if (userAllocations.length === 0) {
          console.log("⚠️ Nenhuma alocação encontrada para o colaborador, criando alocações...");
          const targetCollab = dashboardData.collaborators.find(c => String(c.id) === String(dashboardData.userId));
          if (targetCollab) {
            // Selecionar exatamente 2 squads
            const selectedSquads = dashboardData.squads.slice(0, Math.min(2, dashboardData.squads.length));
            
            // Criar alocações nos 2 squads
            selectedSquads.forEach((squad, idx) => {
              const hours = idx === 0 ? 24 : 16; // 24h no primeiro, 16h no segundo
              const daysAgo = Math.random() * 30;
              const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
              
              dashboardData.allocations.push({
                id: dashboardData.allocations.length + 1,
                employeeId: dashboardData.userId,
                squadId: squad.id,
                hours: hours,
                startDate: startDate.toISOString(),
                date: startDate.toISOString(),
              });
              console.log(`✅ Alocação criada: ${hours}h no squad ${squad.name}`);
            });
            
            // REGRA DE NEGÓCIO: Um squad só pode ter um projeto
            // Criar um projeto para cada squad selecionado
            const projectNames = [
              "Sistema de Gestão Financeira",
              "Plataforma E-commerce",
              "App Mobile de Delivery",
              "Dashboard Analytics",
              "API de Integração",
            ];
            
            selectedSquads.forEach((squad, squadIdx) => {
              // Verificar se o squad já tem um projeto atribuído
              if (!squad.projectId) {
                const projectIndex = dashboardData.projects.length + 1;
                const daysAgo = Math.random() * 30;
                const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
                
                const newProject = {
                  id: projectIndex,
                  name: projectNames[(projectIndex - 1) % projectNames.length] || `Projeto ${projectIndex}`,
                  budget: 50000 + Math.random() * 200000,
                  estimatedCost: 50000 + Math.random() * 200000,
                  spentCost: (50000 + Math.random() * 200000) * (0.7 + Math.random() * 0.4),
                  actualCost: (50000 + Math.random() * 200000) * (0.7 + Math.random() * 0.4),
                  status: ["EM_ANDAMENTO", "PLANEJAMENTO"][Math.floor(Math.random() * 2)],
                  startDate: startDate.toISOString(),
                  createdAt: startDate.toISOString(),
                };
                
                dashboardData.projects.push(newProject);
                squad.projectId = newProject.id;
                console.log(`✅ Projeto criado e atribuído ao squad ${squad.name}`);
              } else {
                console.log(`✅ Squad ${squad.name} já tem projeto atribuído (ID: ${squad.projectId})`);
              }
            });
            
            console.log(`✅ Criados projetos para ${selectedSquads.length} squads do colaborador ${dashboardData.userId}`);
          }
        }
      }
    } else {
      dashboardData.projects = Array.isArray(projects) ? projects : [];
      dashboardData.squads = Array.isArray(squads) ? squads : [];
      dashboardData.collaborators = Array.isArray(collaborators) ? collaborators : [];
      dashboardData.skills = Array.isArray(skills) ? skills : [];

      // Carregar alocações para cada squad
      dashboardData.allocations = [];
      if (Array.isArray(dashboardData.squads)) {
        for (const squad of dashboardData.squads) {
          try {
            if (squad && squad.id) {
              const allocations = await apiService.getSquadAllocations(squad.id);
              if (allocations && Array.isArray(allocations)) {
                dashboardData.allocations.push(...allocations.map(a => ({ ...a, squadId: squad.id })));
              }
            }
          } catch (err) {
            console.warn(`Erro ao carregar alocações do squad ${squad?.id}:`, err);
          }
        }
      }

      // Se não houver alocações suficientes, usar mockadas
      if (dashboardData.allocations.length < 10) {
        const mockData = generateMockData();
        const currentUserId = localStorage.getItem("userId");
        const targetUserId = currentUserId ? parseInt(currentUserId) : null;
        
        // Garantir que o colaborador logado tenha alocações
        if (targetUserId) {
          const userAllocations = mockData.allocations.filter(a => a.employeeId === targetUserId);
          if (userAllocations.length === 0) {
            // Criar alocações para o colaborador logado
            const selectedSquads = dashboardData.squads.slice(0, Math.min(3, dashboardData.squads.length));
            selectedSquads.forEach((squad, idx) => {
              const hours = idx === 0 ? 24 : 8 + Math.floor(Math.random() * 8);
              const daysAgo = Math.random() * 30;
              const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
              
              mockData.allocations.push({
                id: mockData.allocations.length + 1,
                employeeId: targetUserId,
                squadId: squad.id,
                hours: hours,
                startDate: startDate.toISOString(),
                date: startDate.toISOString(),
              });
            });
          }
        }
        
        dashboardData.allocations = mockData.allocations.map(a => ({
          ...a,
          employeeId: dashboardData.collaborators.find(c => String(c.id) === String(a.employeeId))?.id || a.employeeId,
          squadId: dashboardData.squads.find(s => String(s.id) === String(a.squadId))?.id || a.squadId,
        }));
      }
    }
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    // Em caso de erro, usar dados mockados
    // Garantir que userId está definido
    if (!dashboardData.userId) {
      dashboardData.userId = localStorage.getItem("userId");
    }
    
    const mockData = generateMockData();
    dashboardData.projects = mockData.projects;
    dashboardData.squads = mockData.squads;
    dashboardData.collaborators = mockData.collaborators;
    dashboardData.skills = mockData.skills;
    dashboardData.allocations = mockData.allocations;
    
    // Log para debug
    if (dashboardData.userId) {
      const userAllocations = dashboardData.allocations.filter(a => 
        String(a.employeeId) === String(dashboardData.userId)
      );
      console.log(`📊 Dados mockados do colaborador (ID: ${dashboardData.userId}):`, {
        allocations: userAllocations.length,
        totalHours: userAllocations.reduce((sum, a) => sum + (a.hours || 0), 0),
        squads: [...new Set(userAllocations.map(a => a.squadId))].length
      });
    }
  }
}

function setupFilters() {
  // Popular filtro de squads
  const squadFilter = document.getElementById("squadFilter");
  const costDeviationSquadFilter = document.getElementById("costDeviationSquadFilter");
  const costAllocatedSquadFilter = document.getElementById("costAllocatedSquadFilter");
  const strategicSquadFilter = document.getElementById("strategicSquadFilter");

  [squadFilter, costDeviationSquadFilter, costAllocatedSquadFilter, strategicSquadFilter].forEach(select => {
    if (select) {
      select.innerHTML = '<option value="all">Todos os Squads</option>';
      if (Array.isArray(dashboardData.squads)) {
        dashboardData.squads.forEach(squad => {
          if (squad && squad.id) {
            const option = document.createElement("option");
            option.value = squad.id;
            option.textContent = squad.name || `Squad ${squad.id}`;
            select.appendChild(option);
          }
        });
      }
    }
  });

  // Popular filtro de skills
  const skillsFilter = document.getElementById("skillsFilter");
  if (skillsFilter) {
    skillsFilter.innerHTML = '<option value="all">Todas as Skills</option>';
    if (Array.isArray(dashboardData.skills)) {
      dashboardData.skills.forEach(skill => {
        if (skill && (skill.id || skill.name)) {
          const option = document.createElement("option");
          option.value = skill.id || skill.name;
          option.textContent = skill.name || skill.id;
          skillsFilter.appendChild(option);
        }
      });
    }
  }
}

// Inicializar tooltips dos ícones de informação
function setupInfoTooltips() {
  // Configurar tooltips para gráficos (mantém o sistema antigo)
  const infoIcons = document.querySelectorAll('.info-icon[data-tooltip]');
  
  infoIcons.forEach(icon => {
    const tooltipText = icon.getAttribute('data-tooltip');
    if (!tooltipText) return;
    
    // Verificar se já tem tooltip associado
    if (icon.dataset.tooltipInitialized) return;
    icon.dataset.tooltipInitialized = 'true';
    
    // Verificar se é um KPI (ícone dentro de um card com kpi-header)
    const isKPI = icon.closest('.kpi-header') !== null;
    
    // Adicionar classe para identificar tooltips de KPI
    if (isKPI) {
      icon.classList.add('kpi-tooltip');
    }
    
    // Função para atualizar posição dos tooltips CSS (::after e ::before)
    const updateTooltipPosition = () => {
      const rect = icon.getBoundingClientRect();
      const card = icon.closest('.card');
      if (!card) return;
      
      const cardRect = card.getBoundingClientRect();
      
      // Criar um elemento temporário para medir o tooltip
      const tempTooltip = document.createElement('div');
      tempTooltip.className = 'info-tooltip';
      tempTooltip.style.position = 'fixed';
      tempTooltip.style.visibility = 'hidden';
      tempTooltip.style.opacity = '0';
      tempTooltip.style.left = '-9999px';
      tempTooltip.style.top = '-9999px';
      tempTooltip.style.display = 'block';
      tempTooltip.style.width = '250px';
      tempTooltip.innerHTML = tooltipText.replace(/&#10;/g, '<br>');
      document.body.appendChild(tempTooltip);
      
      // Forçar cálculo de dimensões
      const tooltipHeight = tempTooltip.offsetHeight || 150;
      const tooltipWidth = tempTooltip.offsetWidth || 250;
      document.body.removeChild(tempTooltip);
      
      let centerX, topY, arrowTop;
      
      if (isKPI) {
        // Para KPIs: centralizar no meio do card
        centerX = cardRect.left + (cardRect.width / 2);
        topY = cardRect.top + (cardRect.height / 2) - (tooltipHeight / 2);
        
        // Garantir que não saia do card (com margem de segurança)
        const margin = 10;
        if (topY < cardRect.top + margin) {
          topY = cardRect.top + margin;
        }
        if (topY + tooltipHeight > cardRect.bottom - margin) {
          topY = cardRect.bottom - tooltipHeight - margin;
        }
        
        // Seta apontando para cima (para o ícone no topo) - posicionar no topo do tooltip
        arrowTop = topY - 6; // 6px acima do tooltip (tamanho da seta)
      } else {
        // Para outros tooltips: acima do ícone
        centerX = rect.left + rect.width / 2;
        topY = cardRect.top - tooltipHeight - 20; // 20px de espaço acima
        
        // Verificar se cabe acima, se não, mostrar abaixo
        if (topY < 10) {
          topY = cardRect.bottom + 20;
          arrowTop = topY - 6; // Seta apontando para cima quando tooltip está abaixo
        } else {
          arrowTop = topY + tooltipHeight; // Seta apontando para baixo quando tooltip está acima
        }
      }
      
      // Aplicar posição usando CSS custom properties
      icon.style.setProperty('--tooltip-left', `${centerX}px`);
      icon.style.setProperty('--tooltip-top', `${topY}px`);
      icon.style.setProperty('--tooltip-arrow-top', `${arrowTop}px`);
    };
    
    // Função para mostrar tooltip
    const showTooltip = () => {
      // Fechar todos os outros tooltips
      document.querySelectorAll('.info-icon[data-tooltip].tooltip-active').forEach(otherIcon => {
        if (otherIcon !== icon) {
          otherIcon.classList.remove('tooltip-active');
        }
      });
      
      // Atualizar posição
      updateTooltipPosition();
      // Atualizar novamente após um pequeno delay para garantir que as dimensões estejam corretas
      requestAnimationFrame(() => {
        updateTooltipPosition();
        icon.classList.add('tooltip-active');
      });
    };
    
    // Função para esconder tooltip
    const hideTooltip = () => {
      icon.classList.remove('tooltip-active');
    };
    
    // Evento de clique
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      if (icon.classList.contains('tooltip-active')) {
        hideTooltip();
      } else {
        showTooltip();
      }
    });
    
    // Fechar tooltip ao clicar fora (usando uma flag para evitar múltiplos listeners)
    if (!window.tooltipClickHandler) {
      window.tooltipClickHandler = (e) => {
        const activeTooltip = document.querySelector('.info-icon[data-tooltip].tooltip-active');
        if (activeTooltip && !activeTooltip.contains(e.target)) {
          activeTooltip.classList.remove('tooltip-active');
        }
      };
      document.addEventListener('click', window.tooltipClickHandler);
    }
  });
  
  // Configurar cards de métricas para KPIs
  setupKPIMetricsCards();
}

function setupKPIMetricsCards() {
  const kpiIcons = document.querySelectorAll('.info-icon[data-kpi]');
  
  kpiIcons.forEach(icon => {
    const kpiId = icon.getAttribute('data-kpi');
    const metricsData = icon.getAttribute('data-metrics');
    
    if (!kpiId || !metricsData) return;
    
    // Verificar se já foi inicializado
    if (icon.dataset.metricsInitialized) return;
    icon.dataset.metricsInitialized = 'true';
    
    let metrics;
    try {
      metrics = JSON.parse(metricsData);
    } catch (e) {
      console.error('Erro ao parsear métricas:', e);
      return;
    }
    
    // Encontrar o card pai
    const card = icon.closest('.card');
    if (!card) return;
    
    // Criar card de métricas
    const metricsCard = document.createElement('div');
    metricsCard.className = 'kpi-metrics-card';
    
    // Adicionar nota adicional apenas para Desvio de Custos
    const additionalNote = kpiId === 'cost-deviation' 
      ? '<p class="kpi-metrics-note">*Desvio de custo negativo significa que o projeto gastou menos do que o planejado.</p>'
      : '';
    
    metricsCard.innerHTML = `
      <h5>Métricas de Referência</h5>
      <ul class="kpi-metrics-list">
        <li>
          <span class="metric-icon">✅</span>
          <span class="metric-label">OK:</span>
          <span class="metric-value">${metrics.ok}</span>
        </li>
        <li>
          <span class="metric-icon">⚠️</span>
          <span class="metric-label">Atenção:</span>
          <span class="metric-value">${metrics.warning}</span>
        </li>
        <li>
          <span class="metric-icon">❌</span>
          <span class="metric-label">Acima:</span>
          <span class="metric-value">${metrics.above}</span>
        </li>
      </ul>
      ${additionalNote}
    `;
    
    // Adicionar ao card
    card.style.position = 'relative';
    card.appendChild(metricsCard);
    
    // Função para mostrar card
    const showMetricsCard = (e) => {
      e.stopPropagation();
      // Fechar todos os outros cards
      document.querySelectorAll('.kpi-metrics-card.active').forEach(otherCard => {
        if (otherCard !== metricsCard) {
          otherCard.classList.remove('active');
        }
      });
      
      metricsCard.classList.add('active');
    };
    
    // Função para esconder card
    const hideMetricsCard = () => {
      metricsCard.classList.remove('active');
    };
    
    // Evento de clique no ícone
    icon.addEventListener('click', (e) => {
      if (metricsCard.classList.contains('active')) {
        hideMetricsCard();
      } else {
        showMetricsCard(e);
      }
    });
    
    // Fechar ao clicar fora (usando um handler global)
    if (!window.kpiMetricsClickHandler) {
      window.kpiMetricsClickHandler = (e) => {
        const activeCard = document.querySelector('.kpi-metrics-card.active');
        if (activeCard && !activeCard.contains(e.target) && !e.target.closest('.info-icon[data-kpi]')) {
          activeCard.classList.remove('active');
        }
      };
      document.addEventListener('click', window.kpiMetricsClickHandler);
    }
  });
}

function setupEventListeners() {
  // Filtro de tempo global (funciona para manager e colaborador)
  const timeFilter = document.getElementById("timeFilter");
  if (timeFilter) {
    timeFilter.addEventListener("change", (e) => {
      dashboardData.currentTimeFilter = e.target.value;
      
      // Se for manager, atualizar dashboard de gestão
      if (dashboardData.userRole === "manager") {
      // Resetar paginação das tabelas quando o filtro de tempo mudar
      paginationState.idleSquads.currentPage = 1;
      paginationState.overloadSquads.currentPage = 1;
      paginationState.collaborators.currentPage = 1;
      paginationState.marketSkills.currentPage = 1;
      paginationState.employeeSkills.currentPage = 1;
      updateAllCharts();
      // Atualizar tabelas se estiver na aba de análises
      const activeTab = document.querySelector('.tab-button.active')?.getAttribute('data-tab');
      if (activeTab === 'analysis') {
        updateAllTables();
        }
      } else {
        // Se for colaborador, atualizar dashboard de colaborador
        paginationState.collabProjects.currentPage = 1;
        paginationState.collabSquads.currentPage = 1;
        updateCollaboratorKPIs();
        updateCollaboratorCharts();
        updateCollaboratorTables();
      }
    });
  }

  // Filtro de squad global
  const squadFilter = document.getElementById("squadFilter");
  if (squadFilter) {
    squadFilter.addEventListener("change", (e) => {
      dashboardData.currentSquadFilter = e.target.value;
      // Resetar paginação das tabelas quando o filtro mudar
      paginationState.idleSquads.currentPage = 1;
      paginationState.overloadSquads.currentPage = 1;
      paginationState.collaborators.currentPage = 1;
      paginationState.marketSkills.currentPage = 1;
      paginationState.employeeSkills.currentPage = 1;
      updateAllCharts();
      // Atualizar tabelas se estiver na aba de análises
      const activeTab = document.querySelector('.tab-button.active')?.getAttribute('data-tab');
      if (activeTab === 'analysis') {
        updateAllTables();
      }
    });
  }

  // Filtros específicos de gráficos
  document.getElementById("costDeviationSquadFilter")?.addEventListener("change", () => updateCostDeviationChart());
  document.getElementById("costAllocatedSquadFilter")?.addEventListener("change", () => updateCostAllocatedChart());
  document.getElementById("allocationLevelFilter")?.addEventListener("change", () => updateAllocationDistributionChart());
  document.getElementById("skillsFilter")?.addEventListener("change", () => updateSkillsChart());
  document.getElementById("strategicSquadFilter")?.addEventListener("change", () => updateStrategicViewChart());
  document.getElementById("collaboratorSortBy")?.addEventListener("change", () => {
    paginationState.collaborators.currentPage = 1;
    updateCollaboratorsTable();
  });
  // Removido: event listener de skills obsoletas (substituído por duas novas tabelas)

  // Paginação - Squads Ociosos
  document.getElementById("idleSquadsPrevPage")?.addEventListener("click", () => {
    if (paginationState.idleSquads.currentPage > 1) {
      paginationState.idleSquads.currentPage--;
      updateTopIdleSquadsTable();
    }
  });
  document.getElementById("idleSquadsNextPage")?.addEventListener("click", () => {
    paginationState.idleSquads.currentPage++;
    updateTopIdleSquadsTable();
  });

  // Paginação - Squads Sobrecarregados
  document.getElementById("overloadSquadsPrevPage")?.addEventListener("click", () => {
    if (paginationState.overloadSquads.currentPage > 1) {
      paginationState.overloadSquads.currentPage--;
      updateTopOverloadSquadsTable();
    }
  });
  document.getElementById("overloadSquadsNextPage")?.addEventListener("click", () => {
    paginationState.overloadSquads.currentPage++;
    updateTopOverloadSquadsTable();
  });

  // Paginação - Colaboradores
  document.getElementById("collaboratorsPrevPage")?.addEventListener("click", () => {
    if (paginationState.collaborators.currentPage > 1) {
      paginationState.collaborators.currentPage--;
      updateCollaboratorsTable();
    }
  });
  document.getElementById("collaboratorsNextPage")?.addEventListener("click", () => {
    paginationState.collaborators.currentPage++;
    updateCollaboratorsTable();
  });

  // Paginação - Skills Mais Frequentes no Mercado
  document.getElementById("marketSkillsPrevPage")?.addEventListener("click", () => {
    if (paginationState.marketSkills.currentPage > 1) {
      paginationState.marketSkills.currentPage--;
      updateMarketSkillsTable();
    }
  });
  document.getElementById("marketSkillsNextPage")?.addEventListener("click", () => {
    paginationState.marketSkills.currentPage++;
    updateMarketSkillsTable();
  });

  // Paginação - Skills Mais Possuídas pelos Funcionários
  document.getElementById("employeeSkillsPrevPage")?.addEventListener("click", () => {
    if (paginationState.employeeSkills.currentPage > 1) {
      paginationState.employeeSkills.currentPage--;
      updateEmployeeSkillsTable();
    }
  });
  document.getElementById("employeeSkillsNextPage")?.addEventListener("click", () => {
    paginationState.employeeSkills.currentPage++;
    updateEmployeeSkillsTable();
  });

  // Paginação - Projetos do Colaborador
  document.getElementById("collabProjectsPrevPage")?.addEventListener("click", () => {
    if (paginationState.collabProjects.currentPage > 1) {
      paginationState.collabProjects.currentPage--;
      updateCollaboratorProjectsTable();
    }
  });
  document.getElementById("collabProjectsNextPage")?.addEventListener("click", () => {
    paginationState.collabProjects.currentPage++;
    updateCollaboratorProjectsTable();
  });

  // Paginação - Squads do Colaborador
  document.getElementById("collabSquadsPrevPage")?.addEventListener("click", () => {
    if (paginationState.collabSquads.currentPage > 1) {
      paginationState.collabSquads.currentPage--;
      updateCollaboratorSquadsTable();
    }
  });
  document.getElementById("collabSquadsNextPage")?.addEventListener("click", () => {
    paginationState.collabSquads.currentPage++;
    updateCollaboratorSquadsTable();
  });

  // Modal de certificados
  document.getElementById("kpi-certificates-expiring")?.addEventListener("click", () => {
    document.getElementById("certificatesModal")?.classList.remove("hidden");
  });
  document.getElementById("closeCertificatesModal")?.addEventListener("click", () => {
    document.getElementById("certificatesModal")?.classList.add("hidden");
  });
}

function renderManagerDashboard() {
  console.log("Renderizando dashboard do gestor");
  document.getElementById("manager-dashboard").classList.remove("hidden");
  document.getElementById("collaborator-dashboard").classList.add("hidden");
  
  // Mostrar filtro de squad para managers
  const squadFilterGroup = document.getElementById("squadFilterGroup");
  if (squadFilterGroup) {
    squadFilterGroup.style.display = "flex";
  }
  
  // Aguardar um pouco para garantir que os elementos estão no DOM
  setTimeout(() => {
    console.log("🔄 Atualizando dashboard do gestor...");
    // Ativar a primeira aba (Custos) por padrão
    const costsTab = document.querySelector('#manager-dashboard .tab-button[data-tab="costs"]');
    const costsContent = document.getElementById("tab-costs");
    
    // Remover active de todas as tabs do gestor
    document.querySelectorAll('#manager-dashboard .tab-button').forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll('#manager-dashboard .tab-content').forEach(content => content.classList.remove("active"));
    
    // Ativar a aba Custos
    if (costsTab && costsContent) {
      costsTab.classList.add("active");
      costsContent.classList.add("active");
      console.log("✅ Aba Custos ativada automaticamente");
    }
    
    // Atualizar KPIs e gráficos da aba ativa
    setTimeout(() => {
      updateChartsForTab("costs");
    }, 100);
  }, 200);
  
  console.log("Dashboard do gestor renderizado");
}

function renderCollaboratorDashboard() {
  const managerDashboard = document.getElementById("manager-dashboard");
  const collaboratorDashboard = document.getElementById("collaborator-dashboard");
  
  if (managerDashboard) managerDashboard.classList.add("hidden");
  
  // Ocultar filtro de squad para colaboradores
  const squadFilterGroup = document.getElementById("squadFilterGroup");
  if (squadFilterGroup) {
    squadFilterGroup.style.display = "none";
  }
  
  if (collaboratorDashboard) {
    collaboratorDashboard.classList.remove("hidden");
    
    // Garantir que userId está definido
    if (!dashboardData.userId && dashboardData.collaborators.length > 0) {
      dashboardData.userId = dashboardData.collaborators[0].id;
      localStorage.setItem("userId", dashboardData.userId);
      console.log("✅ userId definido como primeiro colaborador:", dashboardData.userId);
    }
    
    console.log("🔄 Renderizando dashboard de colaborador com userId:", dashboardData.userId);
    console.log("📊 Dados disponíveis:", {
      collaborators: dashboardData.collaborators.length,
      allocations: dashboardData.allocations.length,
      projects: dashboardData.projects.length,
      squads: dashboardData.squads.length
    });
    
    // Aguardar um pouco para garantir que os elementos estão no DOM
    setTimeout(() => {
      console.log("🔄 Atualizando KPIs, gráficos e tabelas do colaborador...");
      // Ativar a aba "Indicadores" por padrão
      const indicatorsTab = document.querySelector('#collaborator-dashboard .tab-button[data-tab="indicators"]');
      const indicatorsContent = document.getElementById("tab-indicators");
      
      // Remover active de todas as tabs do colaborador
      document.querySelectorAll('#collaborator-dashboard .tab-button').forEach(btn => btn.classList.remove("active"));
      document.querySelectorAll('#collaborator-dashboard .tab-content').forEach(content => content.classList.remove("active"));
      
      // Ativar a aba Indicadores
      if (indicatorsTab && indicatorsContent) {
        indicatorsTab.classList.add("active");
        indicatorsContent.classList.add("active");
        console.log("✅ Aba Indicadores ativada automaticamente");
      }
      
      // Configurar tabs do colaborador
      setupTabs();
      // Atualizar KPIs (sempre visíveis na primeira aba)
      updateCollaboratorKPIs();
      // Os gráficos serão atualizados quando as abas forem clicadas
    }, 200);
  }
}

// ==================== CÁLCULOS DE KPIs ====================

function calculateKPIs() {
  const timeRange = getTimeRange();
  const filteredData = getFilteredData();

  const activeProjects = filteredData.projects.filter(p => 
    p.status && !["CONCLUÍDO", "CANCELADO"].includes(p.status.toUpperCase())
  ).length;

  const activeSquads = filteredData.squads.length;

  // Calcular horas alocadas na semana atual
  const currentWeek = getCurrentWeek();
  const totalHours = filteredData.allocations
    .filter(a => isInWeek(a.startDate || a.date, currentWeek))
    .reduce((sum, a) => sum + (a.hours || a.weeklyHours || 0), 0);

  // Desvio de custos
  const costDeviation = calculateCostDeviation(filteredData.projects);

  // Competência de talentos (assumindo que colaboradores com skills têm competência)
  const totalCollaborators = filteredData.collaborators.length;
  const competentCollaborators = filteredData.collaborators.filter(c => 
    c.skills && Array.isArray(c.skills) && c.skills.length > 0
  ).length;
  const talentCompetence = totalCollaborators > 0 
    ? (competentCollaborators / totalCollaborators) * 100 
    : 0;

  // Custo de ociosidade
  const idleCost = calculateIdleCost(filteredData);

  // Custo médio por squad
  const avgSquadCost = calculateAvgSquadCost(filteredData);

  // Percentuais de sobrecarga e ociosidade
  const { overloadPercentage, idlePercentage } = calculateOverloadIdlePercentages(filteredData);

  // Certificados
  const certificatesExpiring = getExpiringCertificates(filteredData.collaborators);
  const certificatesThisMonth = getCertificatesThisMonth(filteredData.collaborators);

  return {
    totalProjects: activeProjects,
    totalSquads: activeSquads,
    totalHours,
    costDeviation,
    talentCompetence,
    idleCost,
    avgSquadCost,
    overloadPercentage,
    idlePercentage,
    certificatesExpiring: certificatesExpiring.length,
    certificatesThisMonth: certificatesThisMonth.length,
    certificatesExpiringList: certificatesExpiring,
  };
}

function calculateCostDeviation(projects) {
  return projects.reduce((total, project) => {
    const budget = project.budget || project.estimatedCost || 0;
    const spent = project.spentCost || project.actualCost || 0;
    return total + (spent - budget);
  }, 0);
}

function calculateIdleCost(data) {
  // Calcular custo de recursos ociosos
  let totalIdleCost = 0;
  data.collaborators.forEach(collab => {
    const allocation = data.allocations.find(a => a.employeeId === collab.id);
    const allocatedHours = allocation ? (allocation.hours || 0) : 0;
    const availableHours = collab.workHoursPerWeek || 40;
    const idleHours = Math.max(0, availableHours - allocatedHours);
    const hourlyCost = collab.hourlyCost || collab.salary / (availableHours * 4.33) || 0;
    totalIdleCost += idleHours * hourlyCost;
  });
  return totalIdleCost;
}

function calculateAvgSquadCost(data) {
  if (data.squads.length === 0) return 0;
  const totalCost = data.squads.reduce((sum, squad) => {
    const squadAllocations = data.allocations.filter(a => a.squadId === squad.id);
    const squadCost = squadAllocations.reduce((s, a) => {
      const collab = data.collaborators.find(c => c.id === a.employeeId);
      const hourlyCost = collab?.hourlyCost || collab?.salary / (40 * 4.33) || 0;
      return s + (a.hours || 0) * hourlyCost;
    }, 0);
    return sum + squadCost;
  }, 0);
  return totalCost / data.squads.length;
}

function calculateOverloadIdlePercentages(data) {
  let totalOverload = 0;
  let totalIdle = 0;
  let count = 0;

  data.collaborators.forEach(collab => {
    const allocation = data.allocations.find(a => a.employeeId === collab.id);
    const allocatedHours = allocation ? (allocation.hours || 0) : 0;
    const availableHours = collab.workHoursPerWeek || 40;
    
    if (allocatedHours > availableHours) {
      totalOverload += ((allocatedHours - availableHours) / availableHours) * 100;
    } else if (allocatedHours < availableHours * 0.8) {
      totalIdle += ((availableHours - allocatedHours) / availableHours) * 100;
    }
    count++;
  });

  return {
    overloadPercentage: count > 0 ? totalOverload / count : 0,
    idlePercentage: count > 0 ? totalIdle / count : 0,
  };
}

function getExpiringCertificates(collaborators) {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiring = [];

  collaborators.forEach(collab => {
    if (collab.certificates && Array.isArray(collab.certificates)) {
      collab.certificates.forEach(cert => {
        if (cert.expirationDate) {
          const expDate = new Date(cert.expirationDate);
          if (expDate <= in30Days && expDate >= now) {
            expiring.push({
              collaborator: collab.name,
              certificate: cert.name || cert.title,
              expirationDate: cert.expirationDate,
              daysRemaining: Math.ceil((expDate - now) / (24 * 60 * 60 * 1000)),
            });
          }
        }
      });
    }
  });

  return expiring;
}

function getCertificatesThisMonth(collaborators) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const certificates = [];

  collaborators.forEach(collab => {
    if (collab.certificates && Array.isArray(collab.certificates)) {
      collab.certificates.forEach(cert => {
        if (cert.uploadDate || cert.issueDate) {
          const certDate = new Date(cert.uploadDate || cert.issueDate);
          if (certDate >= startOfMonth) {
            certificates.push(cert);
          }
        }
      });
    }
  });

  return certificates;
}

// ==================== ATUALIZAÇÃO DE KPIs ====================

function updateAllKPIs() {
  const kpis = calculateKPIs();

  // Helper function para atualizar elementos com verificação de null
  const updateElement = (id, value) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  };

  updateElement("kpi-total-projects", kpis.totalProjects);
  updateElement("kpi-total-squads", kpis.totalSquads);
  updateElement("kpi-total-hours", `${kpis.totalHours}h`);
  updateElement("kpi-cost-deviation", formatCurrency(kpis.costDeviation));
  updateElement("kpi-cost-deviation-tag", 
    `${kpis.costDeviation >= 0 ? '+' : ''}${formatPercentage(kpis.costDeviation / 1000000)}`);
  updateElement("kpi-talent-competence", formatPercentage(kpis.talentCompetence));
  updateElement("kpi-idle-cost", formatCurrency(kpis.idleCost));
  updateElement("kpi-avg-squad-cost", formatCurrency(kpis.avgSquadCost));
  updateElement("kpi-overload-percentage", formatPercentage(kpis.overloadPercentage));
  updateElement("kpi-idle-percentage", formatPercentage(kpis.idlePercentage));
  updateElement("kpi-certificates-count", kpis.certificatesExpiring);
  updateElement("kpi-certificates-month", kpis.certificatesThisMonth);

  // Atualizar tabela de certificados
  updateCertificatesTable(kpis.certificatesExpiringList);
}

function updateCertificatesTable(certificates) {
  const tbody = document.getElementById("certificatesTableBody");
  if (!tbody) {
    console.log("certificatesTableBody não encontrado no DOM");
    return;
  }

  tbody.innerHTML = "";
  if (!certificates || certificates.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="4" style="text-align: center;">Nenhum certificado próximo ao vencimento</td>`;
    tbody.appendChild(row);
    return;
  }

  certificates.forEach(cert => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${cert.collaborator}</td>
      <td>${cert.certificate}</td>
      <td>${formatDate(cert.expirationDate)}</td>
      <td>${cert.daysRemaining} dias</td>
    `;
    tbody.appendChild(row);
  });
}

// Função para determinar status da KPI (vermelho/amarelo/verde)
function getKPIStatus(value, thresholds) {
  // thresholds: { good: valor_max_bom, warning: valor_max_atencao }
  // Para valores onde menor é melhor (ex: desvio negativo, ociosidade baixa)
  if (thresholds.inverted) {
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.warning) return 'warning';
    return 'bad';
  }
  // Para valores onde maior é melhor (ex: projetos ativos, certificados)
  if (thresholds.greaterIsBetter) {
    if (value >= thresholds.good) return 'good';
    if (value >= thresholds.warning) return 'warning';
    return 'bad';
  }
  // Para valores onde há um range ideal
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.warning) return 'warning';
  return 'bad';
}

// Aplicar status visual ao card da KPI
function applyKPIStatus(elementId, status) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  // Encontrar o card pai
  const card = element.closest('.card');
  if (!card) return;
  
  // Remover classes de status anteriores
  card.classList.remove('kpi-good', 'kpi-warning', 'kpi-bad');
  
  // Adicionar nova classe de status
  card.classList.add(`kpi-${status}`);
}

// Função auxiliar para extrair valores numéricos das métricas
function extractMetricValue(metricString) {
  if (!metricString) return null;
  
  // Remove "R$", "Até", "Acima de", "a", "ou", "abaixo de", "%" e espaços extras
  let cleaned = metricString
    .replace(/R\$/g, '')
    .replace(/Até/gi, '')
    .replace(/Acima de/gi, '')
    .replace(/abaixo de/gi, '')
    .replace(/%/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Extrai todos os números (incluindo negativos e decimais)
  // Procura por padrões como "-5.000", "20.000", "2.001", "10,1", "15.5", etc.
  const numberPattern = /(-?\d{1,3}(?:\.\d{3})*(?:[,\d]+)?)/g;
  const matches = cleaned.match(numberPattern);
  
  if (!matches || matches.length === 0) return null;
  
  // Converte para número (remove pontos de milhar e substitui vírgula por ponto)
  return matches.map(n => {
    // Remove pontos de milhar e substitui vírgula decimal por ponto
    const numStr = n.replace(/\./g, '').replace(',', '.');
    return parseFloat(numStr);
  });
}

// Função para determinar status baseado nas métricas do data attribute
function getKPIStatusFromMetrics(value, kpiId) {
  const icon = document.querySelector(`.info-icon[data-kpi="${kpiId}"]`);
  if (!icon) return 'good'; // Default se não encontrar
  
  const metricsData = icon.getAttribute('data-metrics');
  if (!metricsData) return 'good';
  
  let metrics;
  try {
    metrics = JSON.parse(metricsData);
  } catch (e) {
    console.error('Erro ao parsear métricas:', e);
    return 'good';
  }
  
  // Extrair valores das métricas
  const okValues = extractMetricValue(metrics.ok || '');
  const warningValues = extractMetricValue(metrics.warning || '');
  const aboveValues = extractMetricValue(metrics.above || '');
  
  // Desvio de Custo tem lógica especial (range OK: -5000 a 2000)
  if (kpiId === 'cost-deviation') {
    // OK: entre -5000 e 2000
    if (okValues && okValues.length >= 2) {
      const okMin = Math.min(...okValues);
      const okMax = Math.max(...okValues);
      if (value >= okMin && value <= okMax) return 'good';
    }
    // WARNING: entre 2001 e 3000 (ou -5001 a -6000 se houver)
    if (warningValues && warningValues.length >= 2) {
      const warningMin = Math.min(...warningValues);
      const warningMax = Math.max(...warningValues);
      if (value >= warningMin && value <= warningMax) return 'warning';
    }
    // Se não está no range OK nem WARNING, está acima ou abaixo (BAD)
    return 'bad';
  }
  
  // Para outras KPIs: OK = até X, WARNING = X a Y, ABOVE = acima de Y
  // Primeiro verifica se está no range de WARNING
  if (warningValues && warningValues.length >= 2) {
    const warningMin = Math.min(...warningValues);
    const warningMax = Math.max(...warningValues);
    if (value >= warningMin && value <= warningMax) return 'warning';
  }
  
  // Depois verifica se está no range de OK
  if (okValues && okValues.length > 0) {
    const okMax = Math.max(...okValues);
    if (value <= okMax) return 'good';
  }
  
  // Se não está em nenhum range, está acima (BAD)
  return 'bad';
}

// Atualizar KPIs específicos da aba de Custos
function updateCostKPIs() {
  const kpis = calculateKPIs();

  const updateElement = (id, value) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  };

  updateElement("kpi-cost-deviation", formatCurrency(kpis.costDeviation));
  updateElement("kpi-cost-deviation-tag", 
    `${kpis.costDeviation >= 0 ? '+' : ''}${formatPercentage(kpis.costDeviation / 1000000)}`);
  updateElement("kpi-avg-squad-cost", formatCurrency(kpis.avgSquadCost));
  updateElement("kpi-idle-cost", formatCurrency(kpis.idleCost));

  // Aplicar status visuais baseado nas métricas definidas nos data attributes
  const deviationStatus = getKPIStatusFromMetrics(kpis.costDeviation, 'cost-deviation');
  applyKPIStatus("kpi-cost-deviation", deviationStatus);

  // Remover status visual do Custo Médio por Squad (sem métricas)
  const avgSquadCostElement = document.getElementById("kpi-avg-squad-cost");
  if (avgSquadCostElement) {
    const card = avgSquadCostElement.closest('.card');
    if (card) {
      card.classList.remove('kpi-good', 'kpi-warning', 'kpi-bad');
    }
  }

  const idleCostStatus = getKPIStatusFromMetrics(kpis.idleCost, 'idle-cost');
  applyKPIStatus("kpi-idle-cost", idleCostStatus);
}

// Atualizar KPIs específicos da aba de Alocação
function updateAllocationKPIs() {
  const kpis = calculateKPIs();

  const updateElement = (id, value) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  };

  updateElement("kpi-total-projects", kpis.totalProjects);
  updateElement("kpi-total-squads", kpis.totalSquads);
  updateElement("kpi-total-hours", `${kpis.totalHours}h`);
  updateElement("kpi-overload-percentage", formatPercentage(kpis.overloadPercentage));
  updateElement("kpi-idle-percentage", formatPercentage(kpis.idlePercentage));

  // Remover status visuais das KPIs de Total de Projetos e Squads
  const totalProjectsElement = document.getElementById("kpi-total-projects");
  if (totalProjectsElement) {
    const card = totalProjectsElement.closest('.card');
    if (card) {
      card.classList.remove('kpi-good', 'kpi-warning', 'kpi-bad');
    }
  }
  
  const totalSquadsElement = document.getElementById("kpi-total-squads");
  if (totalSquadsElement) {
    const card = totalSquadsElement.closest('.card');
    if (card) {
      card.classList.remove('kpi-good', 'kpi-warning', 'kpi-bad');
    }
  }

  // Aplicar status visuais baseado nas métricas definidas nos data attributes
  const overloadStatus = getKPIStatusFromMetrics(kpis.overloadPercentage, 'overload-percentage');
  applyKPIStatus("kpi-overload-percentage", overloadStatus);

  const idleStatus = getKPIStatusFromMetrics(kpis.idlePercentage, 'idle-percentage');
  applyKPIStatus("kpi-idle-percentage", idleStatus);
}

// Atualizar KPIs específicos da aba de Competências
function updateCompetenciesKPIs() {
  const kpis = calculateKPIs();

  const updateElement = (id, value) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  };

  updateElement("kpi-certificates-count", kpis.certificatesExpiring);
  updateElement("kpi-certificates-month", kpis.certificatesThisMonth);

  // Aplicar status visuais
  // Remover status visuais das KPIs de Certificados
  const certificatesCountElement = document.getElementById("kpi-certificates-count");
  if (certificatesCountElement) {
    const card = certificatesCountElement.closest('.card');
    if (card) {
      card.classList.remove('kpi-good', 'kpi-warning', 'kpi-bad');
    }
  }
  
  const certificatesMonthElement = document.getElementById("kpi-certificates-month");
  if (certificatesMonthElement) {
    const card = certificatesMonthElement.closest('.card');
    if (card) {
      card.classList.remove('kpi-good', 'kpi-warning', 'kpi-bad');
    }
  }

  // Atualizar tabela de certificados
  updateCertificatesTable(kpis.certificatesExpiringList);
}

// ==================== GRÁFICOS ====================

let chartInstances = {};

function updateAllCharts() {
  // Atualizar todos os KPIs
  updateCostKPIs();
  updateAllocationKPIs();
  updateCompetenciesKPIs();
  
  // Atualizar todos os gráficos
  updateCostDeviationChart();
  updateCostAllocatedChart();
  updateAllocationDistributionChart();
  updateOverloadIdleComparisonChart();
  updateSkillsChart();
  updateSeniorityChart();
  updateStrategicViewChart();
  updateWorkloadDistributionChart();
  updateSkillsHeatmapChart();
}

function updateCostDeviationChart() {
  console.log("Criando gráfico de Desvio de Custo (Previsto vs Realizado)");
  const ctx = document.getElementById("costDeviationChart");
  if (!ctx) {
    console.warn("Canvas costDeviationChart não encontrado");
    return;
  }

  const squadFilter = document.getElementById("costDeviationSquadFilter")?.value || "all";
  const filteredData = getFilteredData();
  
  if (!filteredData.squads || filteredData.squads.length === 0) {
    console.warn("Sem dados de squads para o gráfico");
    return;
  }

  const squads = squadFilter === "all" 
    ? filteredData.squads 
    : filteredData.squads.filter(s => s.id == squadFilter);

  // REGRA DE NEGÓCIO: Um squad só pode ter um projeto (através de squad.projectId)
  // Calcular valores previstos (budget) e realizados (spent) por squad
  const previsto = squads.map(squad => {
    const squadProject = filteredData.projects.find(p => 
      String(p.id) === String(squad.projectId)
    );
    return squadProject ? (squadProject.budget || squadProject.estimatedCost || 0) : 0;
  });

  const realizado = squads.map(squad => {
    const squadProject = filteredData.projects.find(p => 
      String(p.id) === String(squad.projectId)
    );
    return squadProject ? (squadProject.spentCost || squadProject.actualCost || 0) : 0;
  });

  if (chartInstances.costDeviation) {
    chartInstances.costDeviation.destroy();
  }

  console.log("Criando Chart.js combinado com", squads.length, "squads");
  console.log("Labels:", squads.map(s => s.name || `Squad ${s.id}`));
  console.log("Previsto:", previsto);
  console.log("Realizado:", realizado);
  
  try {
    chartInstances.costDeviation = new Chart(ctx, {
      type: "bar",
      data: {
        labels: squads.map(s => s.name || `Squad ${s.id}`),
        datasets: [
          {
            type: "bar",
            label: "PREVISTO",
            data: previsto,
            backgroundColor: "rgba(33, 150, 243, 0.6)", // Azul
            borderColor: "rgba(33, 150, 243, 1)",
            borderWidth: 1,
            order: 2, // Barras aparecem atrás
          },
          {
            type: "line",
            label: "REALIZADO",
            data: realizado,
            backgroundColor: "rgb(255, 65, 230)", 
            borderColor: "rgb(255, 65, 230)",
            borderWidth: 3,
            fill: false,
            tension: 0.1, // Linha suave
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: "rgb(255, 65, 230)",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            order: 1, // Linha aparece na frente
          }
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Custo (R$)",
            },
            ticks: {
              callback: function(value) {
                return 'R$ ' + value.toLocaleString('pt-BR');
              }
            }
          },
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                label += 'R$ ' + context.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                return label;
              }
            }
          }
        },
      },
    });
    console.log("✅ Gráfico de Desvio de Custo (Previsto vs Realizado) criado com sucesso");
  } catch (error) {
    console.error("❌ Erro ao criar gráfico de Desvio de Custo:", error);
  }
}

function updateCostAllocatedChart() {
  console.log("Criando gráfico de Custo Alocado");
  const ctx = document.getElementById("costAllocatedChart");
  if (!ctx) {
    console.warn("Canvas costAllocatedChart não encontrado");
    return;
  }

  const squadFilter = document.getElementById("costAllocatedSquadFilter")?.value || "all";
  const filteredData = getFilteredData();
  const squads = squadFilter === "all" 
    ? filteredData.squads 
    : filteredData.squads.filter(s => s.id == squadFilter);

  const costs = squads.map(squad => {
    const squadAllocations = filteredData.allocations.filter(a => a.squadId === squad.id);
    return squadAllocations.reduce((sum, a) => {
      const collab = filteredData.collaborators.find(c => c.id === a.employeeId);
      const hourlyCost = collab?.hourlyCost || collab?.salary / (40 * 4.33) || 0;
      return sum + (a.hours || 0) * hourlyCost;
    }, 0);
  });

  if (chartInstances.costAllocated) {
    chartInstances.costAllocated.destroy();
  }

  chartInstances.costAllocated = new Chart(ctx, {
    type: "bar",
    data: {
      labels: squads.map(s => s.name || `Squad ${s.id}`),
      datasets: [{
        label: "Custo Alocado (R$)",
        data: costs,
        backgroundColor: "rgba(64, 221, 254, 0.6)",
        borderColor: "rgba(64, 221, 254, 1)",
        borderWidth: 1,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Custo (R$)",
          },
          ticks: {
            callback: function(value) {
              return 'R$ ' + value.toLocaleString('pt-BR');
            }
          }
        },
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        }
      },
      plugins: {
        legend: {
          display: true,
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              label += 'R$ ' + context.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              return label;
            }
          }
        }
      }
    },
  });
}

function updateAllocationDistributionChart() {
  console.log("Criando gráfico de Distribuição de Alocação");
  const ctx = document.getElementById("allocationDistributionChart");
  if (!ctx) {
    console.warn("Canvas allocationDistributionChart não encontrado");
    return;
  }

  const levelFilter = document.getElementById("allocationLevelFilter")?.value || "all";
  const filteredData = getFilteredData();

  const ranges = {
    "0-50": { min: 0, max: 50 },
    "50-80": { min: 50, max: 80 },
    "80-100": { min: 80, max: 100 },
    "100-120": { min: 100, max: 120 },
    "120+": { min: 120, max: Infinity },
  };

  const distribution = {
    "0-50": 0,
    "50-80": 0,
    "80-100": 0,
    "100-120": 0,
    "120+": 0,
  };

  const collaboratorsByRange = {
    "0-50": [],
    "50-80": [],
    "80-100": [],
    "100-120": [],
    "120+": [],
  };

  filteredData.collaborators.forEach(collab => {
    const allocation = filteredData.allocations.find(a => a.employeeId === collab.id);
    const allocatedHours = allocation ? (allocation.hours || 0) : 0;
    const availableHours = collab.workHoursPerWeek || 40;
    const percentage = (allocatedHours / availableHours) * 100;

    for (const [range, { min, max }] of Object.entries(ranges)) {
      if (percentage >= min && percentage < max) {
        distribution[range]++;
        collaboratorsByRange[range].push(collab);
        break;
      }
    }
  });

  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  const percentages = Object.keys(distribution).map(range => 
    total > 0 ? (distribution[range] / total) * 100 : 0
  );

  if (chartInstances.allocationDistribution) {
    chartInstances.allocationDistribution.destroy();
  }

  chartInstances.allocationDistribution = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["0-50%", "50-80%", "80-100%", "100-120%", ">120%"],
      datasets: [{
        label: "% de Colaboradores",
        data: percentages,
        backgroundColor: [
          "rgba(211, 47, 47, 0.6)",
          "rgba(255, 152, 0, 0.6)",
          "rgba(46, 125, 50, 0.6)",
          "rgba(255, 193, 7, 0.6)",
          "rgba(211, 47, 47, 0.8)",
        ],
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      onClick: (event, elements) => {
        if (elements.length > 0 && levelFilter === "all") {
          const index = elements[0].index;
          const ranges = ["0-50", "50-80", "80-100", "100-120", "120+"];
          const selectedRange = ranges[index];
          showAllocationDetails(collaboratorsByRange[selectedRange], selectedRange);
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: "% de Colaboradores",
          },
        },
      },
    },
  });
}

function showAllocationDetails(collaborators, range) {
  const detailsDiv = document.getElementById("allocationDetails");
  if (!detailsDiv) return;

  detailsDiv.classList.remove("hidden");
  detailsDiv.innerHTML = `
    <h4>Colaboradores com alocação ${range}%:</h4>
    <ul>
      ${collaborators.map(c => `<li>${c.name || `Colaborador ${c.id}`}</li>`).join("")}
    </ul>
  `;
}

function updateOverloadIdleComparisonChart() {
  const ctx = document.getElementById("overloadIdleComparisonChart");
  if (!ctx) return;

  const timeRange = getTimeRange();
  const months = getLast6Months();
  const data = months.map(month => {
    const monthData = getDataForMonth(month);
    const { overloadPercentage, idlePercentage } = calculateOverloadIdlePercentages(monthData);
    return { overload: overloadPercentage, idle: idlePercentage };
  });

  if (chartInstances.overloadIdleComparison) {
    chartInstances.overloadIdleComparison.destroy();
  }

  chartInstances.overloadIdleComparison = new Chart(ctx, {
    type: "bar",
    data: {
      labels: months.map(m => formatMonth(m)),
      datasets: [
        {
          label: "Sobrecarga (%)",
          data: data.map(d => d.overload),
          backgroundColor: "rgba(211, 47, 47, 0.6)",
        },
        {
          label: "Ociosidade (%)",
          data: data.map(d => d.idle),
          backgroundColor: "rgba(46, 125, 50, 0.6)",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Percentual (%)",
          },
        },
      },
    },
  });
}

function updateSkillsChart() {
  console.log("Criando gráfico de Skills");
  const ctx = document.getElementById("skillsChart");
  if (!ctx) {
    console.warn("Canvas skillsChart não encontrado");
    return;
  }

  const skillFilter = document.getElementById("skillsFilter")?.value || "all";
  const filteredData = getFilteredData();

  const skillCounts = {};
  filteredData.collaborators.forEach(collab => {
    if (collab.skills && Array.isArray(collab.skills)) {
      collab.skills.forEach(skill => {
        const skillId = skill.id || skill.name;
        if (skillFilter === "all" || skillId == skillFilter) {
          const skillName = skill.name || skillId;
          skillCounts[skillName] = (skillCounts[skillName] || 0) + 1;
        }
      });
    }
  });

  const sortedSkills = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (chartInstances.skills) {
    chartInstances.skills.destroy();
  }

  chartInstances.skills = new Chart(ctx, {
    type: "bar",
    indexAxis: "y",
    data: {
      labels: sortedSkills.map(([name]) => name),
      datasets: [{
        label: "Número de Colaboradores",
        data: sortedSkills.map(([, count]) => count),
        backgroundColor: "rgba(117, 18, 249, 0.6)",
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      scales: {
        x: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Número de Colaboradores",
          },
        },
      },
    },
  });
}

function updateSeniorityChart() {
  const ctx = document.getElementById("seniorityChart");
  if (!ctx) return;

  const seniorityFilter = document.getElementById("seniorityFilter")?.value || "all";
  const filteredData = getFilteredData();

  const seniorityBySquad = {};
  filteredData.squads.forEach(squad => {
    const squadAllocations = filteredData.allocations.filter(a => a.squadId === squad.id);
    const squadMembers = squadAllocations.map(a => 
      filteredData.collaborators.find(c => c.id === a.employeeId)
    ).filter(Boolean);

    const seniorityCounts = {
      "Júnior": 0,
      "Pleno": 0,
      "Sênior": 0,
      "Especialista": 0,
    };

    squadMembers.forEach(member => {
      const jobTitle = member.jobTitle || "";
      const titleLower = jobTitle.toLowerCase();
      if (titleLower.includes("júnior") || titleLower.includes("junior")) {
        seniorityCounts["Júnior"]++;
      } else if (titleLower.includes("pleno")) {
        seniorityCounts["Pleno"]++;
      } else if (titleLower.includes("sênior") || titleLower.includes("senior")) {
        seniorityCounts["Sênior"]++;
      } else if (titleLower.includes("especialista") || titleLower.includes("lead")) {
        seniorityCounts["Especialista"]++;
      }
    });

    seniorityBySquad[squad.name || `Squad ${squad.id}`] = seniorityCounts;
  });

  const squads = Object.keys(seniorityBySquad);
  const seniorities = ["Júnior", "Pleno", "Sênior", "Especialista"];

  if (chartInstances.seniority) {
    chartInstances.seniority.destroy();
  }

  chartInstances.seniority = new Chart(ctx, {
    type: "bar",
    indexAxis: "y",
    data: {
      labels: squads,
      datasets: seniorities.map((seniority, idx) => ({
        label: seniority,
        data: squads.map(squad => seniorityBySquad[squad][seniority] || 0),
        backgroundColor: [
          "rgba(64, 221, 254, 0.6)",
          "rgba(117, 18, 249, 0.6)",
          "rgba(250, 18, 226, 0.6)",
          "rgba(255, 252, 54, 0.6)",
        ][idx],
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      scales: {
        x: {
          stacked: true,
          beginAtZero: true,
        },
        y: {
          stacked: true,
        },
      },
    },
  });
}

function updateStrategicViewChart() {
  const ctx = document.getElementById("strategicViewChart");
  if (!ctx) return;

  const squadFilter = document.getElementById("strategicSquadFilter")?.value || "all";
  
  // Usar getFilteredData() para aplicar filtros de período e squad principal
  // Depois aplicar o filtro específico do gráfico estratégico
  let data = getFilteredData();
  
  // Filtrar squads pelo filtro específico do gráfico estratégico (sobrescreve o filtro principal se necessário)
  const squads = squadFilter === "all" 
    ? data.squads 
    : data.squads.filter(s => String(s.id) === String(squadFilter));

  if (squads.length === 0) return;

  // Calcular métricas para cada squad
  const squadMetrics = squads.map(squad => {
    const squadAllocations = data.allocations.filter(a => String(a.squadId) === String(squad.id));
    
    // Custo total
    const cost = squadAllocations.reduce((sum, a) => {
      const collab = data.collaborators.find(c => c.id === a.employeeId);
      const hourlyCost = collab?.hourlyCost || collab?.salary / (40 * 4.33) || 0;
      return sum + (a.hours || 0) * hourlyCost;
    }, 0);
    
    // Alocação total (horas)
    const totalAllocation = squadAllocations.reduce((sum, a) => sum + (a.hours || 0), 0);
    
    // Número de pessoas
    const peopleCount = new Set(squadAllocations.map(a => a.employeeId)).size;

    return {
      squadId: squad.id,
      label: squad.name || `Squad ${squad.id}`,
      cost,
      allocation: totalAllocation,
      people: peopleCount,
    };
  });

  // Normalizar valores para escala 0-100 (para o gráfico radar)
  const maxValues = {
    cost: Math.max(...squadMetrics.map(m => m.cost), 1),
    allocation: Math.max(...squadMetrics.map(m => m.allocation), 1),
    people: Math.max(...squadMetrics.map(m => m.people), 1),
  };

  // Definir cores fixas para cada squad baseado no ID
  const colors = [
    { bg: 'rgba(117, 18, 249, 0.2)', border: 'rgba(117, 18, 249, 1)' },
    { bg: 'rgba(64, 221, 254, 0.2)', border: 'rgba(64, 221, 254, 1)' },
    { bg: 'rgba(250, 18, 226, 0.2)', border: 'rgba(250, 18, 226, 1)' },
    { bg: 'rgba(211, 47, 46, 0.2)', border: 'rgba(211, 47, 46, 1)' },
    { bg: 'rgba(47, 125, 50, 0.2)', border: 'rgba(47, 125, 50, 1)' },
  ];

  // Criar datasets para o gráfico radar
  const datasets = squadMetrics.map((metrics) => {
    // Usar o ID do squad para determinar a cor de forma consistente
    // Subtrair 1 porque os IDs geralmente começam em 1
    const colorIndex = (metrics.squadId - 1) % colors.length;
    const color = colors[colorIndex];

    return {
      label: metrics.label,
      data: [
        (metrics.cost / maxValues.cost) * 100,
        (metrics.allocation / maxValues.allocation) * 100,
        (metrics.people / maxValues.people) * 100,
      ],
      backgroundColor: color.bg,
      borderColor: color.border,
      borderWidth: 2,
      pointBackgroundColor: color.border,
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: color.border,
    };
  });

  if (chartInstances.strategicView) {
    chartInstances.strategicView.destroy();
  }

  chartInstances.strategicView = new Chart(ctx, {
    type: "radar",
    data: {
      labels: [
        "Custos",
        "Alocação (Horas)",
        "Pessoas"
      ],
      datasets: datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: {
            display: false
          },
          pointLabels: {
            font: {
              size: 12
            },
            callback: function(label, index) {
              // Mostrar valores máximos nos labels dos eixos
              if (index === 0) {
                return `Custos\n(${formatCurrency(maxValues.cost)})`;
              } else if (index === 1) {
                return `Alocação\n(${Math.round(maxValues.allocation)}h)`;
              } else if (index === 2) {
                return `Pessoas\n(${maxValues.people})`;
              }
              return label;
            }
          }
        },
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const index = context.dataIndex;
              const labels = ['Custos', 'Alocação (Horas)', 'Pessoas'];
              const metrics = squadMetrics[context.datasetIndex];
              
              let actualValue = '';
              switch(index) {
                case 0:
                  actualValue = formatCurrency(metrics.cost);
                  break;
                case 1:
                  actualValue = `${metrics.allocation.toFixed(0)}h`;
                  break;
                case 2:
                  actualValue = `${metrics.people} pessoas`;
                  break;
              }
              
              return `${label}: ${labels[index]} - ${actualValue}`;
            },
          },
        },
      },
    },
  });
}

function updateWorkloadDistributionChart() {
  const ctx = document.getElementById("workloadDistributionChart");
  if (!ctx) return;

  const filteredData = getFilteredData();

  const workloadData = filteredData.squads.map(squad => {
    const squadAllocations = filteredData.allocations.filter(a => a.squadId === squad.id);
    const allocatedHours = squadAllocations.reduce((sum, a) => sum + (a.hours || 0), 0);
    
    const totalAvailableHours = squadAllocations.reduce((sum, a) => {
      const collab = filteredData.collaborators.find(c => c.id === a.employeeId);
      return sum + (collab?.workHoursPerWeek || 40);
    }, 0);

    const overloadHours = Math.max(0, allocatedHours - totalAvailableHours);
    const unallocatedHours = Math.max(0, totalAvailableHours - allocatedHours);

    return {
      squad: squad.name || `Squad ${squad.id}`,
      overload: overloadHours,
      allocated: Math.min(allocatedHours, totalAvailableHours),
      unallocated: unallocatedHours,
    };
  });

  if (chartInstances.workloadDistribution) {
    chartInstances.workloadDistribution.destroy();
  }

  chartInstances.workloadDistribution = new Chart(ctx, {
    type: "bar",
    data: {
      labels: workloadData.map(d => d.squad),
      datasets: [
        {
          label: "Tempo de Sobrecarga",
          data: workloadData.map(d => d.overload),
          backgroundColor: "rgba(211, 47, 47, 0.6)",
        },
        {
          label: "Horas Alocadas",
          data: workloadData.map(d => d.allocated),
          backgroundColor: "rgba(64, 221, 254, 0.6)",
        },
        {
          label: "Horas Não Alocadas",
          data: workloadData.map(d => d.unallocated),
          backgroundColor: "rgba(200, 200, 200, 0.6)",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
        },
        y: {
          stacked: true,
          beginAtZero: true,
          title: {
            display: true,
            text: "Horas",
          },
        },
      },
    },
  });
}

function updateSkillsHeatmapChart() {
  const ctx = document.getElementById("skillsHeatmapChart");
  if (!ctx) return;

  const filteredData = getFilteredData();

  // Criar matriz de skills x squads
  const skillsList = [...new Set(
    filteredData.collaborators.flatMap(c => 
      (c.skills || []).map(s => s.name || s.id)
    )
  )].slice(0, 10); // Limitar a 10 skills para visualização

  const heatmapData = skillsList.map(skill => {
    return filteredData.squads.map(squad => {
      const squadAllocations = filteredData.allocations.filter(a => a.squadId === squad.id);
      const squadMembers = squadAllocations.map(a => 
        filteredData.collaborators.find(c => c.id === a.employeeId)
      ).filter(Boolean);

      const count = squadMembers.filter(member => 
        member.skills && member.skills.some(s => (s.name || s.id) === skill)
      ).length;

      return count;
    });
  });

  if (chartInstances.skillsHeatmap) {
    chartInstances.skillsHeatmap.destroy();
  }

  // Chart.js não tem heatmap nativo, então vamos usar um gráfico de barras agrupadas
  chartInstances.skillsHeatmap = new Chart(ctx, {
    type: "bar",
    data: {
      labels: filteredData.squads.map(s => s.name || `Squad ${s.id}`),
      datasets: skillsList.map((skill, idx) => ({
        label: skill,
        data: heatmapData[idx],
        backgroundColor: `hsl(${idx * 36}, 70%, 60%)`,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: false,
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Número de Colaboradores",
          },
        },
      },
    },
  });
}

// ==================== TABELAS ====================

function updateAllTables() {
  updateTopIdleSquadsTable();
  updateTopOverloadSquadsTable();
  updateCollaboratorsTable();
  updateMarketSkillsTable();
  updateEmployeeSkillsTable();
}

function calculateSquadStats() {
  const filteredData = getFilteredData();
  return filteredData.squads.map(squad => {
    const squadAllocations = filteredData.allocations.filter(a => a.squadId === squad.id);
    const squadMembers = squadAllocations.map(a => 
      filteredData.collaborators.find(c => c.id === a.employeeId)
    ).filter(Boolean);

    let totalOverload = 0;
    let totalIdle = 0;
    let count = 0;

    squadMembers.forEach(member => {
      const allocatedHours = squadAllocations
        .filter(a => a.employeeId === member.id)
        .reduce((sum, a) => sum + (a.hours || 0), 0);
      const availableHours = member.workHoursPerWeek || 40;
      
      if (allocatedHours > availableHours) {
        totalOverload += ((allocatedHours - availableHours) / availableHours) * 100;
      } else if (allocatedHours < availableHours * 0.8) {
        totalIdle += ((availableHours - allocatedHours) / availableHours) * 100;
      }
      count++;
    });

    return {
      squad: squad.name || `Squad ${squad.id}`,
      overloadPercentage: count > 0 ? totalOverload / count : 0,
      idlePercentage: count > 0 ? totalIdle / count : 0,
    };
  });
}

function getIdleStatus(idlePercentage) {
  if (idlePercentage <= 5) {
    return { text: "OK", class: "good" };
  } else if (idlePercentage <= 15) {
    return { text: "Atenção", class: "warning" };
  } else {
    return { text: "Acima", class: "bad" };
  }
}

function getOverloadStatus(overloadPercentage) {
  if (overloadPercentage <= 10) {
    return { text: "OK", class: "good" };
  } else if (overloadPercentage <= 20) {
    return { text: "Atenção", class: "warning" };
  } else {
    return { text: "Acima", class: "bad" };
  }
}

function updateTopIdleSquadsTable() {
  const tbody = document.getElementById("topIdleSquadsTableBody");
  if (!tbody) return;

  const squadStats = calculateSquadStats();
  const sortedByIdle = [...squadStats].sort((a, b) => b.idlePercentage - a.idlePercentage);

  // Aplicar paginação
  const { currentPage, itemsPerPage } = paginationState.idleSquads;
  const paginatedSquads = paginateData(sortedByIdle, currentPage, itemsPerPage);
  
  // Atualizar controles de paginação
  updatePaginationControls('idleSquads', currentPage, sortedByIdle.length, itemsPerPage);

  tbody.innerHTML = "";
  paginatedSquads.forEach((stat, idx) => {
    const actualRank = (currentPage - 1) * itemsPerPage + idx + 1;
    const row = document.createElement("tr");
    const status = getIdleStatus(stat.idlePercentage);
    const shouldHighlight = stat.idlePercentage > 15;
    
    row.innerHTML = `
      <td>${actualRank}</td>
      <td>${stat.squad}</td>
      <td class="${shouldHighlight ? 'highlight' : ''}">${formatPercentage(stat.idlePercentage)}</td>
      <td><span class="status-badge ${status.class}">${status.text}</span></td>
    `;
    tbody.appendChild(row);
  });
}

function updateTopOverloadSquadsTable() {
  const tbody = document.getElementById("topOverloadSquadsTableBody");
  if (!tbody) return;

  const squadStats = calculateSquadStats();
  const sortedByOverload = [...squadStats].sort((a, b) => b.overloadPercentage - a.overloadPercentage);

  // Aplicar paginação
  const { currentPage, itemsPerPage } = paginationState.overloadSquads;
  const paginatedSquads = paginateData(sortedByOverload, currentPage, itemsPerPage);
  
  // Atualizar controles de paginação
  updatePaginationControls('overloadSquads', currentPage, sortedByOverload.length, itemsPerPage);

  tbody.innerHTML = "";
  paginatedSquads.forEach((stat, idx) => {
    const actualRank = (currentPage - 1) * itemsPerPage + idx + 1;
    const row = document.createElement("tr");
    const status = getOverloadStatus(stat.overloadPercentage);
    const shouldHighlight = stat.overloadPercentage > 20;
    
    row.innerHTML = `
      <td>${actualRank}</td>
      <td>${stat.squad}</td>
      <td class="${shouldHighlight ? 'highlight' : ''}">${formatPercentage(stat.overloadPercentage)}</td>
      <td><span class="status-badge ${status.class}">${status.text}</span></td>
    `;
    tbody.appendChild(row);
  });
}

function updateCollaboratorsTable() {
  const tbody = document.getElementById("collaboratorsTableBody");
  if (!tbody) return;

  const sortBy = document.getElementById("collaboratorSortBy")?.value || "name";
  const filteredData = getFilteredData();

  let collaborators = filteredData.collaborators.map(collab => {
    const allocations = filteredData.allocations.filter(a => a.employeeId === collab.id);
    const allocatedHours = allocations.reduce((sum, a) => sum + (a.hours || 0), 0);
    const availableHours = collab.workHoursPerWeek || 40;
    const allocatedPercentage = (allocatedHours / availableHours) * 100;
    const availablePercentage = 100 - allocatedPercentage;
    
    const overloadPercentage = allocatedHours > availableHours 
      ? ((allocatedHours - availableHours) / availableHours) * 100 
      : 0;
    const idlePercentage = allocatedHours < availableHours * 0.8
      ? ((availableHours - allocatedHours) / availableHours) * 100
      : 0;

    // Buscar squads de todas as alocações do colaborador (não apenas as filtradas)
    // para garantir que apareçam mesmo quando não há alocações no período filtrado
    const allAllocations = dashboardData.allocations.filter(a => {
      // Comparação flexível de IDs
      return String(a.employeeId) === String(collab.id);
    });
    
    // Buscar squadIds únicos das alocações
    const squadIds = [...new Set(allAllocations.map(a => a.squadId).filter(id => id != null && id !== undefined))];
    
    // Buscar os squads correspondentes
    const squads = [];
    squadIds.forEach(squadId => {
      const squad = dashboardData.squads.find(s => String(s.id) === String(squadId));
      if (squad) {
        squads.push(squad.name || `Squad ${squad.id}`);
      }
    });
    
    // Remover duplicatas
    const uniqueSquads = [...new Set(squads)];

    return {
      ...collab,
      allocatedPercentage,
      availablePercentage,
      overloadPercentage,
      idlePercentage,
      squads: uniqueSquads.length > 0 ? uniqueSquads.join(", ") : "—",
    };
  });

  // Ordenar
  switch (sortBy) {
    case "overload-desc":
      collaborators.sort((a, b) => b.overloadPercentage - a.overloadPercentage);
      break;
    case "overload-asc":
      collaborators.sort((a, b) => a.overloadPercentage - b.overloadPercentage);
      break;
    case "idle-desc":
      collaborators.sort((a, b) => b.idlePercentage - a.idlePercentage);
      break;
    case "idle-asc":
      collaborators.sort((a, b) => a.idlePercentage - b.idlePercentage);
      break;
    default:
      collaborators.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }

  // Aplicar paginação
  const { currentPage, itemsPerPage } = paginationState.collaborators;
  const paginatedCollaborators = paginateData(collaborators, currentPage, itemsPerPage);
  
  // Atualizar controles de paginação
  updatePaginationControls('collaborators', currentPage, collaborators.length, itemsPerPage);

  tbody.innerHTML = "";
  paginatedCollaborators.forEach(collab => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${collab.name || "—"}</td>
      <td>${collab.jobTitle || "—"}</td>
      <td>${collab.squads}</td>
      <td>${formatPercentage(collab.allocatedPercentage)}</td>
      <td>${formatPercentage(collab.availablePercentage)}</td>
      <td class="${collab.overloadPercentage > 0 ? 'highlight' : ''}">${formatPercentage(collab.overloadPercentage)}</td>
      <td class="${collab.idlePercentage > 0 ? 'highlight' : ''}">${formatPercentage(collab.idlePercentage)}</td>
    `;
    tbody.appendChild(row);
  });
}

// Skills mais frequentes no mercado (dados mockados baseados em tendências do mercado)
const marketSkillsFrequency = {
  "JavaScript": 95,
  "Python": 88,
  "React": 85,
  "Node.js": 82,
  "TypeScript": 80,
  "AWS": 78,
  "Docker": 75,
  "Kubernetes": 72,
  "SQL": 70,
  "Java": 68,
};

function updateMarketSkillsTable() {
  const tbody = document.getElementById("marketSkillsTableBody");
  if (!tbody) return;

  // Criar lista de skills do mercado ordenada por frequência
  const marketSkills = Object.entries(marketSkillsFrequency)
    .map(([name, frequency]) => ({ name, frequency }))
    .sort((a, b) => b.frequency - a.frequency);

  // Aplicar paginação
  const { currentPage, itemsPerPage } = paginationState.marketSkills;
  const paginatedSkills = paginateData(marketSkills, currentPage, itemsPerPage);
  
  // Atualizar controles de paginação
  updatePaginationControls('marketSkills', currentPage, marketSkills.length, itemsPerPage);

  tbody.innerHTML = "";
  paginatedSkills.forEach((skill, idx) => {
    const actualRank = (currentPage - 1) * itemsPerPage + idx + 1;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${actualRank}</td>
      <td>${skill.name}</td>
      <td>${skill.frequency}%</td>
    `;
    tbody.appendChild(row);
  });
}

function updateEmployeeSkillsTable() {
  const tbody = document.getElementById("employeeSkillsTableBody");
  if (!tbody) return;

  const filteredData = getFilteredData();

  // Contar quantos colaboradores possuem cada skill
  const skillCount = {};
  filteredData.collaborators.forEach(collab => {
    if (collab.skills && Array.isArray(collab.skills)) {
      collab.skills.forEach(skill => {
        const skillName = skill.name || skill.id;
        if (!skillCount[skillName]) {
          skillCount[skillName] = {
            name: skillName,
            count: 0,
          };
        }
        skillCount[skillName].count++;
      });
    }
  });

  // Ordenar por quantidade de colaboradores (mais possuídas primeiro)
  const employeeSkills = Object.values(skillCount)
    .sort((a, b) => b.count - a.count);

  // Aplicar paginação
  const { currentPage, itemsPerPage } = paginationState.employeeSkills;
  const paginatedSkills = paginateData(employeeSkills, currentPage, itemsPerPage);
  
  // Atualizar controles de paginação
  updatePaginationControls('employeeSkills', currentPage, employeeSkills.length, itemsPerPage);

  tbody.innerHTML = "";
  paginatedSkills.forEach((skill, idx) => {
    const actualRank = (currentPage - 1) * itemsPerPage + idx + 1;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${actualRank}</td>
      <td>${skill.name}</td>
      <td>${skill.count}</td>
    `;
    tbody.appendChild(row);
  });
}

// ==================== DASHBOARD DO COLABORADOR ====================

function getCollaboratorData() {
  if (!dashboardData.userId) {
    console.warn("⚠️ userId não definido");
    // Tentar usar o primeiro colaborador como fallback
    if (dashboardData.collaborators.length > 0) {
      dashboardData.userId = dashboardData.collaborators[0].id;
      localStorage.setItem("userId", dashboardData.userId);
      console.log("✅ userId definido como primeiro colaborador:", dashboardData.userId);
    } else {
      return null;
    }
  }

  // Comparar IDs de forma flexível (string ou número)
  const collab = dashboardData.collaborators.find(c => {
    const collabId = String(c.id);
    const userId = String(dashboardData.userId);
    return collabId === userId;
  });
  
  if (!collab) {
    console.warn(`⚠️ Colaborador com ID ${dashboardData.userId} não encontrado`);
    console.log("Colaboradores disponíveis:", dashboardData.collaborators.map(c => ({ id: c.id, name: c.name })));
    // Tentar usar o primeiro colaborador como fallback
    if (dashboardData.collaborators.length > 0) {
      const firstCollab = dashboardData.collaborators[0];
      dashboardData.userId = firstCollab.id;
      localStorage.setItem("userId", dashboardData.userId);
      console.log("✅ Usando primeiro colaborador como fallback:", firstCollab.id);
      return getCollaboratorData(); // Recursão para tentar novamente
    }
    return null;
  }

  // Aplicar filtro de período
  const timeRange = dashboardData.currentTimeFilter;
  const dateFilter = getDateFilter(timeRange);

  // Filtrar alocações por período - comparar IDs de forma flexível
  let allocations = dashboardData.allocations.filter(a => {
    const allocEmployeeId = String(a.employeeId || '');
    const userId = String(dashboardData.userId || '');
    return allocEmployeeId === userId;
  });
  
  console.log(`🔍 Alocações encontradas para userId ${dashboardData.userId}:`, allocations.length);

  if (dateFilter) {
    allocations = allocations.filter(a => {
      const allocDate = a.startDate || a.date;
      return allocDate && new Date(allocDate) >= dateFilter;
    });
  }

  // Obter squads únicos
  const squadIds = [...new Set(allocations.map(a => a.squadId).filter(id => id != null))];
  const squads = squadIds
    .map(id => dashboardData.squads.find(s => String(s.id) === String(id)))
    .filter(Boolean);

  // REGRA DE NEGÓCIO: Buscar projetos através do projectId dos squads
  const projectIds = [...new Set(squads.map(s => s.projectId).filter(id => id != null))];
  const projects = dashboardData.projects.filter(p => 
    projectIds.includes(p.id)
  );

  // Filtrar projetos por período se necessário
  const filteredProjects = dateFilter 
    ? projects.filter(p => {
        const projectDate = p.startDate || p.createdAt;
        return projectDate && new Date(projectDate) >= dateFilter;
      })
    : projects;

  const result = {
    collab,
    allocations,
    squads,
    projects: filteredProjects,
  };
  
  // Log para debug
  console.log(`📊 Dados do colaborador (ID: ${dashboardData.userId}):`, {
    allocations: allocations.length,
    totalHours: allocations.reduce((sum, a) => sum + (a.hours || 0), 0),
    squads: squads.length,
    projects: filteredProjects.length,
    timeFilter: dashboardData.currentTimeFilter
  });

  return result;
}

function updateCollaboratorKPIs() {
  console.log("📊 updateCollaboratorKPIs chamado, userId:", dashboardData.userId);
  
  if (!dashboardData.userId) {
    console.warn("⚠️ userId não definido, tentando usar primeiro colaborador");
    if (dashboardData.collaborators.length > 0) {
      dashboardData.userId = dashboardData.collaborators[0].id;
      localStorage.setItem("userId", dashboardData.userId);
      console.log("✅ userId definido como:", dashboardData.userId);
    } else {
      console.error("❌ Nenhum colaborador disponível");
      return;
    }
  }

  const data = getCollaboratorData();
  if (!data) {
    console.error("❌ getCollaboratorData retornou null");
    return;
  }
  
  console.log("✅ Dados obtidos:", {
    allocations: data.allocations.length,
    squads: data.squads.length,
    projects: data.projects.length
  });

  const { collab, allocations, squads, projects } = data;

  // Calcular horas totais alocadas
  const totalHours = allocations.reduce((sum, a) => sum + (a.hours || 0), 0);

  // Contar squads ativas (squads com alocações no período)
  const activeSquads = squads.length;

  // Contar projetos únicos
  const uniqueProjects = projects.length;

  // Atualizar elementos (usando IDs novos)
  const updateElement = (id, value) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  };

  updateElement("collab-total-projects", uniqueProjects);
  updateElement("collab-active-squads", activeSquads);
  updateElement("collab-total-hours", `${totalHours}h`);

  // Calcular % de Alocação
  const availableHours = collab.workHoursPerWeek || 40;
  const allocationPercentage = availableHours > 0 ? (totalHours / availableHours) * 100 : 0;
  updateElement("collab-allocation-percentage", formatPercentage(allocationPercentage));

  // Calcular Média de Horas por Projeto
  const avgHoursPerProject = uniqueProjects > 0 ? (totalHours / uniqueProjects) : 0;
  updateElement("collab-avg-hours-project", `${Math.round(avgHoursPerProject)}h`);

  // Manter compatibilidade com IDs antigos se existirem
  updateElement("my-allocated-hours", `${totalHours}h`);
  updateElement("my-squads-count", activeSquads);
  updateElement("my-projects-count", uniqueProjects);
}

function updateCollaboratorCharts() {
  updateCollaboratorWorkloadChart();
  updateCollaboratorHoursEvolutionChart();
  updateCollaboratorSquadsComparisonChart();
  updateCollaboratorProjectsComparisonChart();
}

// Função para atualizar apenas os gráficos de carga horária
function updateCollaboratorWorkloadCharts() {
  updateCollaboratorWorkloadChart();
  updateCollaboratorHoursEvolutionChart();
}

function updateCollaboratorWorkloadChart() {
  const ctx = document.getElementById("collabWorkloadDistributionChart");
  if (!ctx || !dashboardData.userId) return;

  const data = getCollaboratorData();
  if (!data) return;

  const { allocations, squads, projects } = data;

  // Agrupar horas por squad
  const hoursBySquad = {};
  allocations.forEach(a => {
    const squadId = a.squadId;
    if (!hoursBySquad[squadId]) {
      hoursBySquad[squadId] = 0;
    }
    hoursBySquad[squadId] += (a.hours || 0);
  });

  // Criar dados para o gráfico: horas por squad
  const squadNames = [];
  const hoursData = [];
  const colors = [
    "rgba(117, 18, 249, 0.6)",
    "rgba(64, 221, 254, 0.6)",
    "rgba(250, 18, 226, 0.6)",
    "rgba(211, 47, 47, 0.6)",
    "rgba(46, 125, 50, 0.6)",
    "rgba(255, 193, 7, 0.6)",
  ];

  Object.entries(hoursBySquad).forEach(([squadId, hours], idx) => {
    const squad = squads.find(s => String(s.id) === String(squadId));
    if (squad) {
      squadNames.push(squad.name || `Squad ${squadId}`);
      hoursData.push(hours);
    }
  });

  // Se não houver dados por squad, tentar agrupar por projeto
  if (squadNames.length === 0 && projects.length > 0) {
    const hoursByProject = {};
    allocations.forEach(a => {
      const squadId = a.squadId;
      const squad = squads.find(s => String(s.id) === String(squadId));
      if (squad && squad.projectId) {
        // REGRA DE NEGÓCIO: Um squad só pode ter um projeto
        const relatedProject = projects.find(p => String(p.id) === String(squad.projectId));
        if (relatedProject) {
          if (!hoursByProject[relatedProject.id]) {
            hoursByProject[relatedProject.id] = 0;
          }
          hoursByProject[relatedProject.id] += (a.hours || 0);
        }
      }
    });

    Object.entries(hoursByProject).forEach(([projectId, hours], idx) => {
      const project = projects.find(p => String(p.id) === String(projectId));
      if (project) {
        squadNames.push(project.name || `Projeto ${projectId}`);
        hoursData.push(Math.round(hours));
      }
    });
  }

  if (chartInstances.collabWorkloadDistribution) {
    chartInstances.collabWorkloadDistribution.destroy();
  }

  if (squadNames.length === 0) {
    // Gráfico vazio
    chartInstances.collabWorkloadDistribution = new Chart(ctx, {
      type: "bar",
    data: {
        labels: ["Sem dados"],
      datasets: [{
          label: "Horas Alocadas",
          data: [0],
          backgroundColor: "rgba(200, 200, 200, 0.6)",
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Horas",
            },
          },
        },
      },
    });
    return;
  }

  chartInstances.collabWorkloadDistribution = new Chart(ctx, {
    type: "bar",
    indexAxis: "y",
    data: {
      labels: squads,
      datasets: seniorities.map((seniority, idx) => ({
        label: seniority,
        data: squads.map(squad => seniorityBySquad[squad][seniority] || 0),
        backgroundColor: [
          "rgba(64, 221, 254, 0.6)",
          "rgba(117, 18, 249, 0.6)",
          "rgba(250, 18, 226, 0.6)",
          "rgba(255, 252, 54, 0.6)",
        ][idx],
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      scales: {
        x: {
          stacked: true,
          beginAtZero: true,
        },
        y: {
          stacked: true,
        },
      },
    },
  });
}

function updateCollaboratorHoursEvolutionChart() {
  const ctx = document.getElementById("collabHoursEvolutionChart");
  if (!ctx || !dashboardData.userId) return;

  const data = getCollaboratorData();
  if (!data) return;

  const { allocations } = data;
  const timeRange = dashboardData.currentTimeFilter;

  // Determinar período e intervalo baseado no filtro
  let periodDays, intervalDays, labels = [];
  const now = new Date();

  switch (timeRange) {
    case "week":
      periodDays = 7;
      intervalDays = 1; // Diário
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }));
      }
      break;
    case "month":
      periodDays = 30;
      intervalDays = 7; // Semanal
      for (let i = 3; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - (i * 7));
        labels.push(`Semana ${4 - i}`);
      }
      break;
    case "quarter":
      periodDays = 90;
      intervalDays = 30; // Mensal
      for (let i = 2; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        labels.push(date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" }));
      }
      break;
    case "semester":
      periodDays = 180;
      intervalDays = 30; // Mensal
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        labels.push(date.toLocaleDateString("pt-BR", { month: "short" }));
      }
      break;
    case "year":
      periodDays = 365;
      intervalDays = 90; // Trimestral
      for (let i = 3; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - (i * 3));
        labels.push(`T${4 - i} ${date.getFullYear()}`);
      }
      break;
    default:
      periodDays = 30;
      intervalDays = 7;
      labels = ["Semana 1", "Semana 2", "Semana 3", "Semana 4"];
  }

  // Agrupar alocações por período
  const hoursByPeriod = new Array(labels.length).fill(0);
  
  allocations.forEach(alloc => {
    const allocDate = new Date(alloc.startDate || alloc.date);
    const daysAgo = Math.floor((now - allocDate) / (1000 * 60 * 60 * 24));
    
    if (daysAgo >= 0 && daysAgo < periodDays) {
      const periodIndex = Math.floor(daysAgo / intervalDays);
      if (periodIndex < hoursByPeriod.length) {
        hoursByPeriod[periodIndex] += (alloc.hours || 0);
      }
    }
  });

  if (chartInstances.collabHoursEvolution) {
    chartInstances.collabHoursEvolution.destroy();
  }

  chartInstances.collabHoursEvolution = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Horas Alocadas",
        data: hoursByPeriod,
        borderColor: "rgba(117, 18, 249, 1)",
        backgroundColor: "rgba(117, 18, 249, 0.1)",
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: "rgba(117, 18, 249, 1)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Horas",
          },
        },
        x: {
          title: {
            display: true,
            text: "Período",
          },
        },
      },
      plugins: {
        legend: {
          display: true,
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y}h`;
            },
          },
        },
      },
    },
  });
}

function updateCollaboratorSquadsComparisonChart() {
  const ctx = document.getElementById("collabSquadsComparisonChart");
  if (!ctx || !dashboardData.userId) return;

  const data = getCollaboratorData();
  if (!data) return;

  const { allocations, squads } = data;

  // Agrupar horas por squad
  const hoursBySquad = {};
  allocations.forEach(a => {
    const squadId = a.squadId;
    if (!hoursBySquad[squadId]) {
      hoursBySquad[squadId] = 0;
    }
    hoursBySquad[squadId] += (a.hours || 0);
  });

  // Criar dados para o gráfico
  const squadNames = [];
  const hoursData = [];
  const colors = [
    "rgba(117, 18, 249, 0.6)",
          "rgba(64, 221, 254, 0.6)",
    "rgba(250, 18, 226, 0.6)",
          "rgba(211, 47, 47, 0.6)",
    "rgba(46, 125, 50, 0.6)",
  ];

  Object.entries(hoursBySquad).forEach(([squadId, hours], idx) => {
    const squad = squads.find(s => String(s.id) === String(squadId));
    if (squad) {
      squadNames.push(squad.name || `Squad ${squadId}`);
      hoursData.push(hours);
    }
  });

  if (chartInstances.collabSquadsComparison) {
    chartInstances.collabSquadsComparison.destroy();
  }

  if (squadNames.length === 0) {
    chartInstances.collabSquadsComparison = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Sem dados"],
        datasets: [{
          label: "Horas Alocadas",
          data: [0],
          backgroundColor: "rgba(200, 200, 200, 0.6)",
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Horas",
            },
          },
        },
      },
    });
    return;
  }

  chartInstances.collabSquadsComparison = new Chart(ctx, {
    type: "bar",
    data: {
      labels: squadNames,
      datasets: [{
        label: "Horas Alocadas",
        data: hoursData,
        backgroundColor: hoursData.map((_, idx) => colors[idx % colors.length]),
        borderColor: hoursData.map((_, idx) => colors[idx % colors.length].replace('0.6', '1')),
        borderWidth: 1,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Horas",
          },
        },
        x: {
          ticks: {
            maxRotation: 0,
            minRotation: 0,
            autoSkip: false,
            callback: function(value, index) {
              const label = squadNames[index];
              if (!label) return '';
              
              // Quebrar linha se o nome for muito longo (mais de 12 caracteres)
              if (label.length > 12) {
                // Tentar quebrar em espaços primeiro
                const words = label.split(' ');
                if (words.length > 1) {
                  // Se tiver múltiplas palavras, tentar dividir de forma equilibrada
                  let firstLine = '';
                  let secondLine = '';
                  const midPoint = Math.ceil(words.length / 2);
                  
                  firstLine = words.slice(0, midPoint).join(' ');
                  secondLine = words.slice(midPoint).join(' ');
                  
                  // Se a primeira linha ainda for muito longa, quebrar no meio
                  if (firstLine.length > 15) {
                    const mid = Math.floor(label.length / 2);
                    const spaceIndex = label.lastIndexOf(' ', mid);
                    if (spaceIndex > 0) {
                      return label.substring(0, spaceIndex) + '\n' + label.substring(spaceIndex + 1);
                    }
                    return label.substring(0, mid) + '\n' + label.substring(mid);
                  }
                  
                  return firstLine + '\n' + secondLine;
                } else {
                  // Se não tiver espaços, quebrar no meio
                  const mid = Math.floor(label.length / 2);
                  return label.substring(0, mid) + '\n' + label.substring(mid);
                }
              }
              return label;
            },
          },
        },
      },
      plugins: {
        legend: {
          display: true,
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = hoursData.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((context.parsed.y / total) * 100).toFixed(1) : 0;
              return `${context.dataset.label}: ${context.parsed.y}h (${percentage}%)`;
            },
          },
        },
      },
    },
  });
}

function updateCollaboratorProjectsComparisonChart() {
  const ctx = document.getElementById("collabProjectsComparisonChart");
  if (!ctx || !dashboardData.userId) return;

  const data = getCollaboratorData();
  if (!data) return;

  const { allocations, squads, projects } = data;

  // Calcular horas totais
  const totalHours = allocations.reduce((sum, a) => sum + (a.hours || 0), 0);

  // REGRA DE NEGÓCIO: Um projeto pode ter vários squads, mas um squad só pode ter um projeto
  // Agrupar projetos com suas horas baseado nos squads vinculados
  const projectData = [];
  const projectMap = new Map(); // Para agrupar squads por projeto
  
  // Primeiro, agrupar squads por projeto
  squads.forEach(squad => {
    if (squad.projectId) {
      if (!projectMap.has(squad.projectId)) {
        projectMap.set(squad.projectId, []);
      }
      projectMap.get(squad.projectId).push(squad);
    }
  });
  
  // Para cada projeto, calcular horas totais de todos os squads vinculados
  projects.forEach(project => {
    const squadsInProject = projectMap.get(project.id) || [];
    let totalProjectHours = 0;
    
    squadsInProject.forEach(squad => {
      const squadAllocations = allocations.filter(a => 
        String(a.squadId) === String(squad.id)
      );
      const squadHours = squadAllocations.reduce((sum, a) => sum + (a.hours || 0), 0);
      totalProjectHours += squadHours;
    });
    
    projectData.push({
      project,
      hours: totalProjectHours,
    });
  });

  // Ordenar por horas e pegar os principais
  projectData.sort((a, b) => b.hours - a.hours);

  const projectNames = projectData.map(p => p.project.name || `Projeto ${p.project.id}`);
  const hoursData = projectData.map(p => p.hours);
  const colors = [
    "rgba(117, 18, 249, 0.6)",
    "rgba(64, 221, 254, 0.6)",
    "rgba(250, 18, 226, 0.6)",
    "rgba(211, 47, 47, 0.6)",
    "rgba(46, 125, 50, 0.6)",
    "rgba(255, 193, 7, 0.6)",
  ];

  if (chartInstances.collabProjectsComparison) {
    chartInstances.collabProjectsComparison.destroy();
  }

  if (projectNames.length === 0) {
    chartInstances.collabProjectsComparison = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Sem dados"],
        datasets: [{
          label: "Horas Alocadas",
          data: [0],
          backgroundColor: "rgba(200, 200, 200, 0.6)",
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Horas",
            },
          },
          x: {
            title: {
              display: true,
              text: "Projetos",
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    });
    return;
  }

  chartInstances.collabProjectsComparison = new Chart(ctx, {
    type: "bar",
    data: {
      labels: projectNames,
      datasets: [{
        label: "Horas Alocadas",
        data: hoursData,
        backgroundColor: hoursData.map((_, idx) => colors[idx % colors.length]),
        borderColor: hoursData.map((_, idx) => colors[idx % colors.length].replace('0.6', '1')),
        borderWidth: 1,
        categoryPercentage: 0.6,
        barPercentage: 0.8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 20,
          bottom: 80, // Espaço extra na parte inferior para os labels
          left: 10,
          right: 10
        }
      },
      scales: {
        x: {
          stacked: true,
        },
        y: {
          stacked: true,
          beginAtZero: true,
          title: {
            display: true,
            text: "Horas",
          },
          ticks: {
            padding: 15,
          },
        },
        x: {
          title: {
            display: true,
            text: "Projetos",
          },
          ticks: {
            maxRotation: 0,
            minRotation: 0,
            autoSkip: false,
            font: {
              size: 12
            },
            padding: 15,
            maxTicksLimit: 20,
          },
          afterFit: function(scale) {
            // Altura padrão para labels horizontais
            scale.height = scale.height + 20;
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const percentage = totalHours > 0 ? ((context.parsed.y / totalHours) * 100).toFixed(1) : 0;
              return `Horas Alocadas: ${context.parsed.y}h (${percentage}%)`;
            },
          },
        },
      },
    },
  });
}

function updateCollaboratorTables() {
  updateCollaboratorProjectsTable();
  updateCollaboratorSquadsTable();
}

function updateCollaboratorProjectsTable() {
  const tbody = document.getElementById("collabProjectsTableBody");
  if (!tbody) return;

  const data = getCollaboratorData();
  if (!data) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum dado disponível</td></tr>';
    return;
  }

  const { allocations, squads, projects } = data;

  console.log("📊 updateCollaboratorProjectsTable - Dados recebidos:", {
    allocations: allocations.length,
    squads: squads.length,
    projects: projects.length
  });

  // Calcular horas totais
  const totalHours = allocations.reduce((sum, a) => sum + (a.hours || 0), 0);

  // REGRA DE NEGÓCIO: Um projeto pode ter vários squads, mas um squad só pode ter um projeto
  // Agrupar projetos com suas horas baseado nos squads vinculados
  const projectData = [];
  const projectMap = new Map(); // Para agrupar squads por projeto
  
  // Primeiro, agrupar squads por projeto
  squads.forEach(squad => {
    if (squad.projectId) {
      if (!projectMap.has(squad.projectId)) {
        projectMap.set(squad.projectId, []);
      }
      projectMap.get(squad.projectId).push(squad);
    }
  });
  
  // Para cada projeto, calcular horas totais de todos os squads vinculados
  projects.forEach(project => {
    const squadsInProject = projectMap.get(project.id) || [];
    let totalProjectHours = 0;
    
    squadsInProject.forEach(squad => {
      const squadAllocations = allocations.filter(a => 
        String(a.squadId) === String(squad.id)
      );
      const squadHours = squadAllocations.reduce((sum, a) => sum + (a.hours || 0), 0);
      totalProjectHours += squadHours;
    });
    
    const percentage = totalHours > 0 ? (totalProjectHours / totalHours) * 100 : 0;

    projectData.push({
      project,
      squad: squadsInProject[0] || null, // Usar o primeiro squad do projeto
      hours: totalProjectHours,
      percentage,
    });
  });

  console.log("📊 Projetos processados:", projectData.length);

  // Ordenar por horas (maior primeiro)
  projectData.sort((a, b) => b.hours - a.hours);

  // Aplicar paginação
  const { currentPage, itemsPerPage } = paginationState.collabProjects;
  const paginatedData = paginateData(projectData, currentPage, itemsPerPage);
  updatePaginationControls('collabProjects', currentPage, projectData.length, itemsPerPage);
  
  console.log("📊 Dados paginados:", paginatedData.length);

  tbody.innerHTML = "";
  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum projeto encontrado no período selecionado</td></tr>';
    return;
  }

  paginatedData.forEach(item => {
    const row = document.createElement("tr");
    const status = item.project.status || "N/A";
    const statusText = status === "EM_ANDAMENTO" ? "Em Andamento" : 
                       status === "PLANEJAMENTO" ? "Planejamento" :
                       status === "CONCLUÍDO" ? "Concluído" :
                       status === "CANCELADO" ? "Cancelado" : status;
    
    row.innerHTML = `
      <td>${item.project.name || "—"}</td>
      <td>${item.squad?.name || "—"}</td>
      <td><span class="status-badge ${status === "EM_ANDAMENTO" ? "active" : status === "CONCLUÍDO" ? "inactive" : ""}">${statusText}</span></td>
      <td>${item.hours}h</td>
      <td>${formatPercentage(item.percentage)}</td>
    `;
    tbody.appendChild(row);
  });
}

function updateCollaboratorSquadsTable() {
  const tbody = document.getElementById("collabSquadsTableBody");
  if (!tbody) return;

  const data = getCollaboratorData();
  if (!data) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Nenhum dado disponível</td></tr>';
    return;
  }

  const { allocations, squads, projects } = data;

  // Calcular horas totais
  const totalHours = allocations.reduce((sum, a) => sum + (a.hours || 0), 0);

  // Agrupar horas por squad
  const squadData = squads.map(squad => {
    const squadAllocations = allocations.filter(a => String(a.squadId) === String(squad.id));
    const squadHours = squadAllocations.reduce((sum, a) => sum + (a.hours || 0), 0);
    const percentage = totalHours > 0 ? (squadHours / totalHours) * 100 : 0;

    // REGRA DE NEGÓCIO: Um squad só pode ter um projeto
    const relatedProject = squad.projectId ? projects.find(p => String(p.id) === String(squad.projectId)) : null;
    const relatedProjects = relatedProject ? [relatedProject] : [];

    return {
      squad,
      hours: squadHours,
      percentage,
      projects: relatedProjects,
    };
  });

  // Ordenar por horas (maior primeiro)
  squadData.sort((a, b) => b.hours - a.hours);

  // Aplicar paginação
  const { currentPage, itemsPerPage } = paginationState.collabSquads;
  const paginatedData = paginateData(squadData, currentPage, itemsPerPage);
  updatePaginationControls('collabSquads', currentPage, squadData.length, itemsPerPage);

  tbody.innerHTML = "";
  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Nenhum squad encontrado no período selecionado</td></tr>';
    return;
  }

  paginatedData.forEach(item => {
    const row = document.createElement("tr");
    // Formatar projetos com quebra de linha (usando vírgula e espaço)
    const projectNames = item.projects.length > 0 
      ? item.projects.map(p => p.name || `Projeto ${p.id}`).join(", ")
      : "—";
    
    row.innerHTML = `
      <td>${item.squad.name || "—"}</td>
      <td>${item.hours}h</td>
      <td>${formatPercentage(item.percentage)}</td>
      <td style="white-space: normal; word-wrap: break-word; max-width: 300px;">${projectNames}</td>
    `;
    tbody.appendChild(row);
  });
}

// ==================== FUNÇÕES AUXILIARES ====================

// Função auxiliar para paginação
function paginateData(data, page, itemsPerPage) {
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return data.slice(startIndex, endIndex);
}

// Atualizar controles de paginação
function updatePaginationControls(tableId, currentPage, totalItems, itemsPerPage) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const pageInfo = document.getElementById(`${tableId}PageInfo`);
  const prevBtn = document.getElementById(`${tableId}PrevPage`);
  const nextBtn = document.getElementById(`${tableId}NextPage`);

  if (pageInfo) {
    pageInfo.textContent = `Página ${currentPage} de ${totalPages || 1}`;
  }

  if (prevBtn) {
    prevBtn.disabled = currentPage <= 1;
  }

  if (nextBtn) {
    nextBtn.disabled = currentPage >= totalPages;
  }
}

function getTimeRange() {
  return dashboardData.currentTimeFilter;
}

function getFilteredData() {
  let data = {
    projects: [...dashboardData.projects],
    squads: [...dashboardData.squads],
    collaborators: [...dashboardData.collaborators],
    allocations: [...dashboardData.allocations],
  };

  // Filtrar por squad se necessário
  if (dashboardData.currentSquadFilter !== "all") {
    const squadId = dashboardData.currentSquadFilter;
    const filteredSquad = data.squads.find(s => s.id == squadId);
    data.squads = data.squads.filter(s => s.id == squadId);
    data.allocations = data.allocations.filter(a => a.squadId == squadId);
    // REGRA DE NEGÓCIO: Filtrar projetos através do projectId do squad
    if (filteredSquad && filteredSquad.projectId) {
      data.projects = data.projects.filter(p => String(p.id) === String(filteredSquad.projectId));
    } else {
      data.projects = [];
    }
    
    // Filtrar colaboradores: mostrar apenas os que têm alocações no squad filtrado
    const employeeIdsInSquad = [...new Set(data.allocations.map(a => a.employeeId))];
    data.collaborators = data.collaborators.filter(c => employeeIdsInSquad.includes(c.id));
  }

  // Filtrar por período de tempo
  const timeRange = getTimeRange();
  const dateFilter = getDateFilter(timeRange);
  if (dateFilter) {
    console.log(`Filtrando dados por período: ${timeRange}, desde ${dateFilter.toLocaleDateString('pt-BR')}`);
    
    const projectsBefore = data.projects.length;
    const allocationsBefore = data.allocations.length;
    
    data.projects = data.projects.filter(p => {
      const projectDate = p.startDate || p.createdAt;
      return projectDate && new Date(projectDate) >= dateFilter;
    });
    data.allocations = data.allocations.filter(a => {
      const allocDate = a.startDate || a.date;
      return allocDate && new Date(allocDate) >= dateFilter;
    });
    
    console.log(`Projetos: ${projectsBefore} → ${data.projects.length}`);
    console.log(`Alocações: ${allocationsBefore} → ${data.allocations.length}`);
  }

  return data;
}

function getDateFilter(timeRange) {
  const now = new Date();
  switch (timeRange) {
    case "week":
      // Últimos 7 dias
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "month":
      // Últimos 30 dias
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "quarter":
      // Últimos 90 dias
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case "semester":
      // Últimos 180 dias
      return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    case "year":
      // Últimos 365 dias
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

function getCurrentWeek() {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
}

function isInWeek(date, weekStart) {
  if (!date) return false;
  const dateObj = new Date(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  return dateObj >= weekStart && dateObj < weekEnd;
}

function getLast6Months() {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(date);
  }
  return months;
}

function getDataForMonth(month) {
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  return {
    projects: dashboardData.projects.filter(p => {
      const projectDate = new Date(p.startDate || p.createdAt);
      return projectDate >= month && projectDate <= monthEnd;
    }),
    squads: dashboardData.squads,
    collaborators: dashboardData.collaborators,
    allocations: dashboardData.allocations.filter(a => {
      const allocDate = new Date(a.startDate || a.date);
      return allocDate >= month && allocDate <= monthEnd;
    }),
  };
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatPercentage(value) {
  return `${value.toFixed(1)}%`;
}

function formatDate(date) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("pt-BR");
}

function formatMonth(date) {
  return date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}

// Aguarda até o i18n estar pronto
function isI18nReady() {
  return window.i18n && typeof window.i18n.t === "function";
}

if (isI18nReady()) {
  // Já está pronto
} else {
  const interval = setInterval(() => {
    if (isI18nReady()) {
      clearInterval(interval);
    }
  }, 100);
}

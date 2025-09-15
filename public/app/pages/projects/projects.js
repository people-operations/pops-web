const projects = [
  {
    nome: "Sistema de Gestão RH",
    descricao: "Plataforma para gestão de colaboradores e folha de pagamento.",
    area: "RH",
    budget: 8,
    startedAt: "01/03/2024",
    tecnologias: ["Node.js", "React", "PostgreSQL"],
    preco: "R$ 60.000,00",
    status: "Em andamento",
  },
  {
    nome: "App de Vendas Mobile",
    descricao: "Aplicativo para força de vendas com integração a ERP.",
    area: "Comercial",
    budget: 5,
    startedAt: "01/03/2024",
    tecnologias: ["Flutter", "Firebase"],
    preco: "R$ 35.000,00",
    status: "Em andamento",
  },
  {
    nome: "Portal do Cliente",
    descricao: "Portal web para autoatendimento e abertura de chamados.",
    area: "Suporte",
    budget: 4,
    startedAt: "01/03/2024",
    tecnologias: ["Angular", "Java", "MySQL"],
    preco: "R$ 28.000,00",
    status: "Concluído",
  },
  {
    nome: "BI Analytics",
    descricao: "Dashboard de indicadores e relatórios gerenciais.",
    area: "Dados",
    budget: 3,
    startedAt: "01/03/2024",
    tecnologias: ["Power BI", "Python"],
    preco: "R$ 18.000,00",
    status: "Em andamento",
  },
  {
    nome: "Infraestrutura Cloud",
    descricao: "Migração de servidores para nuvem AWS.",
    area: "Infraestrutura",
    budget: 2,
    startedAt: "01/03/2024",
    tecnologias: ["AWS", "Terraform"],
    preco: "R$ 12.000,00",
    status: "Planejado",
  },
];

function interpolate(str, vars) {
  return str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

function renderProjects() {
  const container = document.getElementById("project-list");
  container.innerHTML = "";
  const i18n = window.i18n;
  projects.forEach((project) => {
    container.innerHTML += `
      <div class="project-card">
        <div class="project-header">
          <h3>${project.nome}</h3>
          <span class="tag-blue">${interpolate(i18n.t("projects.status"), {
            status: project.status,
          })}</span>
        </div>
        <p class="project-description">${project.descricao}</p>
        <p>
          <img src="/assets/svg/members.svg" alt="Área" style="vertical-align:middle; margin-right:4px; width:15px; height:15px;">
          <strong data-i18n="projects.area">${i18n.t(
            "projects.area"
          )}</strong> ${project.area}
        </p>
        <p>
          <img src="/assets/svg/budget.svg" alt="budget" style="vertical-align:middle; margin-right:4px; width:15px; height:15px;">
          <strong data-i18n="projects.budget">${i18n.t(
            "projects.budget"
          )}</strong> ${project.budget}
        </p>
        <p>
          <img src="/assets/svg/calendar.svg" alt="Início" style="vertical-align:middle; margin-right:4px; width:15px; height:15px;">
          <strong data-i18n="projects.startedAt">${i18n.t(
            "projects.startedAt"
          )}</strong> ${project.startedAt}
        </p>
        <p><strong data-i18n="projects.skills_needed">${i18n.t(
          "projects.skills_needed"
        )}</strong></p>
        <div class="tech-stack">
          ${project.tecnologias.map((tech) => `<span>${tech}</span>`).join("")}
        </div>
        <div class="hours">
        </div>
        <div class="project-footer">
          <span class="satisfaction-icon">★ 4.5 de satisfação</span>
          <button class="details-btn" data-i18n="projects.details" onclick="window.location.href='projects-detail/projects-detail.html'"></button>
        </div>
      </div>
    `;
  });
}

// Inicialização dinâmica para garantir tradução
if (typeof window !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    if (typeof renderProjects === "function") {
      renderProjects();
      if (window.i18n) window.i18n.apply();
    }
  });
}

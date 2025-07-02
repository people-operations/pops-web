const projects = [
  {
    nome: "Sistema de Gestão RH",
    descricao: "Plataforma para gestão de colaboradores e folha de pagamento.",
    area: "RH",
    membros: 8,
    tecnologias: ["Node.js", "React", "PostgreSQL"],
    horasAlocadas: 180,
    horasTotais: 200,
    preco: "R$ 60.000,00",
    status: "Em andamento",
  },
  {
    nome: "App de Vendas Mobile",
    descricao: "Aplicativo para força de vendas com integração a ERP.",
    area: "Comercial",
    membros: 5,
    tecnologias: ["Flutter", "Firebase"],
    horasAlocadas: 120,
    horasTotais: 150,
    preco: "R$ 35.000,00",
    status: "Em andamento",
  },
  {
    nome: "Portal do Cliente",
    descricao: "Portal web para autoatendimento e abertura de chamados.",
    area: "Suporte",
    membros: 4,
    tecnologias: ["Angular", "Java", "MySQL"],
    horasAlocadas: 90,
    horasTotais: 120,
    preco: "R$ 28.000,00",
    status: "Concluído",
  },
  {
    nome: "BI Analytics",
    descricao: "Dashboard de indicadores e relatórios gerenciais.",
    area: "Dados",
    membros: 3,
    tecnologias: ["Power BI", "Python"],
    horasAlocadas: 60,
    horasTotais: 80,
    preco: "R$ 18.000,00",
    status: "Em andamento",
  },
  {
    nome: "Infraestrutura Cloud",
    descricao: "Migração de servidores para nuvem AWS.",
    area: "Infraestrutura",
    membros: 2,
    tecnologias: ["AWS", "Terraform"],
    horasAlocadas: 40,
    horasTotais: 60,
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
    const porcentagem = (project.horasAlocadas / project.horasTotais) * 100;
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
          <img src="/assets/svg/area.svg" alt="Área" style="vertical-align:middle; margin-right:4px; width:15px; height:15px;">
          <strong data-i18n="projects.area">${i18n.t(
            "projects.area"
          )}</strong> ${project.area}
        </p>
        <p>
          <img src="/assets/svg/members.svg" alt="Membros" style="vertical-align:middle; margin-right:4px; width:15px; height:15px;">
          <strong data-i18n="projects.members">${i18n.t(
            "projects.members"
          )}</strong> ${project.membros}
        </p>
        <p><strong data-i18n="projects.capacity">${i18n.t(
          "projects.capacity"
        )}</strong></p>
        <div class="tech-stack">
          ${project.tecnologias.map((tech) => `<span>${tech}</span>`).join("")}
        </div>
        <div class="hours">
          <div class="hours-row">
            <span data-i18n="projects.allocated_hours">${i18n.t(
              "projects.allocated_hours"
            )}</span>
            <span class="hours-value">${project.horasAlocadas}h / ${
      project.horasTotais
    }h</span>
          </div>
          <div class="progress-bar">
            <div class="progress" style="width: ${porcentagem}%"></div>
          </div>
        </div>
        <div class="project-footer">
          <p class="by-month"><strong data-i18n="projects.per_month">${i18n.t(
            "projects.per_month"
          )}</strong> ${project.preco}</p>
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

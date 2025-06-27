const squads = [
  {
    nome: "Frontend Ninjas",
    descricao: "Equipe especializada em interfaces modernas e responsivas.",
    area: "Design & Frontend",
    membros: 4,
    tecnologias: ["React", "TypeScript", "Sass"],
    horasAlocadas: 120,
    horasTotais: 160,
    preco: "R$ 32.000,00",
    projetosAtivos: 3,
  },
  {
    nome: "Data Science Squad",
    descricao: "Time focado em análise de dados e machine learning.",
    area: "Dados",
    membros: 6,
    tecnologias: ["Python", "TensorFlow", "SQL"],
    horasAlocadas: 140,
    horasTotais: 180,
    preco: "R$ 45.000,00",
    projetosAtivos: 2,
  },
  {
    nome: "DevOps Masters",
    descricao: "Automação de deploys, infraestrutura e monitoramento.",
    area: "DevOps",
    membros: 3,
    tecnologias: ["AWS", "Docker", "Kubernetes"],
    horasAlocadas: 90,
    horasTotais: 120,
    preco: "R$ 28.000,00",
    projetosAtivos: 4,
  },
  {
    nome: "Mobile Force",
    descricao: "Desenvolvimento de apps nativos e híbridos.",
    area: "Mobile",
    membros: 5,
    tecnologias: ["Flutter", "Kotlin", "Swift"],
    horasAlocadas: 110,
    horasTotais: 150,
    preco: "R$ 36.000,00",
    projetosAtivos: 2,
  },
  {
    nome: "QA Guardians",
    descricao: "Garantia de qualidade, testes automatizados e manuais.",
    area: "Qualidade",
    membros: 4,
    tecnologias: ["Cypress", "Jest", "Postman"],
    horasAlocadas: 80,
    horasTotais: 100,
    preco: "R$ 18.000,00",
    projetosAtivos: 5,
  },
  {
    nome: "Backend Titans",
    descricao: "APIs robustas, integrações e arquitetura escalável.",
    area: "Backend",
    membros: 7,
    tecnologias: ["Node.js", "Go", "MongoDB"],
    horasAlocadas: 200,
    horasTotais: 220,
    preco: "R$ 52.000,00",
    projetosAtivos: 6,
  },
  {
    nome: "UX Researchers",
    descricao: "Pesquisa e validação de experiência do usuário.",
    area: "UX",
    membros: 2,
    tecnologias: ["Figma", "Hotjar", "Maze"],
    horasAlocadas: 60,
    horasTotais: 80,
    preco: "R$ 12.000,00",
    projetosAtivos: 1,
  },
];

function renderSquads() {
  const container = document.getElementById("squad-list");
  squads.forEach((squad) => {
    const porcentagem = (squad.horasAlocadas / squad.horasTotais) * 100;

    container.innerHTML += `
      <div class="squad-card">
        <div class="squad-header">
          <h3>${squad.nome}</h3>
          <span class="tag-green">${squad.projetosAtivos} projetos ativos</span>
        </div>
        <p class="squad-description">${squad.descricao}</p>
        <p><img src="/assets/svg/squad-area.svg" alt="Área" style="vertical-align:middle; margin-right:4px; width:15px; height:15px;"><strong>Área:</strong> ${
          squad.area
        }</p>
        <p><img src="/assets/svg/members.svg" alt="Membros" style="vertical-align:middle; margin-right:4px; width:15px; height:15px;"><strong>Membros:</strong> ${
          squad.membros
        }</p>
        <p><strong>Capacidade do squad:</strong></p>
        <div class="tech-stack">
          ${squad.tecnologias.map((tech) => `<span>${tech}</span>`).join("")}
        </div>
        <div class="hours">
          <div class="hours-row">
            <span>Horas alocadas</span>
            <span class="hours-value">${squad.horasAlocadas}h / ${
      squad.horasTotais
    }h</span>
          </div>
          <div class="progress-bar">
            <div class="progress" style="width: ${porcentagem}%"></div>
          </div>
        </div>
        <div class="squad-footer">
          <p class="by-month"><strong>Por mês:</strong> ${squad.preco}</p>
          <button class="details-btn" onclick="window.location.href='squads-detail/squads-detail.html'">
        Mais detalhes</button>
        </div>
      </div>
    `;
  });
}

renderSquads();

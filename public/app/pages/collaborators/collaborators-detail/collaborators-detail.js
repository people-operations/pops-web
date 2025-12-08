import { apiService } from "../../../../assets/js/apiService.js";

document.addEventListener("DOMContentLoaded", async () => {
  showSkeletonDetail();

  const params = new URLSearchParams(window.location.search);
  const employeeId = params.get("id");
  if (!employeeId) {
    console.error("ID do colaborador não fornecido na URL!");
    return;
  }
  try {
    const employee = await apiService.getCollaboratorById(employeeId);
    if (!employee)
      throw new Error("Colaborador não encontrado ou erro na API.");
    restoreDetailLayout();
    await patchValue(employee);
  } catch (error) {
    console.error("Erro ao carregar colaborador:", error);
  }
  // Restaura o layout real do aside .summary (e outros blocos se necessário)
  function restoreDetailLayout() {
    const summary = document.querySelector(".summary");
    if (summary) {
      summary.innerHTML = `
      <div class="summary-header">
        <span class="tag-green mb-16">Ativo</span>
        <div class="avatar-display">
          <div class="avatar-large text-avatar"></div>
        </div>
      </div>
      <div class="d-flex text-center flex-column">
        <h2 class="collab-name">Nome do Colaborador</h2>
        <p class="role-area">Cargo | Área</p>
      </div>
      <p class="info-line manager-info">
        <strong data-i18n="collaborators_detail.manager">Gestor:</strong>
        <span class="manager-name">—</span>
      </p>
      <p class="info-line salary-info">
        <strong data-i18n="collaborators_detail.salary">Salário:</strong>
        <span class="salary-value">—</span>
      </p>
      <p class="info-line">
        <strong data-i18n="collaborators_detail.occupancy">Ocupação de carga horária:</strong>
        <span class="occupancy-value">100%</span>
      </p>
      <p class="info-line">
        <strong>Horas semanais:</strong>
        <span class="weekly-hours-value">—</span>
      </p>
      <div class="skills d-flex flex-column">
        <p class="info-line">
          <strong data-i18n="collaborators_detail.skills">Skills:</strong>
        </p>
        <div class="skills-container">
          <div class="skills-list">
            <!-- Skills serão inseridas aqui via JavaScript -->
          </div>
        <div class="skills-pagination hidden">
          <button class="skills-pagination-btn" id="skills-prev" type="button" aria-label="Página anterior">‹</button>
          <span class="skills-page-info">
            <span id="skills-current-page">1</span> / <span id="skills-total-pages">1</span>
          </span>
          <button class="skills-pagination-btn" id="skills-next" type="button" aria-label="Próxima página">›</button>
          <button class="skills-show-all-btn" id="skills-show-all" type="button">Exibir todos</button>
        </div>
        </div>
      </div>
      <h3 data-i18n="collaborators_detail.personal_data" class="info-line">Dados Pessoais</h3>
      <div class="data-block">
        <label>E-mail Corporativo</label>
        <input type="email" placeholder="email@exemplo.com" />
        <label>Telefone celular</label>
        <input type="text" placeholder="(00) 00000-0000" />
        <label>Data de nascimento</label>
        <input type="text" placeholder="00/00/0000" />
        <label>CPF</label>
        <input type="text" placeholder="000.000.000-00" />
        <label>CNPJ</label>
        <input type="text" placeholder="000.000.000-00" />
      </div>
      <h3 data-i18n="collaborators_detail.address" class="info-line">Endereço</h3>
      <div class="data-block">
        <label>CEP</label>
        <input type="text" id="cep-field" placeholder="00000-000" />
        <label>Logradouro e Número</label>
        <input type="text" id="logradouro-numero-field" placeholder="Digite no campo" />
        <label>Complemento</label>
        <input type="text" id="complemento-field" placeholder="Digite no campo" />
        <label>Cidade</label>
        <input type="text" id="cidade-field" placeholder="Digite no campo" />
        <label>Estado</label>
        <input type="text" id="estado-field" placeholder="Digite no campo" />
      </div>
    `;
    }
    // squads-section: restaurar cards-list se necessário
    const squadsList = document.querySelector(".cards-list.squads-list");
    if (squadsList) {
      squadsList.innerHTML = `
      <div class="card light-blue">
        <h5>Nome squad</h5>
        <div class="d-flex flex-column text-center">
          <p><strong>Ocupação:</strong> x</p>
          <p><strong>Cargo:</strong> x</p>
        </div>
      </div>
      <div class="card pink">
        <h5>Nome squad</h5>
        <div class="d-flex flex-column text-center">
          <p><strong>Ocupação:</strong> x</p>
          <p><strong>Cargo:</strong> x</p>
        </div>
      </div>
      <div class="card purple">
        <h5>Nome squad</h5>
        <div class="d-flex flex-column text-center">
          <p><strong>Ocupação:</strong> x</p>
          <p><strong>Cargo:</strong> x</p>
        </div>
      </div>
    `;
    }
    // NÃO restaurar a timeline aqui!
  }
});

function showSkeletonDetail() {
  const summary = document.querySelector(".summary");
  if (summary) {
    summary.innerHTML = `
      <div class="summary-header">
        <span class="skeleton-box" style="width:70px;height:23px;margin:0 auto 16px auto;"></span>
        <div class="avatar-display">
          <div class="skeleton-avatar"></div>
        </div>
      </div>
      <div class="d-flex text-center flex-column">
        <div class="skeleton-box" style="width:80%;height:22px;margin:0 auto 8px auto;"></div>
        <div class="skeleton-box" style="width:60%;height:18px;margin:0 auto 8px auto;"></div>
      </div>
      <div class="skeleton-box" style="width:90%;height:16px;"></div>
      <div class="skeleton-box" style="width:70%;height:16px;"></div>
      <div class="skills d-flex flex-column">
        <div class="skeleton-box" style="width:60%;height:18px;"></div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          <div class="skeleton-box" style="width:60px;height:24px;"></div>
          <div class="skeleton-box" style="width:50px;height:24px;"></div>
          <div class="skeleton-box" style="width:70px;height:24px;"></div>
        </div>
      </div>
      <h3 class="info-line skeleton-box" style="width:60%;height:18px;"></h3>
      <div class="data-block">
        <div class="skeleton-box" style="width:100%;height:18px;"></div>
        <div class="skeleton-box" style="width:100%;height:18px;"></div>
        <div class="skeleton-box" style="width:100%;height:18px;"></div>
      </div>
      <h3 class="info-line skeleton-box" style="width:60%;height:18px;"></h3>
      <div class="data-block">
        <div class="skeleton-box" style="width:100%;height:18px;"></div>
        <div class="skeleton-box" style="width:100%;height:18px;"></div>
      </div>
    `;
  }
  const squadsList = document.querySelector(".cards-list.squads-list");
  if (squadsList) {
    squadsList.innerHTML = `
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
    `;
  }
  const timeline = document.querySelector(".timeline");
  if (timeline) {
    timeline.innerHTML = `
      <div class="skeleton-timeline"></div>
      <div class="skeleton-timeline"></div>
    `;
  }
}

async function patchValue(employee) {
  // Restaurar timeline real antes de preencher os dados
  let timeline = document.querySelector(".timeline");
  const limparFalse = (valor) =>
    valor === "false" ||
    valor === false ||
    valor === null ||
    valor === undefined ||
    valor === ""
      ? "—"
      : valor;

  const formatarCPF = (cpf) =>
    cpf && cpf !== "—"
      ? cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
      : "—";

  const formatarCNPJ = (cnpj) =>
    cnpj && cnpj !== "—"
      ? cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
      : "—";

  const formatarTelefone = (tel) =>
    tel && tel !== "—"
      ? tel.replace(/^55(\d{2})(\d{4,5})(\d{4})$/, "($1) $2-$3")
      : "—";

  const formatarData = (data) => {
    if (!data || data === "false" || data === false || data === null || data === "") return "—";
    
    try {
      let date;
      
      if (typeof data === "string") {
        const dataTrim = data.trim();
        
        // Se a data já está no formato brasileiro (DD/MM/AAAA)
        if (dataTrim.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
          const [dia, mes, ano] = dataTrim.split("/");
          date = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
        }
        // Se está no formato ISO (YYYY-MM-DD)
        else if (dataTrim.match(/^\d{4}-\d{2}-\d{2}/)) {
          date = new Date(dataTrim);
        }
        // Tentar parse direto
        else {
          date = new Date(dataTrim);
        }
      } else if (data instanceof Date) {
        date = data;
      } else {
        date = new Date(data);
      }
      
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        console.warn("Data inválida:", data);
        return "—";
      }
      
      // Verificar se a data não é muito antiga (antes de 1900) ou muito futura (depois de 2100)
      const year = date.getFullYear();
      if (year < 1900 || year > 2100) {
        console.warn("Data fora do range esperado:", data, "ano:", year);
        return "—";
      }
      
      return date.toLocaleDateString("pt-BR");
    } catch (e) {
      console.warn("Erro ao formatar data:", data, e);
      return "—";
    }
  };

  const formatarDataAnoMes = (data) => {
    if (!data || data === "false" || data === false) return null;
    try {
      const date = new Date(data);
      if (isNaN(date.getTime())) return null;
      return date.getFullYear();
    } catch (e) {
      return null;
    }
  };

  const capitalizarTexto = (texto) => {
    if (!texto || texto === "—" || texto === null || texto === undefined || typeof texto !== "string") {
      return texto || "—";
    }
    const textoTrim = texto.trim();
    if (textoTrim === "") return "—";
    
    return textoTrim
      .toLowerCase()
      .split(" ")
      .map((palavra) => {
        if (palavra.length === 0) return palavra;
        return palavra.charAt(0).toUpperCase() + palavra.slice(1);
      })
      .join(" ");
  };

  const capitalizarEmail = (email) => {
    if (!email || email === "—" || typeof email !== "string") return email;
    const [local, dominio] = email.toLowerCase().split("@");
    if (!dominio) return capitalizarTexto(local);
    return `${local}@${dominio}`;
  };

  const formatarMoeda = (valor) => {
    if (!valor || valor === "—" || isNaN(valor)) return "—";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const statusTag = document.querySelector(".summary-header .tag-green");
  if (statusTag) {
    const status = limparFalse(
      employee.status || (employee.activeEmployee ? "Ativo" : "Inativo")
    );
    statusTag.textContent = status;
    statusTag.classList.remove("tag-green", "tag-gray");
    if (status.toLowerCase() === "ativo") {
      statusTag.classList.add("tag-green");
    } else {
      statusTag.classList.add("tag-gray");
    }
  }

  const collabName = document.querySelector(".collab-name");
  if (collabName) collabName.textContent = limparFalse(employee.name);

  const roleArea = document.querySelector(".role-area");
  if (roleArea) roleArea.textContent = limparFalse(employee.jobTitle);

  // Gestor
  const managerNameSpan = document.querySelector(".manager-name");
  if (managerNameSpan) {
    const gestorNome = employee.manager && employee.manager.name 
      ? limparFalse(employee.manager.name) 
      : "—";
    managerNameSpan.textContent = gestorNome !== "—" ? capitalizarTexto(gestorNome) : gestorNome;
  }

  // Salário
  const salaryValueSpan = document.querySelector(".salary-value");
  if (salaryValueSpan) {
    salaryValueSpan.textContent = formatarMoeda(employee.contractWage);
  }

  // Horas semanais
  const weeklyHoursValue = document.querySelector(".weekly-hours-value");
  if (weeklyHoursValue) {
    const weeklyHours = employee.workHoursPerWeek || 0;
    weeklyHoursValue.textContent = weeklyHours > 0 ? `${weeklyHours}h/semana` : "—";
  }

  // Ocupação será calculada após buscar os squads

  const avatarLarge = document.querySelector(".avatar-large");
  if (avatarLarge && employee.name) {
    const nomes = employee.name.trim().split(" ");
    const primeira = nomes[0]?.[0]?.toUpperCase() || "";
    const ultima = nomes[nomes.length - 1]?.[0]?.toUpperCase() || "";
    avatarLarge.textContent = `${primeira}${ultima}`;
    avatarLarge.style.display = "flex";
    avatarLarge.style.alignItems = "center";
    avatarLarge.style.justifyContent = "center";
    avatarLarge.style.fontSize = "1.8rem";
    avatarLarge.style.fontWeight = "600";
    avatarLarge.style.color = "white";
    avatarLarge.style.backgroundColor = "#4C6EF5";
    avatarLarge.style.borderRadius = "50%";
    avatarLarge.style.width = "80px";
    avatarLarge.style.height = "80px";
  }

  const emailField = document.querySelector(
    "input[placeholder='email@exemplo.com']"
  );
  if (emailField) {
    const email = employee.workEmail;
    if (email && email !== "—") {
      emailField.value = capitalizarEmail(email);
    } else {
      emailField.value = "—";
    }
  }

  const phoneField = document.querySelector(
    "input[placeholder='(00) 00000-0000']"
  );
  if (phoneField)
    phoneField.value = formatarTelefone(limparFalse(employee.mobilePhone));

  const birthField = document.querySelector("input[placeholder='00/00/0000']");
  if (birthField)
    birthField.value = formatarData(limparFalse(employee.birthDate));

  const cpfFields = document.querySelectorAll(
    "input[placeholder='000.000.000-00']"
  );
  if (cpfFields.length > 0) {
    cpfFields[0].value = formatarCPF(limparFalse(employee.cpf));
    if (cpfFields.length > 1)
      cpfFields[1].value = formatarCNPJ(limparFalse(employee.cnpj));
  }

  // Tratamento do endereço
  const endereco = employee.address || {};
  
  // CEP
  const cepField = document.getElementById("cep-field");
  if (cepField) {
    const cep = limparFalse(endereco.zip);
    // Formatar CEP se tiver 8 dígitos
    if (cep && cep !== "—" && cep.length === 8) {
      cepField.value = cep.replace(/(\d{5})(\d{3})/, "$1-$2");
    } else {
      cepField.value = cep;
    }
  }

  // Logradouro e número (street - endereço particular)
  const logradouroNumeroField = document.getElementById("logradouro-numero-field");
  if (logradouroNumeroField) {
    const street = endereco.street;
    if (street && street !== "—" && street !== "") {
      logradouroNumeroField.value = capitalizarTexto(street);
    } else {
      logradouroNumeroField.value = "—";
    }
  }

  // Complemento (street2)
  const complementoField = document.getElementById("complemento-field");
  if (complementoField) {
    const complemento = endereco.street2;
    if (complemento && complemento !== "—" && complemento !== "") {
      complementoField.value = capitalizarTexto(complemento);
    } else {
      complementoField.value = "—";
    }
  }

  // Cidade
  const cidadeField = document.getElementById("cidade-field");
  if (cidadeField) {
    const cidade = endereco.city;
    if (cidade && cidade !== "—" && cidade !== "") {
      cidadeField.value = capitalizarTexto(cidade);
    } else {
      cidadeField.value = "—";
    }
  }

  // Estado
  const estadoField = document.getElementById("estado-field");
  if (estadoField) {
    const estado = endereco.state;
    if (estado && estado !== "—" && estado !== "") {
      estadoField.value = capitalizarTexto(estado);
    } else {
      estadoField.value = "—";
    }
  }

  // Skills com paginação
  const skillsContainer = document.querySelector(".skills-container");
  const skillsList = document.querySelector(".skills-list");
  const skillsPagination = document.querySelector(".skills-pagination");
  const skillsPrevBtn = document.getElementById("skills-prev");
  const skillsNextBtn = document.getElementById("skills-next");
  const skillsCurrentPageSpan = document.getElementById("skills-current-page");
  const skillsTotalPagesSpan = document.getElementById("skills-total-pages");

  if (skillsContainer && skillsList && skillsPagination) {
    const SKILLS_PER_PAGE = 6; // Número de skills por página
    let currentPage = 1;
    let allSkills = [];
    let showingAll = false;

    if (employee.skills && employee.skills.length > 0) {
      allSkills = employee.skills;
      const totalPages = Math.ceil(allSkills.length / SKILLS_PER_PAGE);
      const skillsShowAllBtn = document.getElementById("skills-show-all");

      // Função para renderizar skills da página atual ou todas
      function renderSkills() {
        skillsList.innerHTML = "";
        let skillsToShow = [];

        if (showingAll) {
          skillsToShow = allSkills;
        } else {
          const startIndex = (currentPage - 1) * SKILLS_PER_PAGE;
          const endIndex = startIndex + SKILLS_PER_PAGE;
          skillsToShow = allSkills.slice(startIndex, endIndex);
        }

        skillsToShow.forEach((s) => {
          const skillSpan = document.createElement("span");
          skillSpan.classList.add("skill");
          skillSpan.textContent = s.name;
          skillsList.appendChild(skillSpan);
        });

        // Atualizar informações de paginação
        if (!showingAll) {
          skillsCurrentPageSpan.textContent = currentPage;
          skillsTotalPagesSpan.textContent = totalPages;

          // Mostrar/ocultar paginação
          if (totalPages > 1) {
            skillsPagination.classList.remove("hidden");
          } else {
            skillsPagination.classList.add("hidden");
          }

          // Habilitar/desabilitar botões
          if (skillsPrevBtn) {
            skillsPrevBtn.disabled = currentPage === 1;
            skillsPrevBtn.style.display = "inline-flex";
          }
          if (skillsNextBtn) {
            skillsNextBtn.disabled = currentPage === totalPages;
            skillsNextBtn.style.display = "inline-flex";
          }
          
          // Atualizar botão "Exibir todos"
          if (skillsShowAllBtn) {
            skillsShowAllBtn.textContent = "Exibir todos";
            skillsShowAllBtn.style.display = "inline-flex";
          }
        } else {
          // Quando está mostrando todos, manter paginação visível mas esconder números
          skillsCurrentPageSpan.textContent = "";
          skillsTotalPagesSpan.textContent = "";
          if (skillsPrevBtn) skillsPrevBtn.style.display = "none";
          if (skillsNextBtn) skillsNextBtn.style.display = "none";
          if (skillsShowAllBtn) {
            skillsShowAllBtn.textContent = "Voltar à paginação";
          }
        }
      }

      // Event listeners para paginação
      if (skillsPrevBtn) {
        skillsPrevBtn.addEventListener("click", () => {
          if (currentPage > 1) {
            currentPage--;
            showingAll = false;
            renderSkills();
          }
        });
      }

      if (skillsNextBtn) {
        skillsNextBtn.addEventListener("click", () => {
          const totalPages = Math.ceil(allSkills.length / SKILLS_PER_PAGE);
          if (currentPage < totalPages) {
            currentPage++;
            showingAll = false;
            renderSkills();
          }
        });
      }

      // Event listener para "Exibir todos"
      if (skillsShowAllBtn) {
        skillsShowAllBtn.addEventListener("click", () => {
          showingAll = !showingAll;
          if (showingAll) {
            currentPage = 1;
          }
          renderSkills();
        });
      }

      // Renderizar primeira página
      renderSkills();
    } else {
      skillsList.innerHTML = `<span class="skill">—</span>`;
      skillsPagination.classList.add("hidden");
    }
  }

  // Buscar squads e calcular ocupação
  let totalAllocatedHours = 0;
  try {
    const allocations = await apiService.getSquadsByCollaboratorId(
      employee.id
    );

    const squadsContainer = document.querySelector(".cards-list.squads-list");
    if (squadsContainer) {
      squadsContainer.innerHTML = "";

      if (allocations && Array.isArray(allocations) && allocations.length > 0) {
        const cardColors = ["light-blue", "pink", "purple"];
        allocations.forEach((allocation, index) => {
          const allocatedHours = allocation.allocatedHours || 0;
          totalAllocatedHours += allocatedHours;
          
          const team = allocation.team || {};
          const teamName = team.name || "N/A";
          const position = allocation.position || "—";
          
          // Calcular percentual de ocupação neste squad
          const weeklyHours = employee.workHoursPerWeek || 0;
          const occupancyPercent = weeklyHours > 0 
            ? Math.round((allocatedHours / weeklyHours) * 100)
            : 0;

          const card = document.createElement("div");
          card.classList.add("card", cardColors[index % cardColors.length]);
          
          card.innerHTML = `
            <h5>${teamName}</h5>
            <div class="d-flex flex-column text-center">
              <p><strong>Ocupação:</strong> ${allocatedHours}h/semana (${occupancyPercent}%)</p>
              <p><strong>Cargo:</strong> ${position}</p>
            </div>
          `;
          
          squadsContainer.appendChild(card);
        });
      } else {
        squadsContainer.innerHTML = "<p>Nenhum squad encontrado.</p>";
      }
    }
  } catch (err) {
    console.error("Erro ao carregar squads:", err);
    const squadsContainer = document.querySelector(".cards-list.squads-list");
    if (squadsContainer) {
      squadsContainer.innerHTML = "<p>Erro ao carregar squads.</p>";
    }
  }

  // Calcular e exibir ocupação total
  const occupancyValue = document.querySelector(".occupancy-value");
  if (occupancyValue) {
    const weeklyHours = employee.workHoursPerWeek || 0;
    if (weeklyHours > 0) {
      const occupancyPercent = Math.round((totalAllocatedHours / weeklyHours) * 100);
      occupancyValue.textContent = `${occupancyPercent}%`;
    } else {
      occupancyValue.textContent = "—";
    }
  }

  // Função para detectar se é uma experiência profissional ou educação
  const isProfessionalExperience = (title) => {
    if (!title || typeof title !== "string") return false;
    const titleLower = title.toLowerCase();
    const professionalKeywords = [
      "analista", "desenvolvedor", "developer", "engenheiro", "engineer",
      "arquiteto", "architect", "gerente", "manager", "coordenador",
      "coordenator", "diretor", "director", "supervisor", "lider", "leader",
      "pleno", "senior", "sênior", "junior", "júnior", "especialista",
      "specialist", "consultor", "consultant", "tech lead", "techlead"
    ];
    return professionalKeywords.some(keyword => titleLower.includes(keyword));
  };

  const educations = employee.educations || [];
  
  // Garantir que a seção de educação existe no conteúdo principal
  let educationSection = document.querySelector(".education-section");
  if (!educationSection) {
    // Criar a seção de educação após a trilha profissional
    const trackSection = document.querySelector(".track-section");
    if (trackSection && trackSection.parentElement) {
      educationSection = document.createElement("div");
      educationSection.classList.add("section", "education-section");
      educationSection.innerHTML = `
        <div class="section-header">
          <h4 data-i18n="collaborators_detail.education">Educação e certificações</h4>
        </div>
        <div class="certifications"></div>
      `;
      trackSection.parentElement.appendChild(educationSection);
    }
  }
  
  const certContainer = document.querySelector(".certifications");
  if (!certContainer) {
    console.error("Container de certificações não encontrado");
    return;
  }
  certContainer.innerHTML = "";

  // Separar educação real de experiências profissionais que vieram no campo errado
  const realEducations = [];
  const professionalFromEducation = [];

  educations.forEach((edu) => {
    if (isProfessionalExperience(edu.title)) {
      // É uma experiência profissional, adicionar à trilha
      professionalFromEducation.push(edu);
    } else {
      // É educação real
      realEducations.push(edu);
    }
  });

  // Exibir apenas educação real
  if (realEducations.length > 0) {
    realEducations.forEach((edu) => {
      const startYear = formatarDataAnoMes(edu.startDate);
      const endYear = formatarDataAnoMes(edu.endDate);

      // Formatar período
      let periodo = "";
      if (startYear && endYear) {
        periodo = `${startYear} – ${endYear}`;
      } else if (startYear && !endYear) {
        periodo = `${startYear} – Sem data de término`;
      } else if (!startYear && endYear) {
        periodo = `– ${endYear}`;
      } else {
        periodo = "Sem datas informadas";
      }

      const item = document.createElement("div");
      item.classList.add("cert-item");
      item.innerHTML = `
        <span class="cert-name">${limparFalse(edu.title)}</span>
        <span class="cert-period">${periodo}</span>
      `;
      certContainer.appendChild(item);
    });
  } else {
    certContainer.innerHTML = "<p>Nenhum curso cadastrado.</p>";
  }

  document.querySelectorAll("input").forEach((input) => {
    input.setAttribute("readonly", true);
    input.classList.add("readonly-field");
    input.addEventListener("focus", (e) => e.target.blur());
  });

  if (timeline) timeline.innerHTML = "";

  // Combinar experiências da API com experiências profissionais que vieram em educação
  const allExperiences = [];
  
  // Adicionar experiências da API
  if (employee.experiences && employee.experiences.length > 0) {
    allExperiences.push(...employee.experiences);
  }
  
  // Adicionar experiências profissionais que estavam em educação
  if (professionalFromEducation && professionalFromEducation.length > 0) {
    professionalFromEducation.forEach((exp) => {
      // Converter formato de education para experience
      allExperiences.push({
        title: exp.title,
        company: null, // Educação não tem company
        startDate: exp.startDate,
        endDate: exp.endDate
      });
    });
  }

  // Ordenar por data de início (mais recente primeiro)
  allExperiences.sort((a, b) => {
    const dateA = a.startDate ? new Date(a.startDate) : new Date(0);
    const dateB = b.startDate ? new Date(b.startDate) : new Date(0);
    return dateB - dateA;
  });

  // Exibir todas as experiências
  if (allExperiences.length > 0) {
    let validExperiences = 0;
    allExperiences.forEach((exp, index) => {
      if (!exp || (!exp.title && !exp.company)) {
        return; // Pular experiências vazias
      }

      // Formatar datas de forma mais robusta
      let startDate = null;
      if (exp.startDate && 
          exp.startDate !== "false" && 
          exp.startDate !== null && 
          exp.startDate !== "" &&
          exp.startDate !== undefined) {
        const formatted = formatarData(exp.startDate);
        if (formatted && formatted !== "—") {
          startDate = formatted;
        }
      }

      let endDate = null;
      let isCurrent = false;
      
      if (exp.endDate && 
          exp.endDate !== "false" && 
          exp.endDate !== null && 
          exp.endDate !== "" &&
          exp.endDate !== undefined) {
        const formatted = formatarData(exp.endDate);
        if (formatted && formatted !== "—") {
          endDate = formatted;
        }
      } else {
        // Se não tem data fim, está em andamento
        isCurrent = true;
      }

      // Formatar período de forma inteligente
      let periodoTexto = "Período não informado";
      
      if (startDate && endDate) {
        periodoTexto = `${startDate} – ${endDate}`;
      } else if (startDate && isCurrent) {
        periodoTexto = `${startDate} – Atualmente`;
      } else if (!startDate && endDate) {
        periodoTexto = `Até ${endDate}`;
      } else if (startDate && !endDate && !isCurrent) {
        periodoTexto = `A partir de ${startDate}`;
      } else if (!startDate && isCurrent) {
        periodoTexto = "Em andamento";
      }

      const li = document.createElement("li");
      li.classList.add("timeline-item");
      if (validExperiences === 0) li.classList.add("current");

      li.innerHTML = `
        <span class="timeline-marker"></span>
        <div class="timeline-content">
          <h3>${limparFalse(exp.title) || "—"}</h3>
          ${exp.company ? `<p><strong>Empresa:</strong> ${limparFalse(exp.company) || "—"}</p>` : ""}
          <p><strong>Período:</strong> ${periodoTexto}</p>
        </div>
      `;
      timeline.appendChild(li);
      validExperiences++;
    });
  }
  
  // Se não há experiências, mostrar mensagem
  if (timeline && timeline.children.length === 0) {
    timeline.innerHTML = "<p>Nenhuma experiência cadastrada.</p>";
  }
}

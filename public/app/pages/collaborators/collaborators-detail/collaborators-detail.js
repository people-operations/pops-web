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
      <p class="info-line">
        <strong data-i18n="collaborators_detail.occupancy">Ocupação de carga horária:</strong>
        100%
      </p>
      <div class="skills d-flex flex-column">
        <p class="info-line">
          <strong data-i18n="collaborators_detail.skills">Skills:</strong>
        </p>
        <div>
          <span class="skill">Python</span>
          <span class="skill">Java</span>
          <span class="skill">Node.js</span>
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
        <input type="text" placeholder="00000-000" />
        <label>Bairro</label>
        <input type="text" placeholder="Digite no campo" />
        <label>Logradouro</label>
        <input type="text" placeholder="Digite no campo" />
        <label>Número</label>
        <input type="text" placeholder="Digite no campo" />
        <label>Complemento</label>
        <input type="text" placeholder="Digite no campo" />
        <label>Cidade</label>
        <input type="text" placeholder="Digite no campo" />
        <label>Estado</label>
        <input type="text" placeholder="Digite no campo" />
      </div>
      <h3 data-i18n="collaborators_detail.education" class="info-line">Educação e certificações</h3>
      <div class="certifications">
        <div class="cert-item">
          <span class="cert-name">Curso aqui</span>
          <span class="cert-period">2000–2025</span>
        </div>
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
      <div class="skills d-flex flex-column">
        <div class="skeleton-box" style="width:60%;height:18px;"></div>
        <div class="skeleton-box" style="width:40%;height:18px;"></div>
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
      <h3 class="info-line skeleton-box" style="width:60%;height:18px;"></h3>
      <div class="certifications">
        <div class="skeleton-cert"></div>
        <div class="skeleton-cert"></div>
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

  const formatarData = (data) =>
    data && data !== "false" ? new Date(data).toLocaleDateString("pt-BR") : "—";

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
  if (emailField) emailField.value = limparFalse(employee.workEmail);

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

  const endereco = employee.address || {};
  const cepField = document.querySelector("input[placeholder='00000-000']");
  if (cepField) cepField.value = limparFalse(endereco.zip);

  let streetFull = limparFalse(endereco.street);
  let street = "—";
  let number = "—";
  let neighborhood = "—";

  if (streetFull && streetFull !== "—") {
    const regex = /(.*?),\s*(\d+)\s*-\s*(.*)/;
    const match = streetFull.match(regex);
    if (match) {
      street = match[1].trim();
      number = match[2].trim();
      neighborhood = match[3].trim();
    }
  }

  const enderecoCampos = [
    neighborhood,
    street,
    number,
    limparFalse(endereco.complement),
    limparFalse(endereco.city),
    limparFalse(endereco.state),
  ];

  const camposEndereco = document.querySelectorAll(
    "input[placeholder='Digite no campo']"
  );
  camposEndereco.forEach((campo, i) => {
    if (enderecoCampos[i] !== undefined) campo.value = enderecoCampos[i];
  });

  const skillsContainer = document.querySelector(".skills div");
  if (skillsContainer) {
    skillsContainer.innerHTML = "";
    if (employee.skills && employee.skills.length > 0) {
      employee.skills.forEach((s) => {
        skillsContainer.innerHTML += `<span class=\"skill\">${s.name}</span>`;
      });
    } else {
      skillsContainer.innerHTML = `<span class=\"skill\">—</span>`;
    }
  }

  try {
    const squadResponse = await apiService.getSquadsByCollaboratorId(
      employee.id
    );

    const squadsContainer = document.querySelector(
      ".squads-section .avatars-group"
    );
    if (squadsContainer) {
      squadsContainer.innerHTML = "";

      if (squadResponse.ok) {
        const squads = await squadResponse.json();
        if (squads.length > 0) {
          squads.forEach((squad) => {
            const initials = squad.name
              .split(" ")
              .map((w) => w[0].toUpperCase())
              .join("")
              .slice(0, 2);

            const div = document.createElement("div");
            div.classList.add("avatar-sm");
            div.textContent = initials;
            squadsContainer.appendChild(div);
          });
        } else {
          squadsContainer.innerHTML = "<span>—</span>";
        }
      } else {
        squadsContainer.innerHTML = "<span>—</span>";
      }
    }
  } catch (err) {
    console.error("Erro ao carregar squads:", err);
  }

  const educations = employee.educations || [];
  const certContainer = document.querySelector(".certifications");
  certContainer.innerHTML = "";

  if (educations.length > 0) {
    educations.forEach((edu) => {
      const startYear = edu.startDate
        ? new Date(edu.startDate).getFullYear()
        : "?";
      const endYear = edu.endDate ? new Date(edu.endDate).getFullYear() : "?";

      const item = document.createElement("div");
      item.classList.add("cert-item");
      item.innerHTML = `
        <span class="cert-name">${limparFalse(edu.title)}</span>
        <span class="cert-period">${startYear} – ${endYear}</span>
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

  if (employee.experiences && employee.experiences.length > 0) {
    employee.experiences.forEach((exp, index) => {
      const startDate = exp.startDate
        ? new Date(exp.startDate).toLocaleDateString("pt-BR")
        : "—";
      const endDate =
        exp.endDate && exp.endDate !== "false"
          ? new Date(exp.endDate).toLocaleDateString("pt-BR")
          : "Atualmente";

      const li = document.createElement("li");
      li.classList.add("timeline-item");
      if (index === 0) li.classList.add("current");

      li.innerHTML = `
        <span class="timeline-marker"></span>
        <div class="timeline-content">
          <h3>${exp.title}</h3>
          <p><strong>Empresa:</strong> ${exp.company || "—"}</p>
          <p><strong>Período:</strong> ${startDate} – ${endDate}</p>
        </div>
      `;
      timeline.appendChild(li);
    });
  } else {
    timeline.innerHTML = "<p>Nenhuma experiência cadastrada.</p>";
  }
}

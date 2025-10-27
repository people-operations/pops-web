document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("idToken");
  if (!token) {
    console.warn("Usuário não autenticado! Redirecionando para login...");
    window.location.href = "../../../auth/login.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const employeeId = params.get("id");
  if (!employeeId) {
    console.error("ID do colaborador não fornecido na URL!");
    return;
  }

  try {
    const response = await fetch(`http://localhost:8081/api/employees/${employeeId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const employee = await response.json();
    console.log("Employee carregado:", employee);
    preencherInformacoesNoHTML(employee);

  } catch (error) {
    console.error("Erro ao carregar colaborador:", error);
  }
});

function preencherInformacoesNoHTML(employee) {
  const limparFalse = (valor) =>
    valor === "false" || valor === false || valor === null || valor === undefined || valor === ""
      ? "—"
      : valor;

  const formatarCPF = (cpf) =>
    cpf && cpf !== "—" ? cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : "—";

  const formatarCNPJ = (cnpj) =>
    cnpj && cnpj !== "—" ? cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5") : "—";

  const formatarTelefone = (tel) =>
    tel && tel !== "—" ? tel.replace(/^55(\d{2})(\d{4,5})(\d{4})$/, "($1) $2-$3") : "—";

  const formatarData = (data) =>
    data && data !== "false" ? new Date(data).toLocaleDateString("pt-BR") : "—";

  // Nome + cargo
  document.querySelector(".collab-name").textContent = limparFalse(employee.name);
  document.querySelector(".role-area").textContent = limparFalse(employee.jobTitle);

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

  // Email
  const emailField = document.querySelector("input[placeholder='email@exemplo.com']");
  emailField.value = limparFalse(employee.workEmail);

  // Telefone
  const phoneField = document.querySelector("input[placeholder='(00) 00000-0000']");
  phoneField.value = formatarTelefone(limparFalse(employee.mobilePhone));

  // Data de nascimento
  const birthField = document.querySelector("input[placeholder='00/00/0000']");
  birthField.value = formatarData(limparFalse(employee.birthDate));

  // CPF e CNPJ
  const cpfFields = document.querySelectorAll("input[placeholder='000.000.000-00']");
  if (cpfFields.length > 0) {
    cpfFields[0].value = formatarCPF(limparFalse(employee.cpf));
    cpfFields[1].value = formatarCNPJ(limparFalse(employee.cnpj));
  }

  // Endereço
  const endereco = employee.address || {};
  document.querySelector("input[placeholder='00000-000']").value = limparFalse(endereco.zip);

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
    limparFalse(endereco.state)
  ];

  const camposEndereco = document.querySelectorAll("input[placeholder='Digite no campo']");
  camposEndereco.forEach((campo, i) => {
    if (enderecoCampos[i] !== undefined) campo.value = enderecoCampos[i];
  });


  // Skills
  const skillsContainer = document.querySelector(".skills div");
  skillsContainer.innerHTML = "";
  if (employee.skills && employee.skills.length > 0) {
    employee.skills.forEach((s) => {
      skillsContainer.innerHTML += `<span class="skill">${s.name}</span>`;
    });
  } else {
    skillsContainer.innerHTML = `<span class="skill">—</span>`;
  }

  // Educação e Certificações — mostrar apenas o ano
  const educations = employee.educations || [];
  const certContainer = document.querySelector(".certifications");
  certContainer.innerHTML = "";

  if (educations.length > 0) {
    educations.forEach((edu) => {
      const startYear = edu.startDate ? new Date(edu.startDate).getFullYear() : "?";
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

  // Bloquear edição de todos os inputs
  document.querySelectorAll("input").forEach((input) => {
    input.setAttribute("readonly", true);
    input.classList.add("readonly-field");
    input.addEventListener("focus", (e) => e.target.blur());
  });

  // Trilha profissional
  const timeline = document.querySelector(".timeline");
  timeline.innerHTML = ""; 

  if (employee.experiences && employee.experiences.length > 0) {
    employee.experiences.forEach((exp, index) => {
      const startDate = exp.startDate ? new Date(exp.startDate).toLocaleDateString("pt-BR") : "—";
      const endDate = exp.endDate && exp.endDate !== "false" ? new Date(exp.endDate).toLocaleDateString("pt-BR") : "Atualmente";

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

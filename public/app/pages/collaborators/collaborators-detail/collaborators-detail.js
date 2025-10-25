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
  // 🧩 Helpers
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

  const formatarSalario = (valor) =>
    valor ? `R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—";

  // Nome + cargo
  document.querySelector(".collab-name").textContent = limparFalse(employee.name);
  document.querySelector(".role-area").textContent = limparFalse(employee.jobTitle);

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

  const camposEndereco = document.querySelectorAll("input[placeholder='Digite no campo']");
  const enderecoCampos = [
    limparFalse(endereco.neighborhood),
    limparFalse(endereco.street),
    limparFalse(endereco.number),
    limparFalse(endereco.complement),
    limparFalse(endereco.city),
    limparFalse(endereco.state)
  ];

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

  // Bloquear edição de todos os inputs
  document.querySelectorAll("input").forEach((input) => {
    input.setAttribute("readonly", true);
    input.classList.add("readonly-field");
    input.addEventListener("focus", (e) => e.target.blur());
  });

  // Exemplo: imprimir dados no console
  const contractStart = formatarData(employee.contractDateStart);
  const contractEnd = formatarData(employee.contractDateEnd);
  const wage = formatarSalario(employee.contractWage);
  console.log("Contrato:", { contractStart, contractEnd, wage });
}

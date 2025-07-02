// Controle de edição
let editando = false;
let linhaEditando = null;
let tipoEditando = null; // 'cargo' ou 'skill'

function abrirModal(id) {
  document.getElementById(id).classList.remove("hidden");
}

function fecharModal(id) {
  document.getElementById(id).classList.add("hidden");
}

function abrirModalForm(tipo, titulo, dados = null, linha = null) {
  const modal = document.getElementById("modal-form");
  modal.classList.remove("hidden");
  document.getElementById("modal-form-title").textContent = titulo;
  const btn = modal.querySelector(".modal-actions .primary");
  btn.textContent = titulo.includes("Editar") ? "Salvar" : "Criar";
  tipoEditando = tipo;
  editando = !!dados;
  linhaEditando = linha;
  // Monta os campos dinamicamente
  const formFields = document.getElementById("form-fields");
  if (tipo === "cargo") {
    formFields.innerHTML = `
      <label for="nome">Nome da Função</label>
      <input type="text" id="nome" name="nome" placeholder="Nome aqui" required value="${
        dados ? dados.nome : ""
      }">
      <label for="descricao">Descrição</label>
      <textarea id="descricao" name="descricao" placeholder="Descrição aqui">${
        dados ? dados.descricao : ""
      }</textarea>
      <label for="senioridade">Senioridade</label>
      <input type="text" id="senioridade" name="senioridade" placeholder="Senioridade" value="${
        dados ? dados.senioridade : ""
      }">
      <label for="qtd">Quantidade de Pessoas</label>
      <input type="number" id="qtd" name="qtd" min="0" value="${
        dados ? dados.qtd : "0"
      }">
      <label for="taxa">Taxa Horária</label>
      <input type="text" id="taxa" name="taxa" placeholder="R$00/hr" value="${
        dados ? dados.taxa : ""
      }">
    `;
  } else {
    formFields.innerHTML = `
      <label for="nome">Nome da Skill</label>
      <input type="text" id="nome" name="nome" placeholder="Nome aqui" required value="${
        dados ? dados.nome : ""
      }">
      <label for="descricao">Descrição</label>
      <textarea id="descricao" name="descricao" placeholder="Descrição aqui">${
        dados ? dados.descricao : ""
      }</textarea>
      <label for="tipo">Tipo</label>
      <input type="text" id="tipo" name="tipo" placeholder="Tipo (ex: Soft Skills)" value="${
        dados ? dados.tipo : ""
      }">
    `;
  }
}

// Botão adicionar cargo
const btnAddCargo = document.querySelectorAll(".add-btn")[0];
if (btnAddCargo) {
  btnAddCargo.addEventListener("click", () => {
    abrirModalForm("cargo", "Adicionar cargo");
  });
}
// Botão adicionar skill
const btnAddSkill =
  document.querySelectorAll(".add-btn")[2] ||
  document.querySelectorAll(".add-btn")[1];
if (btnAddSkill) {
  btnAddSkill.addEventListener("click", () => {
    abrirModalForm("skill", "Adicionar skill");
  });
}

// Modal de Senioridade
const btnAddSenioridade = document.querySelectorAll(".add-btn")[1];
if (btnAddSenioridade) {
  btnAddSenioridade.addEventListener("click", () => {
    abrirModalSenioridade("Adicionar senioridade");
  });
}

function abrirModalSenioridade(titulo, dados = null, linha = null) {
  const modal = document.getElementById("modal-senioridade");
  modal.classList.remove("hidden");
  document.getElementById("modal-senioridade-title").textContent = titulo;
  const btn = modal.querySelector(".modal-actions .primary");
  btn.textContent = titulo.includes("Editar") ? "Salvar" : "Criar";
  // Preenche ou limpa os campos
  document.getElementById("nome-senioridade").value = dados ? dados.nome : "";
  document.getElementById("descricao-senioridade").value = dados ? dados.descricao : "";
  // Guarda referência se for edição (pode ser expandido para editar na tabela)
  window._linhaSenioridadeEditando = linha;
  window._editandoSenioridade = !!dados;
}

const formSenioridade = document.getElementById("form-senioridade");
if (formSenioridade) {
  formSenioridade.addEventListener("submit", function (e) {
    e.preventDefault();
    const nome = document.getElementById("nome-senioridade").value;
    const descricao = document.getElementById("descricao-senioridade").value;
    // Aqui você pode adicionar a lógica para inserir na tabela de senioridades, se desejar
    // Exemplo: adicionar em um array ou criar uma tabela na tela
    fecharModal("modal-senioridade");
    // Limpa variáveis de edição
    window._linhaSenioridadeEditando = null;
    window._editandoSenioridade = false;
  });
}

// Função para atribuir eventos aos botões de ação
function atribuirEventosIcones() {
  // Cargos
  document.querySelectorAll("section.mb-24 .icon-btn").forEach((btn) => {
    btn.onclick = function () {
      const tr = btn.closest("tr");
      if (btn.textContent.includes("✏️")) {
        const tds = tr.querySelectorAll("td");
        const dados = {
          nome: tds[0].textContent.trim(),
          descricao: tds[1].textContent.trim(),
          senioridade: tds[2].textContent.trim(),
          qtd: tds[3].textContent.trim(),
          taxa: tds[4].textContent.trim(),
        };
        abrirModalForm("cargo", "Editar cargo", dados, tr);
      } else if (btn.textContent.includes("🗑️")) {
        abrirModal("modal-excluir");
        linhaEditando = tr;
        tipoEditando = "cargo";
      }
    };
  });
  // Skills
  document.querySelectorAll("section:not(.mb-24) .icon-btn").forEach((btn) => {
    btn.onclick = function () {
      const tr = btn.closest("tr");
      if (btn.textContent.includes("✏️")) {
        const tds = tr.querySelectorAll("td");
        const dados = {
          nome: tds[0].textContent.trim(),
          descricao: tds[1].textContent.trim(),
          tipo: tds[2].textContent.trim(),
        };
        abrirModalForm("skill", "Editar skill", dados, tr);
      } else if (btn.textContent.includes("🗑️")) {
        abrirModal("modal-excluir");
        linhaEditando = tr;
        tipoEditando = "skill";
      }
    };
  });
}
atribuirEventosIcones();

// Submissão do formulário
const formItem = document.getElementById("form-item");
if (formItem) {
  formItem.addEventListener("submit", function (e) {
    e.preventDefault();
    if (tipoEditando === "cargo") {
      const nome = document.getElementById("nome").value;
      const descricao = document.getElementById("descricao").value;
      const senioridade = document.getElementById("senioridade").value;
      const qtd = document.getElementById("qtd").value;
      const taxa = document.getElementById("taxa").value;
      if (editando && linhaEditando) {
        const tds = linhaEditando.querySelectorAll("td");
        tds[0].textContent = nome;
        tds[1].textContent = descricao;
        tds[2].textContent = senioridade;
        tds[3].textContent = qtd;
        tds[4].textContent = taxa;
      } else {
        const tbody = document.querySelector("section.mb-24 .table tbody");
        const novaLinha = document.createElement("tr");
        novaLinha.innerHTML = `
          <td>${nome}</td>
          <td>${descricao}</td>
          <td>${senioridade}</td>
          <td>${qtd}</td>
          <td>${taxa}</td>
          <td>
            <button class="icon-btn">✏️</button>
            <button class="icon-btn">🗑️</button>
          </td>
        `;
        tbody.appendChild(novaLinha);
        atribuirEventosIcones();
      }
    } else if (tipoEditando === "skill") {
      const nome = document.getElementById("nome").value;
      const descricao = document.getElementById("descricao").value;
      const tipo = document.getElementById("tipo").value;
      if (editando && linhaEditando) {
        const tds = linhaEditando.querySelectorAll("td");
        tds[0].textContent = nome;
        tds[1].textContent = descricao;
        tds[2].textContent = tipo;
      } else {
        const tbody = document.querySelector(
          "section:not(.mb-24) .table tbody"
        );
        const novaLinha = document.createElement("tr");
        novaLinha.innerHTML = `
          <td>${nome}</td>
          <td>${descricao}</td>
          <td>${tipo}</td>
          <td>
            <button class="icon-btn">✏️</button>
            <button class="icon-btn">🗑️</button>
          </td>
        `;
        tbody.appendChild(novaLinha);
        atribuirEventosIcones();
      }
    }
    fecharModal("modal-form");
  });
}

function confirmarExclusao() {
  if (linhaEditando) {
    linhaEditando.remove();
    linhaEditando = null;
  }
  fecharModal("modal-excluir");
}

// Utilitários para modal
function abrirModal(id) {
  console.log("Abrindo modal:", id);
  document.getElementById(id).classList.remove("hidden");
}
function fecharModal(id) {
  document.getElementById(id).classList.add("hidden");
}

let editando = false;
let linhaEditando = null;

function abrirModalArea(titulo, dados = {}, linha = null) {
  editando = !!linha;
  linhaEditando = linha;
  document.querySelector("#modal-cargo h3").textContent = editando
    ? "Editar cargo"
    : "Adicionar cargo";
  document.getElementById("nome").value = dados.nome || "";
  document.getElementById("descricao").value = dados.descricao || "";
  abrirModal("modal-cargo");
}

// Evento do botão "+ Novo cargo"
const btnNovoCargo = document.querySelector(".btn.btn-purple");
if (btnNovoCargo) {
  btnNovoCargo.addEventListener("click", function () {
    abrirModalArea("Adicionar cargo");
  });
}

// Eventos dos botões de editar/excluir das linhas já existentes
function atribuirEventosTabela() {
  const linhas = document.querySelectorAll(".skills-table tbody tr");
  linhas.forEach((tr) => {
    const btnEdit = tr.querySelector(".edit-btn");
    const btnDelete = tr.querySelector(".delete-btn");
    if (btnEdit) {
      btnEdit.onclick = function () {
        const tds = tr.querySelectorAll("td");
        const dados = {
          nome: tds[0].textContent.trim(),
          descricao: tds[1].textContent.trim(),
        };
        abrirModalArea("Editar cargo", dados, tr);
      };
    }
    if (btnDelete) {
      btnDelete.onclick = function () {
        abrirModal("modal-excluir");
      };
    }
  });
}
atribuirEventosTabela();

// Submissão do formulário
const formCargo = document.getElementById("form-cargo");
if (formCargo) {
  formCargo.addEventListener("submit", function (e) {
    e.preventDefault();
    const nome = document.getElementById("nome").value;
    const descricao = document.getElementById("descricao").value;
    if (editando && linhaEditando) {
      // Atualiza a linha da tabela
      const tds = linhaEditando.querySelectorAll("td");
      tds[0].textContent = nome;
      tds[1].textContent = descricao;
    } else {
      // Adiciona nova linha na tabela
      const tbody = document.querySelector(".skills-table tbody");
      const novaLinha = document.createElement("tr");
      novaLinha.innerHTML = `
        <td>${nome}</td>
        <td>${descricao}</td>
        <td>
          <label class="switch">
            <input type="checkbox" checked />
            <span class="slider round"></span>
          </label>
        </td>
        <td class="action-btns">
          <button class="edit-btn" title="Editar">✏️</button>
          <button class="delete-btn" title="Excluir">🗑️</button>
        </td>
      `;
      tbody.appendChild(novaLinha);
      // Reatribui eventos aos novos botões
      atribuirEventosTabela();
    }
    fecharModal("modal-cargo");
    editando = false;
    linhaEditando = null;
  });
}

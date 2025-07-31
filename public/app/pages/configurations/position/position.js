function abrirModal(id) {
  document.getElementById(id).classList.remove("hidden");
}

function fecharModal(id) {
  document.getElementById(id).classList.add("hidden");
}

// Variável para controlar se está editando ou adicionando
let editando = false;
let linhaEditando = null;

// Função para abrir o modal de área (adicionar ou editar)
function abrirModalArea(titulo, dados = null, linha = null) {
  const modal = document.getElementById("modal-cargo");
  modal.classList.remove("hidden");
  // Troca o título do modal
  modal.querySelector("h3").textContent = titulo;
  // Troca o texto do botão de submit
  modal.querySelector(".modal-actions .primary").textContent = titulo.includes(
    "Editar"
  )
    ? "Salvar"
    : "Criar";
  // Preenche ou limpa os campos
  document.getElementById("nome").value = dados ? dados.nome : "";
  document.getElementById("descricao").value = dados ? dados.descricao : "";
  document.getElementById("senioridade").value = dados ? dados.senioridade : "";
  document.getElementById("taxa").value = dados ? dados.taxa : "00";
  editando = !!dados;
  linhaEditando = linha;
}

// Botão adicionar área
const btnAdicionar = document.querySelector(".primary.btn");
if (btnAdicionar) {
  btnAdicionar.addEventListener("click", () => {
    abrirModalArea("Adicionar área");
  });
}

// Botões de editar e excluir
document.querySelectorAll(".icon-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const tr = btn.closest("tr");
    if (btn.textContent.includes("✏️")) {
      // Pega os dados da linha
      const tds = tr.querySelectorAll("td");
      const dados = {
        nome: tds[0].textContent.trim(),
        descricao: tds[1].textContent.trim(),
        // Os campos abaixo são fictícios, pois não existem na tabela, mas podem ser adaptados
        senioridade: "", // Não há na tabela
        taxa: "00", // Não há na tabela
      };
      abrirModalArea("Editar área", dados, tr);
    } else if (btn.textContent.includes("🗑️")) {
      abrirModal("modal-excluir");
    }
  });
});

// Submissão do formulário
const formCargo = document.getElementById("form-cargo");
if (formCargo) {
  formCargo.addEventListener("submit", function (e) {
    e.preventDefault();
    const nome = document.getElementById("nome").value;
    const descricao = document.getElementById("descricao").value;
    // ...pegar outros campos se necessário...
    if (editando && linhaEditando) {
      // Atualiza a linha da tabela
      const tds = linhaEditando.querySelectorAll("td");
      tds[0].textContent = nome;
      tds[1].textContent = descricao;
    } else {
      // Adiciona nova linha na tabela
      const tbody = document.querySelector(".table tbody");
      const novaLinha = document.createElement("tr");
      novaLinha.innerHTML = `
        <td>${nome}</td>
        <td>${descricao}</td>
        <td>00</td>
        <td>00</td>
        <td>0%</td>
        <td>
          <button class="icon-btn">✏️</button>
          <button class="icon-btn">🗑️</button>
        </td>
      `;
      tbody.appendChild(novaLinha);
      // Reatribui eventos aos novos botões
      novaLinha.querySelectorAll(".icon-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const tr = btn.closest("tr");
          if (btn.textContent.includes("✏️")) {
            const tds = tr.querySelectorAll("td");
            const dados = {
              nome: tds[0].textContent.trim(),
              descricao: tds[1].textContent.trim(),
              senioridade: "",
              taxa: "00",
            };
            abrirModalArea("Editar área", dados, tr);
          } else if (btn.textContent.includes("🗑️")) {
            abrirModal("modal-excluir");
          }
        });
      });
    }
    fecharModal("modal-cargo");
  });
}

// Exemplo para testar: botões ✏️ e 🗑️
document.querySelectorAll(".icon-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    if (btn.textContent.includes("✏️")) {
      abrirModal("modal-cargo");
    } else if (btn.textContent.includes("🗑️")) {
      abrirModal("modal-excluir");
    }
  });
});

function confirmarExclusao() {
  alert("Item excluído!");
  fecharModal("modal-excluir");
}

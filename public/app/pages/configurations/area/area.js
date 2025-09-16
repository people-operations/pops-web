// Util: abrir/fechar modal pelo id
function abrirModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove("hidden");
  // acessibilidade
  el.setAttribute("aria-hidden", "false");
}

function fecharModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add("hidden");
  el.setAttribute("aria-hidden", "true");
}

// Controle de edição
let editando = false;
let linhaEditando = null;

// Abre o modal já com título/conteúdo
function abrirModalArea(titulo, dados = null, linha = null) {
  const modal = document.getElementById("modal-cargo");
  if (!modal) return;

  // Mostra modal
  abrirModal("modal-cargo");

  // Título e rótulo do botão
  modal.querySelector("h3").textContent = titulo;
  const btnSubmit = modal.querySelector(".modal-actions .primary");
  btnSubmit.textContent = titulo.toLowerCase().includes("editar")
    ? "Salvar"
    : "Criar";

  // Preenche campos
  document.getElementById("nome").value = dados?.nome ?? "";
  document.getElementById("descricao").value = dados?.descricao ?? "";

  editando = !!dados;
  linhaEditando = linha;
}

// Ao carregar DOM
document.addEventListener("DOMContentLoaded", () => {
  // Botão "+ Nova área"
  const btnAdicionar = document.getElementById("btn-nova-area");
  if (btnAdicionar) {
    btnAdicionar.addEventListener("click", () => {
      abrirModalArea("Adicionar área");
    });
  }

  // Delegação de eventos na tabela (útil para linhas novas)
  const tabela = document.querySelector(".skills-table tbody");
  if (tabela) {
    tabela.addEventListener("click", (e) => {
      const btn = e.target.closest(".edit-btn, .delete-btn");
      if (!btn) return;
      const tr = btn.closest("tr");
      if (!tr) return;

      if (btn.classList.contains("edit-btn")) {
        const tds = tr.querySelectorAll("td");
        const dados = {
          nome: tds[0]?.textContent.trim() || "",
          descricao: tds[1]?.textContent.trim() || "",
        };
        abrirModalArea("Editar área", dados, tr);
      }

      if (btn.classList.contains("delete-btn")) {
        // Se tiver um modal de excluir, chame-o aqui; por enquanto só confirm:
        if (confirm("Confirma a exclusão desta área?")) {
          tr.remove();
        }
      }
    });
  }

  // Submit do formulário
  const form = document.getElementById("form-cargo");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const nome = document.getElementById("nome").value.trim();
      const descricao = document.getElementById("descricao").value.trim();

      if (!nome) {
        alert("Informe o nome da área.");
        return;
      }

      const tbody = document.querySelector(".skills-table tbody");
      if (!tbody) {
        console.warn("tbody da tabela não encontrado (.skills-table tbody)");
        fecharModal("modal-cargo");
        return;
      }

      if (editando && linhaEditando) {
        const tds = linhaEditando.querySelectorAll("td");
        tds[0].textContent = nome;
        tds[1].textContent = descricao;
      } else {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${nome}</td>
          <td>${descricao}</td>
          <td>0</td>
          <td class="action-btns">
            <button class="edit-btn" title="Editar">✏️</button>
            <button class="delete-btn" title="Excluir">🗑️</button>
          </td>
        `;
        tbody.appendChild(tr);
      }

      fecharModal("modal-cargo");
      // Reseta estado
      editando = false;
      linhaEditando = null;
      form.reset();
    });
  }

  // Fecha modal clicando fora do conteúdo
  const modal = document.getElementById("modal-cargo");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target.id === "modal-cargo") fecharModal("modal-cargo");
    });
  }
});

import { apiService, getAuthTokenOrThrow } from "../../../../assets/js/apiService.js";
import { requireAuth, requireAccess } from "../../../../assets/js/permissions.js";

// Verificar autenticação e acesso imediatamente
if (!requireAuth()) {
  // Redireciona para login
} else if (!requireAccess([1, 2], "../../../dashboard/dashboard.html")) {
  // Redireciona para dashboard com mensagem de erro
}

let allProjectStatuses = [];
let projectStatuses = [];
let editando = false;
let statusEditando = null;
let statusToggle = null;

// Util: abrir/fechar modal pelo id
function abrirModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove("hidden");
  el.style.display = "block";
  el.setAttribute("aria-hidden", "false");
  
  // Abrir overlay correspondente
  const overlayId = id === "modal-status" ? "modal-overlay-status" : 
                    id === "modal-toggle-status" ? "modal-overlay-toggle-status" : null;
  if (overlayId) {
    const overlay = document.getElementById(overlayId);
    if (overlay) {
      overlay.classList.remove("hidden");
      overlay.style.display = "block";
    }
  }
}

function fecharModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add("hidden");
  el.style.display = "none";
  el.setAttribute("aria-hidden", "true");
  
  // Fechar overlay correspondente
  const overlayId = id === "modal-status" ? "modal-overlay-status" : 
                    id === "modal-toggle-status" ? "modal-overlay-toggle-status" : null;
  if (overlayId) {
    const overlay = document.getElementById(overlayId);
    if (overlay) {
      overlay.classList.add("hidden");
      overlay.style.display = "none";
    }
  }
}

// Expor fecharModal no escopo global para uso no HTML
window.fecharModal = fecharModal;

// Abre o modal já com título/conteúdo
function abrirModalStatus(titulo, dados = null) {
  const modal = document.getElementById("modal-status");
  if (!modal) return;

  abrirModal("modal-status");

  const modalTitulo = document.getElementById("modal-titulo-status");
  if (modalTitulo) {
    modalTitulo.textContent = titulo;
  }
  
  const btnSubmit = modal.querySelector(".modal-actions .btn.primary");
  if (btnSubmit) {
    btnSubmit.textContent = titulo.toLowerCase().includes("editar")
      ? "Salvar"
      : "Criar";
  }

  document.getElementById("nome-status").value = dados?.name ?? "";
  document.getElementById("descricao-status").value = dados?.description ?? "";

  editando = !!dados;
  statusEditando = dados;
}

function abrirModalToggle(status, isActive) {
  const modal = document.getElementById("modal-toggle-status");
  if (!modal) return;

  abrirModal("modal-toggle-status");

  const titulo = document.getElementById("modal-toggle-titulo-status");
  const mensagem = document.getElementById("modal-toggle-mensagem-status");
  
  if (titulo) {
    titulo.textContent = isActive ? "Desativar Status de Projeto" : "Ativar Status de Projeto";
  }
  
  if (mensagem) {
    mensagem.textContent = isActive
      ? `Tem certeza que deseja desativar o status de projeto "${status.name}"?`
      : `Tem certeza que deseja ativar o status de projeto "${status.name}"?`;
  }

  statusToggle = { status, isActive, originalState: isActive };
}

async function loadProjectStatuses() {
  try {
    const [activeData, inactiveData] = await Promise.all([
      apiService.getProjectStatuses(),
      fetch("http://localhost:8082/api/project-status/inactive", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthTokenOrThrow()}`,
        },
      }).then(res => res.ok ? res.json() : []).catch(() => [])
    ]);

    const active = Array.isArray(activeData) ? activeData : [];
    const inactive = Array.isArray(inactiveData) ? inactiveData : [];
    allProjectStatuses = [...active, ...inactive];
    applyFilter();
  } catch (err) {
    console.error("Erro ao carregar status de projeto:", err);
    allProjectStatuses = [];
    projectStatuses = [];
    renderTable();
    window.showNotification &&
      window.showNotification("error", "Erro ao carregar status de projeto.");
  }
}

function applyFilter() {
  const filter = document.getElementById("status-filter-status")?.value || "all";
  
  if (filter === "all") {
    projectStatuses = allProjectStatuses;
  } else if (filter === "active") {
    projectStatuses = allProjectStatuses.filter(s => s.active);
  } else if (filter === "inactive") {
    projectStatuses = allProjectStatuses.filter(s => !s.active);
  }
  
  renderTable();
}

function renderTable() {
  const tbody = document.getElementById("status-table-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!projectStatuses || projectStatuses.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 32px; color: #888;">
          Nenhum status de projeto encontrado.
        </td>
      </tr>
    `;
    return;
  }

  projectStatuses.forEach((status) => {
    const tr = document.createElement("tr");
    
    tr.innerHTML = `
      <td>${status.name || "-"}</td>
      <td>${status.description || "-"}</td>
      <td>${status.active ? "Ativo" : "Inativo"}</td>
      <td class="action-btns">
        <button class="edit-btn" data-id="${status.id}" title="Editar" style="background: none; border: none; cursor: pointer; padding: 4px;">
          <img src="/assets/svg/edit-button.svg" alt="Editar" style="width: 34px; height: 34px;" />
        </button>
        ${status.active ? `
        <button class="delete-btn" data-id="${status.id}" data-active="${status.active}" title="Desativar" style="background: none; border: none; cursor: pointer; padding: 4px;">
          <img src="/assets/svg/trash-button.svg" alt="Desativar" style="width: 34px; height: 34px;" />
        </button>
        ` : `
        <button class="activate-btn" data-id="${status.id}" data-active="${status.active}" title="Ativar" style="background: none; border: none; cursor: pointer; padding: 4px;">
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.5" y="0.5" width="33" height="33" rx="3.5" fill="white"/>
            <rect x="0.5" y="0.5" width="33" height="33" rx="3.5" stroke="#4CAF50"/>
            <path d="M17 10L17 20M12 15L17 10L22 15" stroke="#4CAF50" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        `}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function createProjectStatus(name, description) {
  try {
    const token = getAuthTokenOrThrow();
    const response = await fetch("http://localhost:8082/api/project-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, description }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erro ao criar status de projeto:", error);
    throw error;
  }
}

async function updateProjectStatus(id, name, description) {
  try {
    const token = getAuthTokenOrThrow();
    const response = await fetch(`http://localhost:8082/api/project-status/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, description }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erro ao atualizar status de projeto:", error);
    throw error;
  }
}

async function enableProjectStatus(id) {
  try {
    const token = getAuthTokenOrThrow();
    const response = await fetch(`http://localhost:8082/api/project-status/enable/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erro ao ativar status de projeto:", error);
    throw error;
  }
}

async function disableProjectStatus(id) {
  try {
    const token = getAuthTokenOrThrow();
    const response = await fetch(`http://localhost:8082/api/project-status/disable/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erro ao inativar status de projeto:", error);
    throw error;
  }
}

// Ao carregar DOM
document.addEventListener("DOMContentLoaded", () => {
  loadProjectStatuses();

  // Filtro de status
  const statusFilter = document.getElementById("status-filter-status");
  if (statusFilter) {
    statusFilter.addEventListener("change", applyFilter);
  }

  // Botão "+ Novo Status"
  const btnAdicionar = document.getElementById("btn-novo-status");
  if (btnAdicionar) {
    btnAdicionar.addEventListener("click", () => {
      abrirModalStatus("Adicionar Status de Projeto");
    });
  }

  // Delegação de eventos na tabela
  const tabela = document.getElementById("status-table-body");
  if (tabela) {
    tabela.addEventListener("click", async (e) => {
      // Encontra o botão mais próximo, mesmo se clicou na imagem ou SVG
      let target = e.target;
      
      // Se clicou na imagem ou em elementos SVG, sobe até encontrar o botão
      if (target.tagName === "IMG" || target.tagName === "svg" || target.tagName === "path" || target.tagName === "rect") {
        target = target.closest("button") || target.parentElement;
      }
      
      // Verifica se é um botão de ação
      if (!target || !target.classList) return;
      
      const editBtn = target.classList.contains("edit-btn") ? target : target.closest(".edit-btn");
      const deleteBtn = target.classList.contains("delete-btn") ? target : target.closest(".delete-btn");
      const activateBtn = target.classList.contains("activate-btn") ? target : target.closest(".activate-btn");
      
      if (editBtn) {
        e.preventDefault();
        e.stopPropagation();
        const id = editBtn.getAttribute("data-id");
        if (!id) {
          console.error("ID não encontrado no botão de editar");
          return;
        }
        const status = allProjectStatuses.find((s) => s.id == id);
        if (status) {
          console.log("Abrindo modal de edição para:", status);
          abrirModalStatus("Editar Status de Projeto", status);
        } else {
          console.error("Status não encontrado com ID:", id);
        }
        return;
      }
      
      if (deleteBtn) {
        e.preventDefault();
        e.stopPropagation();
        const id = deleteBtn.getAttribute("data-id");
        const isActive = deleteBtn.getAttribute("data-active") === "true";
        if (!id) {
          console.error("ID não encontrado no botão de deletar");
          return;
        }
        const status = allProjectStatuses.find((s) => s.id == id);
        if (status && isActive) {
          console.log("Abrindo modal de desativação para:", status);
          statusToggle = { status, isActive: true, originalState: true };
          abrirModalToggle(status, true);
        } else {
          console.error("Status não encontrado com ID:", id, "ou não está ativo");
        }
        return;
      }
      
      if (activateBtn) {
        e.preventDefault();
        e.stopPropagation();
        const id = activateBtn.getAttribute("data-id");
        if (!id) {
          console.error("ID não encontrado no botão de ativar");
          return;
        }
        const status = allProjectStatuses.find((s) => s.id == id);
        if (status && !status.active) {
          console.log("Abrindo modal de ativação para:", status);
          statusToggle = { status, isActive: false, originalState: false };
          abrirModalToggle(status, false);
        } else {
          console.error("Status não encontrado com ID:", id, "ou já está ativo");
        }
        return;
      }
    });
  }

  // Botão de confirmar toggle
  const btnConfirmarToggle = document.getElementById("btn-confirmar-toggle-status");
  if (btnConfirmarToggle) {
    btnConfirmarToggle.addEventListener("click", async () => {
      if (!statusToggle) return;
      
      try {
        if (statusToggle.isActive) {
          await disableProjectStatus(statusToggle.status.id);
          window.showNotification &&
            window.showNotification("success", "Status de projeto desativado com sucesso.");
        } else {
          await enableProjectStatus(statusToggle.status.id);
          window.showNotification &&
            window.showNotification("success", "Status de projeto ativado com sucesso.");
        }
        
        await loadProjectStatuses();
        fecharModal("modal-toggle-status");
        statusToggle = null;
      } catch (err) {
        window.showNotification &&
          window.showNotification("error", "Erro ao alterar status do status de projeto.");
      }
    });
  }
  
  // Reverter se cancelar (não precisa mais reverter toggle, pois não há mais toggle)
  const modalToggle = document.getElementById("modal-toggle-status");
  if (modalToggle) {
    const btnCancelar = modalToggle.querySelector(".btn.secondary");
    if (btnCancelar) {
      btnCancelar.addEventListener("click", () => {
        statusToggle = null;
      });
    }
  }

  // Submit do formulário
  const form = document.getElementById("form-status");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nome = document.getElementById("nome-status").value.trim();
      const descricao = document.getElementById("descricao-status").value.trim();

      if (!nome) {
        window.showNotification &&
          window.showNotification("error", "Informe o nome do status de projeto.");
        return;
      }

      try {
        if (editando && statusEditando) {
          await updateProjectStatus(statusEditando.id, nome, descricao);
          window.showNotification &&
            window.showNotification("success", "Status de projeto atualizado com sucesso.");
        } else {
          await createProjectStatus(nome, descricao);
          window.showNotification &&
            window.showNotification("success", "Status de projeto criado com sucesso.");
        }
        
        await loadProjectStatuses();
        fecharModal("modal-status");
        editando = false;
        statusEditando = null;
        form.reset();
      } catch (err) {
        window.showNotification &&
          window.showNotification("error", "Erro ao salvar status de projeto.");
      }
    });
  }
});

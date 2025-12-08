import { apiService, getAuthTokenOrThrow } from "../../../../assets/js/apiService.js";
import { requireAuth, requireAccess } from "../../../../assets/js/permissions.js";

// Verificar autenticação e acesso imediatamente
if (!requireAuth()) {
  // Redireciona para login
} else if (!requireAccess([1, 2], "../../../dashboard/dashboard.html")) {
  // Redireciona para dashboard com mensagem de erro
}

let allProjectTypes = [];
let projectTypes = [];
let editando = false;
let tipoEditando = null;
let tipoToggle = null;

// Util: abrir/fechar modal pelo id
function abrirModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove("hidden");
  el.style.display = "block";
  el.setAttribute("aria-hidden", "false");
  
  // Abrir overlay correspondente
  const overlayId = id === "modal-tipo" ? "modal-overlay-tipo" : 
                    id === "modal-toggle-tipo" ? "modal-overlay-toggle-tipo" : null;
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
  const overlayId = id === "modal-tipo" ? "modal-overlay-tipo" : 
                    id === "modal-toggle-tipo" ? "modal-overlay-toggle-tipo" : null;
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
function abrirModalTipo(titulo, dados = null) {
  const modal = document.getElementById("modal-tipo");
  if (!modal) return;

  abrirModal("modal-tipo");

  const modalTitulo = document.getElementById("modal-titulo");
  if (modalTitulo) {
    modalTitulo.textContent = titulo;
  }
  
  const btnSubmit = modal.querySelector(".modal-actions .btn.primary");
  if (btnSubmit) {
    btnSubmit.textContent = titulo.toLowerCase().includes("editar")
      ? "Salvar"
      : "Criar";
  }

  document.getElementById("nome-tipo").value = dados?.name ?? "";
  document.getElementById("descricao-tipo").value = dados?.description ?? "";

  editando = !!dados;
  tipoEditando = dados;
}

function abrirModalToggle(tipo, isActive) {
  const modal = document.getElementById("modal-toggle-tipo");
  if (!modal) return;

  abrirModal("modal-toggle-tipo");

  const titulo = document.getElementById("modal-toggle-titulo-tipo");
  const mensagem = document.getElementById("modal-toggle-mensagem-tipo");
  
  if (titulo) {
    titulo.textContent = isActive ? "Desativar Tipo de Projeto" : "Ativar Tipo de Projeto";
  }
  
  if (mensagem) {
    mensagem.textContent = isActive
      ? `Tem certeza que deseja desativar o tipo de projeto "${tipo.name}"?`
      : `Tem certeza que deseja ativar o tipo de projeto "${tipo.name}"?`;
  }

  tipoToggle = { tipo, isActive, originalState: isActive };
}

async function loadProjectTypes() {
  try {
    const [activeData, inactiveData] = await Promise.all([
      apiService.getProjectTypes(),
      fetch("/api/project-types/inactive", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthTokenOrThrow()}`,
        },
      }).then(res => res.ok ? res.json() : []).catch(() => [])
    ]);

    const active = Array.isArray(activeData) ? activeData : [];
    const inactive = Array.isArray(inactiveData) ? inactiveData : [];
    allProjectTypes = [...active, ...inactive];
    applyFilter();
  } catch (err) {
    console.error("Erro ao carregar tipos de projeto:", err);
    allProjectTypes = [];
    projectTypes = [];
    renderTable();
    window.showNotification &&
      window.showNotification("error", "Erro ao carregar tipos de projeto.");
  }
}

function applyFilter() {
  const filter = document.getElementById("status-filter-type")?.value || "all";
  
  if (filter === "all") {
    projectTypes = allProjectTypes;
  } else if (filter === "active") {
    projectTypes = allProjectTypes.filter(t => t.active);
  } else if (filter === "inactive") {
    projectTypes = allProjectTypes.filter(t => !t.active);
  }
  
  renderTable();
}

function renderTable() {
  const tbody = document.getElementById("types-table-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!projectTypes || projectTypes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 32px; color: #888;">
          Nenhum tipo de projeto encontrado.
        </td>
      </tr>
    `;
    return;
  }

  projectTypes.forEach((type) => {
    const tr = document.createElement("tr");
    
    tr.innerHTML = `
      <td>${type.name || "-"}</td>
      <td>${type.description || "-"}</td>
      <td>${type.active ? "Ativo" : "Inativo"}</td>
      <td class="action-btns">
        <button class="edit-btn" data-id="${type.id}" title="Editar" style="background: none; border: none; cursor: pointer; padding: 4px;">
          <img src="/assets/svg/edit-button.svg" alt="Editar" style="width: 34px; height: 34px;" />
        </button>
        ${type.active ? `
        <button class="delete-btn" data-id="${type.id}" data-active="${type.active}" title="Desativar" style="background: none; border: none; cursor: pointer; padding: 4px;">
          <img src="/assets/svg/trash-button.svg" alt="Desativar" style="width: 34px; height: 34px;" />
        </button>
        ` : `
        <button class="activate-btn" data-id="${type.id}" data-active="${type.active}" title="Ativar" style="background: none; border: none; cursor: pointer; padding: 4px;">
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

async function createProjectType(name, description) {
  try {
    const token = getAuthTokenOrThrow();
    const response = await fetch("/api/project-types", {
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
    console.error("Erro ao criar tipo de projeto:", error);
    throw error;
  }
}

async function updateProjectType(id, name, description) {
  try {
    const token = getAuthTokenOrThrow();
    const response = await fetch(`/api/project-types/${id}`, {
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
    console.error("Erro ao atualizar tipo de projeto:", error);
    throw error;
  }
}

async function enableProjectType(id) {
  try {
    const token = getAuthTokenOrThrow();
    const response = await fetch(`/api/project-types/enable/${id}`, {
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
    console.error("Erro ao ativar tipo de projeto:", error);
    throw error;
  }
}

async function disableProjectType(id) {
  try {
    const token = getAuthTokenOrThrow();
    const response = await fetch(`/api/project-types/disable/${id}`, {
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
    console.error("Erro ao inativar tipo de projeto:", error);
    throw error;
  }
}

// Ao carregar DOM
document.addEventListener("DOMContentLoaded", () => {
  loadProjectTypes();

  // Filtro de status
  const statusFilter = document.getElementById("status-filter-type");
  if (statusFilter) {
    statusFilter.addEventListener("change", applyFilter);
  }

  // Botão "+ Novo Tipo"
  const btnAdicionar = document.getElementById("btn-novo-tipo");
  if (btnAdicionar) {
    btnAdicionar.addEventListener("click", () => {
      abrirModalTipo("Adicionar Tipo de Projeto");
    });
  }

  // Delegação de eventos na tabela
  const tabela = document.getElementById("types-table-body");
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
        const type = allProjectTypes.find((t) => t.id == id);
        if (type) {
          console.log("Abrindo modal de edição para:", type);
          abrirModalTipo("Editar Tipo de Projeto", type);
        } else {
          console.error("Tipo não encontrado com ID:", id);
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
        const type = allProjectTypes.find((t) => t.id == id);
        if (type && isActive) {
          console.log("Abrindo modal de desativação para:", type);
          tipoToggle = { tipo: type, isActive: true, originalState: true };
          abrirModalToggle(type, true);
        } else {
          console.error("Tipo não encontrado com ID:", id, "ou não está ativo");
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
        const type = allProjectTypes.find((t) => t.id == id);
        if (type && !type.active) {
          console.log("Abrindo modal de ativação para:", type);
          tipoToggle = { tipo: type, isActive: false, originalState: false };
          abrirModalToggle(type, false);
        } else {
          console.error("Tipo não encontrado com ID:", id, "ou já está ativo");
        }
        return;
      }
    });
  }

  // Botão de confirmar toggle
  const btnConfirmarToggle = document.getElementById("btn-confirmar-toggle-tipo");
  if (btnConfirmarToggle) {
    btnConfirmarToggle.addEventListener("click", async () => {
      if (!tipoToggle) return;
      
      try {
        if (tipoToggle.isActive) {
          await disableProjectType(tipoToggle.tipo.id);
          window.showNotification &&
            window.showNotification("success", "Tipo de projeto desativado com sucesso.");
        } else {
          await enableProjectType(tipoToggle.tipo.id);
          window.showNotification &&
            window.showNotification("success", "Tipo de projeto ativado com sucesso.");
        }
        
        await loadProjectTypes();
        fecharModal("modal-toggle-tipo");
        tipoToggle = null;
      } catch (err) {
        window.showNotification &&
          window.showNotification("error", "Erro ao alterar status do tipo de projeto.");
      }
    });
  }
  
  // Reverter se cancelar (não precisa mais reverter toggle, pois não há mais toggle)
  const modalToggle = document.getElementById("modal-toggle-tipo");
  if (modalToggle) {
    const btnCancelar = modalToggle.querySelector(".btn.secondary");
    if (btnCancelar) {
      btnCancelar.addEventListener("click", () => {
        tipoToggle = null;
      });
    }
  }

  // Submit do formulário
  const form = document.getElementById("form-tipo");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nome = document.getElementById("nome-tipo").value.trim();
      const descricao = document.getElementById("descricao-tipo").value.trim();

      if (!nome) {
        window.showNotification &&
          window.showNotification("error", "Informe o nome do tipo de projeto.");
        return;
      }

      try {
        if (editando && tipoEditando) {
          await updateProjectType(tipoEditando.id, nome, descricao);
          window.showNotification &&
            window.showNotification("success", "Tipo de projeto atualizado com sucesso.");
        } else {
          await createProjectType(nome, descricao);
          window.showNotification &&
            window.showNotification("success", "Tipo de projeto criado com sucesso.");
        }
        
        await loadProjectTypes();
        fecharModal("modal-tipo");
        editando = false;
        tipoEditando = null;
        form.reset();
      } catch (err) {
        window.showNotification &&
          window.showNotification("error", "Erro ao salvar tipo de projeto.");
      }
    });
  }
});

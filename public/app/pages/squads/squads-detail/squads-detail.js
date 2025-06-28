document.addEventListener("DOMContentLoaded", function () {
  // Seletores dos botões
  const editBtn = document.querySelector(
    '.summary-actions .action-icon[alt="Editar"]'
  );
  const trashBtn = document.querySelector(
    '.summary-actions .action-icon[alt="Remover"]'
  );
  const modal = document.getElementById("delete-modal");
  const overlay = document.getElementById("deleteModalOverlay");
  const confirmDelete = document.getElementById("confirm-delete");
  const cancelDelete = document.getElementById("cancel-delete");
  const closeDeleteModal = document.getElementById("closeDeleteModal");

  // Redireciona para o formulário de edição
  if (editBtn) {
    editBtn.addEventListener("click", function () {
      window.location.href = "../squads-form/squads-form.html";
    });
  }

  // Função para mostrar o modal
  function showDeleteModal() {
    console.log("Showing delete modal");
    modal.classList.add("modal-open");
    modal.classList.remove("hidden");
    overlay.classList.remove("hidden");
  }

  // Função para esconder o modal
  function hideDeleteModal() {
    modal.classList.remove("modal-open");
    modal.classList.add("hidden");
    overlay.classList.add("hidden");
  }

  // Abre o modal de confirmação ao clicar no trash
  if (trashBtn) {
    trashBtn.addEventListener("click", function (e) {
      e.preventDefault();
      showDeleteModal();
    });
  }

  // Fecha o modal ao cancelar ou clicar no X ou overlay
  [cancelDelete, closeDeleteModal, overlay].forEach((el) => {
    if (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        hideDeleteModal();
      });
    }
  });

  // Confirma exclusão (aqui só fecha o modal, implemente a lógica real se necessário)
  if (confirmDelete) {
    confirmDelete.addEventListener("click", function () {
      window.location.href = "../squads.html";
      hideDeleteModal();
    });
  }

  // FILTRO DE PROJETOS POR STATUS
  const statusSelect = document.getElementById("status-select");
  const projectCards = document.querySelectorAll(".project-card");

  if (statusSelect) {
    statusSelect.addEventListener("change", function () {
      const selected = statusSelect.value;
      projectCards.forEach((card) => {
        const statusSpan = card.querySelector(".project-status");
        if (!statusSpan) return;
        const statusText = statusSpan.textContent.trim();
        if (
          selected === "Todos" ||
          selected === "" ||
          statusText === selected
        ) {
          card.style.display = "flex";
        } else {
          card.style.display = "none";
        }
      });
    });
  }
});

// Exemplo de dados dos membros
const membros = [
  {
    nome: "Ana Souza",
    funcoes: ["Product Owner", "Analista"],
    horasAlocadas: "20hrs",
    horasDisponiveis: "20hrs",
  },
  {
    nome: "Carlos Lima",
    funcoes: ["Techlead", "Desenvolvedor Sênior"],
    horasAlocadas: "32hrs",
    horasDisponiveis: "8hrs",
  },
  {
    nome: "Juliana Alves",
    funcoes: ["QA", "Tester"],
    horasAlocadas: "16hrs",
    horasDisponiveis: "24hrs",
  },
  {
    nome: "Rafael Torres",
    funcoes: ["UX Designer"],
    horasAlocadas: "40hrs",
    horasDisponiveis: "0hrs",
  },
];

function renderMembros() {
  const teamList = document.querySelector(".team-list");
  teamList.innerHTML = "";
  membros.forEach((membro, index) => {
    const card = document.createElement("div");
    card.className = "member-card";
    card.innerHTML = `
      <div class="member-header">
        <strong>${membro.nome}</strong>
        <div class="member-actions">
          <button class="edit-btn" data-index="${index}">
            <img src="../../../../assets/svg/edit-button.svg" alt="Editar" style="vertical-align: middle; margin-right: 12px; margin-top: 15px; width: 34px; height: 34px;" />
          </button>
          <button class="trash-btn" data-index="${index}">
            <img src="../../../../assets/svg/trash-button.svg" alt="Remover" style="vertical-align: middle; margin-right: 4px; margin-top: 15px; width: 34px; height: 34px;" />
          </button>
        </div>
      </div>
      <p class="custom-p">${i18n.t("squads_form.functions")}</p>
      <div class="tags">
        ${membro.funcoes.map((f) => `<span>${f}</span>`).join(" ")}
      </div>
      <p class="custom-p custom-margin">${i18n.t(
        "squads_form.allocated_hours"
      )}: ${membro.horasAlocadas}</p>
      <p class="custom-p custom-margin">${i18n.t(
        "squads_form.available_hours"
      )} ${membro.horasDisponiveis}</p>
    `;
    teamList.appendChild(card);
  });

  // Adiciona evento de clique para remover membro
  const trashButtons = document.querySelectorAll(".trash-btn");
  trashButtons.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const idx = parseInt(this.getAttribute("data-index"));
      membros.splice(idx, 1);
      renderMembros();
    });
  });

  // Adiciona evento de clique para editar membro (abrir modal)
  const editButtons = document.querySelectorAll(".edit-btn");
  editButtons.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      showModal(true);
      // Aqui você pode preencher os campos do modal com os dados do membro, se desejar
    });
  });
}

// Inicializa o serviço de i18n e só renderiza membros após carregar traduções
function waitForI18nAndRender() {
  if (
    window.i18n &&
    typeof i18n.t === "function" &&
    i18n.messages &&
    Object.keys(i18n.messages).length > 0
  ) {
    renderMembros();
  } else {
    setTimeout(waitForI18nAndRender, 50);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", waitForI18nAndRender);
} else {
  waitForI18nAndRender();
}

// referências
const openBtn = document.querySelector(".team-section p");
const modal = document.getElementById("addMemberModal");
const overlay = document.getElementById("modalOverlay");
const closeBtn = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelAdd");
const modalTitle = modal.querySelector(".modal-header h2");

// função para mostrar modal
function showModal(isEdit = false) {
  const modalTitle = document.getElementById("modalTitle");
  if (isEdit) {
    modalTitle.textContent = i18n.t("squads_form.edit_member");
  } else {
    modalTitle.textContent = i18n.t("squads_form.add_member");
  }
  modal.classList.add("modal-open");
  modal.classList.remove("hidden");
  overlay.classList.remove("hidden");
}

// função para esconder modal
function hideModal() {
  modal.classList.remove("modal-open");
  modal.classList.add("hidden");
  overlay.classList.add("hidden");
}

// abrir ao clicar em “Adicione pessoas”
openBtn.addEventListener("click", (e) => {
  e.preventDefault();
  showModal(false);
});

// fechar ao clicar no X ou no overlay
[closeBtn, overlay].forEach((el) =>
  el.addEventListener("click", (e) => {
    e.preventDefault();
    hideModal();
  })
);
// cancelar do modal só fecha o modal
cancelBtn.addEventListener("click", (e) => {
  e.preventDefault();
  hideModal();
});

// (opcional) tratar submissão do form
document.getElementById("addMemberForm").addEventListener("submit", (e) => {
  e.preventDefault();
  //  você pega os valores e adiciona em `membros`, faz renderMembros(), etc.
  hideModal();
});

// pega elementos
const rolesSelect = document.getElementById("memberRoles");
const selectedRolesContainer = document.getElementById("selectedRoles");
const selectedRoles = [];

// quando escolher uma função no dropdown
rolesSelect.addEventListener("change", (e) => {
  const role = e.target.value;
  if (!role || selectedRoles.includes(role)) return;
  selectedRoles.push(role);
  renderSelectedRoles();
  rolesSelect.value = ""; // reseta o dropdown
});

// desenha as tags na tela
function renderSelectedRoles() {
  selectedRolesContainer.innerHTML = "";
  selectedRoles.forEach((role, idx) => {
    const pill = document.createElement("span");
    pill.textContent = role;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "×";
    btn.addEventListener("click", () => {
      selectedRoles.splice(idx, 1);
      renderSelectedRoles();
    });

    pill.appendChild(btn);
    selectedRolesContainer.appendChild(pill);
  });
}

// na hora de submeter, inclua selectedRoles no objeto do membro
document.getElementById("addMemberForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const nome = document.getElementById("memberName").value;
  const horas = document.getElementById("allocatedHours").value;
  // usa selectedRoles para as funções
  membros.push({
    nome,
    horasAlocadas: horas + "hrs",
    horasDisponiveis: "...", // ou calcule
    funcoes: [...selectedRoles],
  });
  renderMembros();
  selectedRoles.length = 0; // limpa array
  renderSelectedRoles(); // limpa UI
  hideModal();
});

document.querySelector(".form-squad").addEventListener("submit", function (e) {
  e.preventDefault();
  window.location.href = "../squads.html";
});
const mainCancelBtn = document.querySelector(".form-squad .cancel-btn");
if (mainCancelBtn) {
  mainCancelBtn.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "../squads.html";
  });
}

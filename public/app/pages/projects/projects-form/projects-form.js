
import { apiService } from "../../../../assets/js/apiService.js";

const saveBtn = document.getElementById("save-btn");
const form = document.querySelector(".form-project");

function getProjectIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function validateForm() {
  const name = document.getElementById("name-input").value.trim();
  const type = document.getElementById("type-select").value;
  const description = document.getElementById("description-input").value.trim();
  const status = document.getElementById("status-select").value;
  const budget = document.getElementById("budget-input").value;
  const startDate = document.getElementById("start-date-input").value;
  const endDate = document.getElementById("end-date-input").value;
  const valid =
    name && type && description && status && budget && startDate && endDate;
  saveBtn.disabled = !valid;
}

form.addEventListener("input", validateForm);

form.addEventListener("submit", async function (event) {
  event.preventDefault();
  const id = getProjectIdFromUrl();
  const project = {
    name: document.getElementById("name-input").value,
    typeId: parseInt(document.getElementById("type-select").value),
    description: document.getElementById("description-input").value,
    statusId: parseInt(document.getElementById("status-select").value),
    budget: parseFloat(document.getElementById("budget-input").value),
    startDate: document.getElementById("start-date-input").value,
    endDate: document.getElementById("end-date-input").value,
  };
  let result;
  if (id) {
    // Atualizar projeto (PATCH)
    if (typeof apiService.updateProject === "function") {
      result = await apiService.updateProject(id, project);
    } else {
      window.showNotification("error", "Função de atualização não implementada.");
      return;
    }
  } else {
    result = await apiService.insertProject(project);
  }
  if (result) {
    window.showNotification("success", id ? "Projeto atualizado com sucesso!" : "Projeto inserido com sucesso!");
    setTimeout(() => {
      window.location.href = "../projects.html";
    }, 1200);
  } else {
    window.showNotification(
      "error",
      id ? "Erro ao atualizar projeto. Veja o console para mais detalhes." : "Erro ao inserir projeto. Veja o console para mais detalhes."
    );
  }
});

async function fillProjectTypes(selectedId) {
  const select = document.getElementById("type-select");
  if (!select) return;
  select.innerHTML = '<option data-i18n="projects_form.select_type"></option>';
  try {
    const types = await apiService.getProjectTypes();
    types.forEach((type) => {
      if (type.active) {
        const option = document.createElement("option");
        option.value = type.id;
        option.textContent = type.name;
        if (selectedId && Number(selectedId) === type.id) option.selected = true;
        select.appendChild(option);
      }
    });
  } catch (err) {
    console.error("Erro ao buscar tipos de projeto:", err);
  }
}

async function fillProjectStatuses(selectedId) {
  const statusSelect = document.getElementById("status-select");
  if (!statusSelect) return;
  statusSelect.innerHTML =
    '<option data-i18n="projects_form.select_status"></option>';
  try {
    const statuses = await apiService.getProjectStatuses();
    statuses.forEach((status) => {
      if (status.active) {
        const option = document.createElement("option");
        option.value = status.id;
        option.textContent = status.name;
        if (selectedId && Number(selectedId) === status.id) option.selected = true;
        statusSelect.appendChild(option);
      }
    });
  } catch (err) {
    console.error("Erro ao buscar status de projeto:", err);
  }
}

async function patchFormValues(project) {
  document.getElementById("name-input").value = project.name || "";
  document.getElementById("description-input").value = project.description || "";
  document.getElementById("budget-input").value = project.budget || "";
  document.getElementById("start-date-input").value = project.startDate ? project.startDate.substring(0,10) : "";
  document.getElementById("end-date-input").value = project.endDate ? project.endDate.substring(0,10) : "";
  // selects preenchidos por fillProjectTypes/Statuses
}

async function initForm() {
  const id = getProjectIdFromUrl();
  if (id) {
    // Modo edição
    const project = await apiService.getProjectById(id);
    if (project) {
      await fillProjectTypes(project.type?.id);
      await fillProjectStatuses(project.status?.id);
      await patchFormValues(project);
      validateForm();
    } else {
      window.showNotification && window.showNotification("error", "Projeto não encontrado para edição.");
    }
  } else {
    fillProjectTypes();
    fillProjectStatuses();
  }
}

initForm();

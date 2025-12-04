import { apiService } from "../../../../assets/js/apiService.js";

const saveBtn = document.getElementById("save-btn");
const cancelBtn = document.getElementById("cancel-btn");
const form = document.querySelector(".form-project");

function capitalizeFirst(str) {
  if (!str || typeof str !== "string") return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

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
  let valid = name && type && description && status && budget && startDate;
  const start = parseDateBR(startDate);
  const end = parseDateBR(endDate);
  if (startDate && !start) {
    document.getElementById("start-date-input").setCustomValidity("Data inválida. Use dd/mm/aaaa.");
    valid = false;
  } else {
    document.getElementById("start-date-input").setCustomValidity("");
  }
  if (endDate && !end) {
    document.getElementById("end-date-input").setCustomValidity("Data inválida. Use dd/mm/aaaa.");
    valid = false;
  } else {
    document.getElementById("end-date-input").setCustomValidity("");
  }
  // Se ambas datas preenchidas e válidas, validar relação
  if (start && end) {
    if (end < start) {
      valid = false;
      document.getElementById("end-date-input").setCustomValidity("A data de término não pode ser menor que a data de início.");
    } else {
      document.getElementById("end-date-input").setCustomValidity("");
    }
    if (start > end) {
      valid = false;
      document.getElementById("start-date-input").setCustomValidity("A data de início não pode ser maior que a data de término.");
    } else {
      document.getElementById("start-date-input").setCustomValidity("");
    }
  }
  saveBtn.disabled = !valid;
}

// Máscara de reais para o campo budget
const budgetInput = document.getElementById("budget-input");
const startDateInput = document.getElementById("start-date-input");
const endDateInput = document.getElementById("end-date-input");

// --- Datepicker Customizado ---
function formatDateBR(date) {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function parseDateBR(str) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return null;
  const [d, m, y] = str.split('/').map(Number);
  const date = new Date(y, m - 1, d);
  return date && date.getDate() === d && date.getMonth() === m - 1 && date.getFullYear() === y ? date : null;
}

function buildDatepicker(input, pickerId) {
  const picker = document.getElementById(pickerId);
  if (!picker) return;
  let selectedDate = null;
  function renderCalendar(month, year, minDate, maxDate) {
    picker.innerHTML = '';
    const today = new Date();
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '8px';
    const prev = document.createElement('button');
    prev.textContent = '<';
    prev.type = 'button';
    prev.onclick = () => {
      if (month === 0) {
        renderCalendar(11, year - 1, minDate, maxDate);
      } else {
        renderCalendar(month - 1, year, minDate, maxDate);
      }
    };
    const next = document.createElement('button');
    next.textContent = '>';
    next.type = 'button';
    next.onclick = () => {
      if (month === 11) {
        renderCalendar(0, year + 1, minDate, maxDate);
      } else {
        renderCalendar(month + 1, year, minDate, maxDate);
      }
    };
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const title = document.createElement('span');
    title.textContent = `${monthNames[month]} ${year}`;
    header.appendChild(prev);
    header.appendChild(title);
    header.appendChild(next);
    picker.appendChild(header);
    const table = document.createElement('table');
    const daysRow = document.createElement('tr');
    ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].forEach(d => {
      const th = document.createElement('th');
      th.textContent = d;
      daysRow.appendChild(th);
    });
    table.appendChild(daysRow);
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let tr = document.createElement('tr');
    for (let i = 0; i < firstDay; i++) {
      tr.appendChild(document.createElement('td'));
    }
    for (let d = 1; d <= daysInMonth; d++) {
      if ((tr.children.length) === 7) {
        table.appendChild(tr);
        tr = document.createElement('tr');
      }
      const td = document.createElement('td');
      td.textContent = d;
      const thisDate = new Date(year, month, d);
      // Desabilita datas fora do range permitido
      let isDisabled = false;
      if (minDate && thisDate < minDate) isDisabled = true;
      if (maxDate && thisDate > maxDate) isDisabled = true;
      if (isDisabled) {
        td.style.opacity = '0.3';
        td.style.pointerEvents = 'none';
        td.style.cursor = 'not-allowed';
      } else {
        // Aplica classes para hoje e selecionado
        if (
          selectedDate &&
          thisDate.getDate() === selectedDate.getDate() &&
          thisDate.getMonth() === selectedDate.getMonth() &&
          thisDate.getFullYear() === selectedDate.getFullYear()
        ) {
          td.classList.add('selected');
        } else if (
          thisDate.getDate() === today.getDate() &&
          thisDate.getMonth() === today.getMonth() &&
          thisDate.getFullYear() === today.getFullYear()
        ) {
          td.classList.add('today');
        }
        td.onclick = () => {
          selectedDate = thisDate;
          input.value = formatDateBR(thisDate);
          picker.style.display = 'none';
          validateForm();
        };
      }
      tr.appendChild(td);
    }
    while (tr.children.length < 7) {
      tr.appendChild(document.createElement('td'));
    }
    table.appendChild(tr);
    picker.appendChild(table);
  }
  input.addEventListener('focus', () => {
    let date = parseDateBR(input.value);
    selectedDate = date;
    const now = date || new Date();
    // Define range de datas permitidas
    let minDate = null, maxDate = null;
    if (input.id === 'start-date-input') {
      // Não pode ser maior que a data final
      const endVal = document.getElementById('end-date-input').value;
      const end = parseDateBR(endVal);
      if (end) maxDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    } else if (input.id === 'end-date-input') {
      // Não pode ser menor que a data inicial
      const startVal = document.getElementById('start-date-input').value;
      const start = parseDateBR(startVal);
      if (start) minDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    }
    renderCalendar(now.getMonth(), now.getFullYear(), minDate, maxDate);
    // POSICIONA ACIMA DO INPUT
    picker.style.display = 'block';
    const rect = input.getBoundingClientRect();
    picker.style.position = 'absolute';
    picker.style.zIndex = 1000;
    picker.style.left = rect.left + window.scrollX + 'px';
    picker.style.top = (rect.top + window.scrollY - picker.offsetHeight - 8) + 'px';
    picker.style.minWidth = input.offsetWidth + 'px';
  });
  input.addEventListener('blur', () => {
    setTimeout(() => {
      picker.style.display = 'none';
    }, 200);
  });
  picker.addEventListener('mousedown', e => {
    e.preventDefault();
  });
  input.addEventListener('input', () => {
    // Permite digitação manual, mas só aceita dd/mm/yyyy válido
    if (input.value && !parseDateBR(input.value)) {
      input.setCustomValidity('Data inválida. Use dd/mm/aaaa.');
    } else {
      input.setCustomValidity('');
    }
    validateForm();
  });
}

buildDatepicker(startDateInput, 'datepicker-start');
buildDatepicker(endDateInput, 'datepicker-end');

function maskCurrency(e) {
  let v = e.target.value.replace(/\D/g, "");
  v = (parseInt(v, 10) || 0).toString();
  while (v.length < 3) v = "0" + v;
  let reais = v.slice(0, -2);
  let cents = v.slice(-2);
  reais = reais.replace(/^0+/, "") || "0";
  let formatted = `R$ ${reais.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${cents}`;
  e.target.value = formatted;
  // Aplica cor de placeholder se for R$ 0,00
  if (formatted === "R$ 0,00") {
    e.target.classList.add("budget-placeholder");
  } else {
    e.target.classList.remove("budget-placeholder");
  }
}

budgetInput.addEventListener("input", function (e) {
  maskCurrency(e);
  validateForm();
});

form.addEventListener("input", function (e) {
  validateForm();
});

form.addEventListener("submit", async function (event) {
  event.preventDefault();
  const id = getProjectIdFromUrl();
  // Extrai valor numérico do campo budget
  let budgetRaw = budgetInput.value.replace(/[^\d]/g, "");
  let budget = parseFloat(budgetRaw) / 100;
  if (isNaN(budget) || budget < 0) budget = 0;
  // Converte datas para yyyy-mm-dd
  function toISODate(str) {
    const d = parseDateBR(str);
    if (!d) return '';
    return d.toISOString().substring(0, 10);
  }
  const project = {
    name: document.getElementById("name-input").value,
    typeId: parseInt(document.getElementById("type-select").value),
    description: document.getElementById("description-input").value,
    statusId: parseInt(document.getElementById("status-select").value),
    budget: budget,
    startDate: toISODate(startDateInput.value),
    endDate: toISODate(endDateInput.value),
  };
  let result;
  const i18n = window.i18n || {};
  const t = (key) => (i18n.t ? i18n.t(key) : key);
  if (id) {
    // Atualizar projeto (PATCH)
    if (typeof apiService.updateProject === "function") {
      result = await apiService.updateProject(id, project);
    } else {
      window.showNotification(
        "error",
        t("projects_form.update_not_implemented")
      );
      return;
    }
  } else {
    result = await apiService.insertProject(project);
  }
  if (result) {
    window.showNotification(
      "success",
      id ? t("projects_form.update_success") : t("projects_form.insert_success")
    );
    setTimeout(() => {
      window.location.href = "../projects.html";
    }, 1200);
  } else {
    window.showNotification(
      "error",
      id ? t("projects_form.update_error") : t("projects_form.insert_error")
    );
  }
});

async function fillProjectTypes(selectedId) {
  const select = document.getElementById("type-select");
  if (!select) return;
  select.innerHTML =
    '<option data-i18n="projects_form.select_type" disabled selected hidden></option>';
  try {
    const types = await apiService.getProjectTypes();
    types.forEach((type) => {
      if (type.active) {
        const option = document.createElement("option");
        option.value = type.id;
        option.textContent = capitalizeFirst(type.name);
        if (selectedId && Number(selectedId) === type.id)
          option.selected = true;
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
    '<option data-i18n="projects_form.select_status" disabled selected hidden></option>';
  try {
    const statuses = await apiService.getProjectStatuses();
    const i18n = window.i18n || {};
    const t = (key) => (i18n.t ? i18n.t(key) : key);
    statuses.forEach((status) => {
      if (status.active) {
        const option = document.createElement("option");
        option.value = status.id;
        // Traduzir status.name se houver tradução
        const translated = t(`projects_form.${status.name}`);
        const statusName = translated !== `projects_form.${status.name}`
          ? translated
          : capitalizeFirst(status.name);
        option.textContent = statusName;
        if (selectedId && Number(selectedId) === status.id)
          option.selected = true;
        statusSelect.appendChild(option);
      }
    });
  } catch (err) {
    console.error("Erro ao buscar status de projeto:", err);
  }
}

async function patchFormValues(project) {
  document.getElementById("name-input").value = project.name || "";
  document.getElementById("description-input").value =
    project.description || "";
  // Preenche o campo budget com máscara
  let budget = parseFloat(project.budget);
  const budgetInputEl = document.getElementById("budget-input");
  if (!isNaN(budget)) {
    let v = Math.round(budget * 100).toString();
    while (v.length < 3) v = "0" + v;
    let reais = v.slice(0, -2);
    let cents = v.slice(-2);
    reais = reais.replace(/^0+/, "") || "0";
    const formatted = `R$ ${reais.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      "."
    )},${cents}`;
    budgetInputEl.value = formatted;
    if (formatted === "R$ 0,00") {
      budgetInputEl.classList.add("budget-placeholder");
    } else {
      budgetInputEl.classList.remove("budget-placeholder");
    }
  } else {
    budgetInputEl.value = "";
    budgetInputEl.classList.add("budget-placeholder");
  }
  // Preenche datas no formato dd/mm/yyyy
  function formatDateBRstr(str) {
    if (!str) return "";
    const d = new Date(str);
    if (isNaN(d)) return "";
    return formatDateBR(d);
  }
  document.getElementById("start-date-input").value = formatDateBRstr(project.startDate);
  document.getElementById("end-date-input").value = formatDateBRstr(project.endDate);
}

function showSkeleton(show) {
  const skeleton = document.getElementById("skeleton-loader");
  const formContainer = document.getElementById("form-container");
  if (skeleton && formContainer) {
    skeleton.style.display = show ? "block" : "none";
    formContainer.style.display = show ? "none" : "block";
  }
}

async function waitForI18nLoaded() {
  // Aguarda até que as traduções estejam carregadas
  if (
    !window.i18n ||
    !window.i18n.messages ||
    Object.keys(window.i18n.messages).length === 0
  ) {
    // Tenta aguardar até 2s (20 tentativas de 100ms)
    for (let i = 0; i < 20; i++) {
      await new Promise((res) => setTimeout(res, 100));
      if (
        window.i18n &&
        window.i18n.messages &&
        Object.keys(window.i18n.messages).length > 0
      )
        break;
    }
  }
}

async function initForm() {
  showSkeleton(true);
  await waitForI18nLoaded();
  if (window.i18n && typeof window.i18n.apply === "function") {
    window.i18n.apply();
  }
  const id = getProjectIdFromUrl();
  if (id) {
    // Modo edição
    const project = await apiService.getProjectById(id);
    if (project) {
      await fillProjectTypes(project.type?.id);
      await fillProjectStatuses(project.status?.id);
      await patchFormValues(project);
      validateForm();
      if (window.i18n && typeof window.i18n.apply === "function")
        window.i18n.apply();
      showSkeleton(false);
    } else {
      showSkeleton(false);
      window.showNotification &&
        window.showNotification(
          "error",
          window.i18n && window.i18n.t
            ? window.i18n.t("projects_form.not_found_edit")
            : "Projeto não encontrado para edição."
        );
    }
  } else {
    await Promise.all([fillProjectTypes(), fillProjectStatuses()]);
    if (window.i18n && typeof window.i18n.apply === "function")
      window.i18n.apply();
    showSkeleton(false);
  }
}

initForm();

// Botão cancelar volta para a página anterior
if (cancelBtn) {
  cancelBtn.addEventListener("click", function (e) {
    e.preventDefault();
    window.history.length > 1
      ? window.history.back()
      : (window.location.href = "../projects.html");
  });
}

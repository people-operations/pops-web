// ====== Demo data (substitua por fetch da API quando integrar) ======
const DATA = {
  general: [
    {
      subject: "Assunto aqui",
      name: "Nome aqui",
      date: "00/00/00",
      urgency: true,
    },
    {
      subject: "Assunto aqui",
      name: "Nome aqui",
      date: "00/00/00",
      urgency: true,
    },
    {
      subject: "Assunto aqui",
      name: "Nome aqui",
      date: "00/00/00",
      urgency: true,
    },
    {
      subject: "Assunto aqui",
      name: "Nome aqui",
      date: "00/00/00",
      urgency: true,
    },
  ],
  feedback: [
    {
      subject: "Assunto aqui",
      name: "Nome aqui",
      date: "00/00/00",
      urgency: true,
      notified: false,
    },
    {
      subject: "Assunto aqui",
      name: "Nome aqui",
      date: "00/00/00",
      urgency: true,
      notified: false,
    },
    {
      subject: "Assunto aqui",
      name: "Nome aqui",
      date: "00/00/00",
      urgency: true,
      notified: false,
    },
    {
      subject: "Assunto aqui",
      name: "Nome aqui",
      date: "00/00/00",
      urgency: true,
      notified: false,
    },
  ],
  approval: [
    {
      squad: "Nome da squad",
      area: "Área aqui",
      owner: "Product owner",
      squadMembers: ["K", "K", "K"],
      projects: ["K", "K", "K"],
    },
    {
      squad: "Nome da squad",
      area: "Área aqui",
      owner: "Product owner",
      squadMembers: ["K", "K"],
      projects: ["K", "K", "K"],
    },
    {
      squad: "Nome da squad",
      area: "Área aqui",
      owner: "Product owner",
      squadMembers: ["K", "K", "K", "K"],
      projects: ["K"],
    },
    {
      squad: "Nome da squad",
      area: "Área aqui",
      owner: "Product owner",
      squadMembers: ["K", "K", "K"],
      projects: ["K", "K"],
    },
  ],
};

// ====== Elements ======
const $tabs = [...document.querySelectorAll(".tab")];
const $thead = document.getElementById("thead");
const $tbody = document.getElementById("tbody");

// ====== Renderers ======
const renderers = {
  general() {
    $thead.innerHTML = `
          <tr>
            <th>Assunto</th><th>Nome</th><th>Data</th><th style="text-align:right">Status</th>
          </tr>`;
    $tbody.innerHTML = DATA.general
      .map(
        (item) => `
          <tr>
            <td data-th="Assunto">${item.subject}</td>
            <td data-th="Nome">${item.name}</td>
            <td data-th="Data">${item.date}</td>
            <td data-th="Status" style="text-align:right">
              <span class="badge badge-urgency">Urgência</span>
            </td>
          </tr>
        `
      )
      .join("");
  },
  feedback() {
    $thead.innerHTML = `
          <tr>
            <th>Assunto</th><th>Nome</th><th>Data</th><th>Status</th><th style="text-align:right">Ações</th>
          </tr>`;
    $tbody.innerHTML = DATA.feedback
      .map(
        (item, idx) => `
          <tr>
            <td data-th="Assunto">${item.subject}</td>
            <td data-th="Nome">${item.name}</td>
            <td data-th="Data">${item.date}</td>
            <td data-th="Status"><span class="badge badge-urgency">Urgência</span></td>
            <td data-th="Ações">
              <div class="actions">
                <button class="btn btn-outline" onclick="notify(${idx})">${
          item.notified ? "Avisado" : "Fazer feedback"
        }</button>
                <button class="btn btn-outline" onclick="notify(${idx}, true)">Avisado</button>
              </div>
            </td>
          </tr>
        `
      )
      .join("");
  },
  approval() {
    $thead.innerHTML = `
          <tr>
            <th>Nome da squad</th><th>Área</th><th>Nome do product owner</th><th>Squad</th><th>Projetos</th>
            <th style="text-align:right">Ações</th>
          </tr>`;
    $tbody.innerHTML = DATA.approval
      .map(
        (r, i) => `
          <tr>
            <td data-th="Squad">${r.squad}</td>
            <td data-th="Área">${r.area}</td>
            <td data-th="PO">${r.owner}</td>
            <td data-th="Membros">
              ${r.squadMembers
                .map(
                  (k, ix) =>
                    `<span class="chip k${(ix % 3) + 1}"><b>K</b></span>`
                )
                .join(" ")}
            </td>
            <td data-th="Projetos">
              ${r.projects
                .map(
                  (k, ix) =>
                    `<span class="chip k${(ix % 3) + 1}"><b>K</b></span>`
                )
                .join(" ")}
            </td>
            <td data-th="Ações">
              <div class="actions">
                <button class="btn btn-primary" onclick="approve(${i})">Aceitar</button>
                <button class="btn btn-outline" onclick="reject(${i})">Reprovar</button>
              </div>
            </td>
          </tr>
        `
      )
      .join("");
  },
};

// ====== Actions (stub) ======
window.notify = (idx, direct = false) => {
  if (direct) {
    DATA.feedback[idx].notified = true;
  }
  alert(
    direct ? "Marcado como avisado." : "Abrir modal de feedback (placeholder)."
  );
  renderCurrent();
};
window.approve = (i) => {
  alert("Solicitação aprovada.");
};
window.reject = (i) => {
  alert("Solicitação reprovada.");
};

// ====== Tabs ======
let current = "general";
function setTab(tab) {
  current = tab;
  $tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
  renderCurrent();
}
function renderCurrent() {
  renderers[current]();
}
$tabs.forEach((t) => t.addEventListener("click", () => setTab(t.dataset.tab)));
renderCurrent();

// ====== Year dropdown (estático, só exibição) ======
document.getElementById("year-select").addEventListener("click", () => {
  const next =
    (parseInt(document.getElementById("year-label").textContent, 10) || 2025) +
    1;
  document.getElementById("year-label").textContent = next > 2027 ? 2025 : next; // loop 2025-2027
});

// ====== Backline ======
document
  .getElementById("go-back")
  .addEventListener("click", () => history.back());

// ====== Profile dropdown ======
const dropdown = document.getElementById("dropdown");
document
  .querySelector(".avatar")
  .addEventListener("click", () => dropdown.classList.toggle("hidden"));
document.addEventListener("click", (e) => {
  if (!e.target.closest(".profile-menu")) dropdown.classList.add("hidden");
});

// ====== Theme toggle ======
const themeBtn = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");
const applyTheme = (mode) => {
  document.documentElement.classList.toggle("dark", mode === "dark");
  themeIcon.textContent = mode === "dark" ? "🌙" : "🌞";
  localStorage.setItem("pops-theme", mode);
};
const stored =
  localStorage.getItem("pops-theme") ||
  (window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light");
applyTheme(stored);
themeBtn.addEventListener("click", () => {
  applyTheme(
    document.documentElement.classList.contains("dark") ? "light" : "dark"
  );
});

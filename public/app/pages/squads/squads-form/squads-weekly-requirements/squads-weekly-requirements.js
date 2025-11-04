// Util: atualiza o background do slider para mostrar preenchimento
function paintRangeTrack(rangeEl) {
  const min = Number(rangeEl.min ?? 0);
  const max = Number(rangeEl.max ?? 40);
  const val = Number(rangeEl.value ?? 0);
  const pct = ((val - min) * 100) / (max - min);
  // faixa preta preenchida até o valor, restante cinza claro
  rangeEl.style.background = `linear-gradient(90deg, #111 0% ${pct}%, #e5e7eb ${pct}% 100%)`;
}

// Cria uma linha de marcas sob a trilha
function buildMarks(container, min, max) {
  // posições no layout: 1h, 10h, 20h, 30h, 40h
  const marks = [1, 10, 20, 30, 40].filter((v) => v >= min && v <= max);
  const wrap = document.createElement("div");
  wrap.className = "marks";
  marks.forEach((v) => {
    const tick = document.createElement("div");
    tick.className = "tick";
    const pct = ((v - min) * 100) / (max - min);
    tick.style.left = `${pct}%`;
    tick.innerHTML = `<span>${v === 1 ? "1h" : v + "h"}</span>`;
    wrap.appendChild(tick);
  });
  container.appendChild(wrap);
}

// Renderiza um cartão de função com slider

function renderRoleCard(container, role) {
  // defaults de range (você pode ajustar por função se quiser)
  const min = 0;
  const max = 40;
  const start = role.hours ?? 0;

  const card = document.createElement("div");
  card.className = "hours-card";

  // Função para calcular média diária
  function getMediaDiaria(weekHours) {
    if (!weekHours || isNaN(weekHours)) return "0h/dia";
    const diaria = weekHours / 5;
    // Exibe com 1 casa decimal se não for inteiro
    return diaria % 1 === 0 ? `${diaria}h/dia` : `${diaria.toFixed(1)}h/dia`;
  }

  card.innerHTML = `
    <h4>${role.title}</h4>
    <div class="hint-row d-flex">
      <div class="hint">${role.hint || "1- 40 horas por pessoa"}</div>
      <div class="media-diaria" style="margin-left:12px; margin-top:-2px; color:#7d1bff; font-weight:600;">${getMediaDiaria(
        start
      )}</div>
    </div>
    <div class="slider-row">
      <div class="slider-wrap">
        <input type="range" min="${min}" max="${max}" step="1" value="${start}" aria-label="Horas alocadas para ${
    role.title
  }"/>
      </div>
      <div class="value-box">
        <input type="number" min="${min}" max="${max}" step="1" value="${start}" inputmode="numeric" />
        <span class="suffix">Horas</span>
      </div>
    </div>
  `;

  // marcas
  const sliderWrap = card.querySelector(".slider-wrap");
  const rangeEl = card.querySelector('input[type="range"]');
  const numberEl = card.querySelector('input[type="number"]');
  const mediaDiariaEl = card.querySelector(".media-diaria");
  buildMarks(sliderWrap, min, max);
  paintRangeTrack(rangeEl);

  // Atualiza média diária
  function updateMediaDiaria(val) {
    if (mediaDiariaEl) mediaDiariaEl.textContent = getMediaDiaria(val);
  }

  // sincronização range <-> number
  rangeEl.addEventListener("input", () => {
    numberEl.value = rangeEl.value;
    paintRangeTrack(rangeEl);
    role.hours = Number(rangeEl.value);
    updateMediaDiaria(role.hours);
    checkNextButton();
  });
  numberEl.addEventListener("input", () => {
    let v = Number(numberEl.value || 0);
    if (Number.isNaN(v)) v = 0;
    if (v < min) v = min;
    if (v > max) v = max;
    numberEl.value = v;
    rangeEl.value = v;
    paintRangeTrack(rangeEl);
    role.hours = v;
    updateMediaDiaria(role.hours);
    checkNextButton();
  });

  container.appendChild(card);
}

function loadRolesFromPreviousStep() {
  // Carrega as roles do localStorage, mantendo todos os campos relevantes
  const raw = localStorage.getItem("squads.selectedRoles");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return parsed.map((r) => ({
        id: r.id,
        title: r.title,
        seniority: r.seniority,
        hardSkills: r.hardSkills,
        softSkills: r.softSkills,
        quantity: r.quantity || 1,
        hint: r.hint || "1- 40 horas por pessoa",
        hours: r.hours ?? 0,
      }));
    } catch {}
  }
  // Mock/Fallback
  return [
    {
      id: "fe-senior",
      title: "Front-end Sênior",
      hint: "1- 40 horas por pessoa",
      hours: 0,
    },
    {
      id: "fe-junior",
      title: "Front-end Junior",
      hint: "1- 40 horas por pessoa",
      hours: 0,
    },
  ];
}

function checkNextButton() {
  const next = document.getElementById("nextBtn");
  // Só habilita se todas as roles tiverem pelo menos 1 hora alocada
  const allHaveHours = (window.__roles || []).every(
    (r) => Number(r.hours) >= 1
  );
  next.disabled = !allHaveHours;
  if (!allHaveHours) {
    if (!next.classList.contains("disabled")) next.classList.add("disabled");
  } else {
    next.classList.remove("disabled");
  }
  // Ajuste de contraste para modo dark
  if (document.body.classList.contains("dark")) {
    next.classList.add("dark-mode");
  } else {
    next.classList.remove("dark-mode");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // mostra conteúdo (caso você use skeleton/loader em app.js)
  document.getElementById("main-content")?.classList.remove("hidden");

  // Recupera squadId da URL
  const urlParams = new URLSearchParams(window.location.search);
  const squadId = urlParams.get("squadId");

  const list = document.getElementById("weeklyList");
  window.__roles = loadRolesFromPreviousStep();

  window.__roles.forEach((r) => renderRoleCard(list, r));
  checkNextButton();

  // Botões
  document.getElementById("backBtn")?.addEventListener("click", () => {
    window.location.href = `../squads-roles/squads-roles.html${
      squadId ? `?squadId=${squadId}` : ""
    }`;
  });

  document.getElementById("nextBtn")?.addEventListener("click", () => {
    // Salva as roles com as horas definidas para o próximo passo
    localStorage.setItem(
      "squads.weeklyRequirements",
      JSON.stringify(window.__roles)
    );
    // Também atualiza as roles no localStorage para manter as horas junto das roles
    localStorage.setItem(
      "squads.selectedRoles",
      JSON.stringify(window.__roles)
    );
    window.location.href = `../squads-members/squads-members.html${
      squadId ? `?squadId=${squadId}` : ""
    }`;
  });
});

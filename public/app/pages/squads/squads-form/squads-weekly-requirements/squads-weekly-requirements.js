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

  card.innerHTML = `
    <h4>${role.title}</h4>
    <div class="hint">${role.hint || "2 - 12 horas por pessoa"}</div>

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
  buildMarks(sliderWrap, min, max);
  paintRangeTrack(rangeEl);

  // sincronização range <-> number
  rangeEl.addEventListener("input", () => {
    numberEl.value = rangeEl.value;
    paintRangeTrack(rangeEl);
    role.hours = Number(rangeEl.value);
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
        hint: r.hint || "2 - 12 horas por pessoa",
        hours: r.hours ?? 0,
      }));
    } catch {}
  }
  // Mock/Fallback
  return [
    {
      id: "fe-senior",
      title: "Front-end Sênior",
      hint: "2 - 12 horas por pessoa",
      hours: 0,
    },
    {
      id: "fe-junior",
      title: "Front-end Junior",
      hint: "2 - 12 horas por pessoa",
      hours: 0,
    },
  ];
}

function checkNextButton() {
  const next = document.getElementById("nextBtn");
  next.disabled = false; // Sempre habilitado
  // Ajuste de contraste para modo dark
  if (document.body.classList.contains('dark')) {
    next.classList.add('dark-mode');
  } else {
    next.classList.remove('dark-mode');
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // mostra conteúdo (caso você use skeleton/loader em app.js)
  document.getElementById("main-content")?.classList.remove("hidden");

  const list = document.getElementById("weeklyList");
  window.__roles = loadRolesFromPreviousStep();

  window.__roles.forEach((r) => renderRoleCard(list, r));
  checkNextButton();

  // Botões
  document.getElementById("backBtn")?.addEventListener("click", () => {
    window.location.href = "../squads-roles/squads-roles.html";
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
    window.location.href = "../squads-members/squads-members.html";
  });
});

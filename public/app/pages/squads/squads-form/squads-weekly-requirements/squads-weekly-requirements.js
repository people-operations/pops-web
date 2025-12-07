// Duração da sprint em semanas (será buscada da squad)
let sprintDuration = 0;
// Horas semanais padrão (será buscada dos colaboradores ou usa 40h como padrão)
let defaultWorkHoursPerWeek = 40;

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

  // Função para calcular total do projeto
  function getTotalProjeto(weekHours) {
    if (!weekHours || isNaN(weekHours) || sprintDuration === 0) return "0h";
    const total = weekHours * sprintDuration;
    return `${total}h`;
  }

  card.innerHTML = `
    <h4>${role.title}</h4>
    <div class="hint-row" style="margin-bottom: 8px;">
      <div class="hint" style="font-weight: 600;">Qtd. horas semanais: ${defaultWorkHoursPerWeek}h</div>
    </div>
    <div class="info-line" style="margin-bottom: 12px; font-size: 13px; color: #666;">
      <span class="media-diaria" style="color:#7d1bff; font-weight:600;">${getMediaDiaria(start)}</span>
      ${sprintDuration > 0 ? `<span class="total-info" style="margin-left: 12px; color:#2f7d32; font-weight:600;">(${getTotalProjeto(start)} total - ${sprintDuration} semanas)</span>` : ''}
    </div>
    <div class="slider-row">
      <div class="slider-wrap">
        <input type="range" min="${min}" max="${max}" step="1" value="${start}" aria-label="Horas alocadas para ${
    role.title
  }"/>
      </div>
      <div class="value-box">
        <input type="number" min="${min}" max="${max}" step="1" value="${start}" inputmode="numeric" />
        <span class="suffix">h/sem</span>
      </div>
    </div>
    <div class="total-projeto" style="margin-top: 8px; font-size: 13px; color: #666; text-align: right;">
      <strong>Total do projeto:</strong> <span class="total-projeto-value" style="color: #7d1bff; font-weight: 600;">${getTotalProjeto(start)}</span>
    </div>
  `;

  // marcas
  const sliderWrap = card.querySelector(".slider-wrap");
  const rangeEl = card.querySelector('input[type="range"]');
  const numberEl = card.querySelector('input[type="number"]');
  const mediaDiariaEl = card.querySelector(".media-diaria");
  const totalInfoEl = card.querySelector(".total-info");
  const totalProjetoValueEl = card.querySelector(".total-projeto-value");
  buildMarks(sliderWrap, min, max);
  paintRangeTrack(rangeEl);

  // Atualiza média diária e total do projeto
  function updateCalculations(val) {
    // Atualiza média diária
    if (mediaDiariaEl) {
      mediaDiariaEl.textContent = getMediaDiaria(val);
    }
    // Atualiza o total na linha de informações (se existir)
    if (totalInfoEl && sprintDuration > 0) {
      totalInfoEl.textContent = `(${getTotalProjeto(val)} total - ${sprintDuration} semanas)`;
    }
    // Atualiza o total do projeto na linha separada
    if (totalProjetoValueEl) {
      totalProjetoValueEl.textContent = getTotalProjeto(val);
    }
  }

  // sincronização range <-> number
  rangeEl.addEventListener("input", () => {
    numberEl.value = rangeEl.value;
    paintRangeTrack(rangeEl);
    role.hours = Number(rangeEl.value);
    updateCalculations(role.hours);
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
    updateCalculations(role.hours);
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

document.addEventListener("DOMContentLoaded", async () => {
  // mostra conteúdo (caso você use skeleton/loader em app.js)
  document.getElementById("main-content")?.classList.remove("hidden");

  // Recupera squadId da URL
  const urlParams = new URLSearchParams(window.location.search);
  const squadId = urlParams.get("squadId");

  // Busca sprintDuration da squad se houver squadId
  if (squadId) {
    try {
      const api = await import("../../../../../assets/js/apiService.js").then(m => m.apiService);
      const squad = await api.getSquadById(squadId);
      if (squad && squad.sprintDuration) {
        sprintDuration = squad.sprintDuration;
        console.log(`✅ Sprint duration carregada: ${sprintDuration} semanas`);
      }
    } catch (error) {
      console.warn("Erro ao buscar sprintDuration da squad:", error);
      // Usa valor padrão se não conseguir buscar
      sprintDuration = 4; // padrão: 4 semanas
    }
  } else {
    // Se não houver squadId, tenta buscar do localStorage (do formulário anterior)
    try {
      const formData = localStorage.getItem("squads.formData");
      if (formData) {
        const parsed = JSON.parse(formData);
        if (parsed.sprintDuration) {
          sprintDuration = parsed.sprintDuration;
        }
      }
    } catch (e) {
      console.warn("Erro ao buscar sprintDuration do localStorage:", e);
    }
    // Se ainda não tiver, usa padrão
    if (sprintDuration === 0) {
      sprintDuration = 4; // padrão: 4 semanas
    }
  }

  // Busca workHoursPerWeek dos colaboradores para usar como padrão
  try {
    const api = await import("../../../../../assets/js/apiService.js").then(m => m.apiService);
    const collaborators = await api.getCollaborators();
    if (Array.isArray(collaborators) && collaborators.length > 0) {
      // Pega o primeiro workHoursPerWeek encontrado ou usa 40h como padrão
      const firstWorkHours = collaborators.find(c => c.workHoursPerWeek)?.workHoursPerWeek;
      if (firstWorkHours) {
        defaultWorkHoursPerWeek = firstWorkHours;
      }
      // Ou calcula a média se preferir
      // const avgWorkHours = collaborators
      //   .filter(c => c.workHoursPerWeek)
      //   .reduce((sum, c) => sum + c.workHoursPerWeek, 0) / collaborators.filter(c => c.workHoursPerWeek).length;
      // if (avgWorkHours) defaultWorkHoursPerWeek = Math.round(avgWorkHours);
    }
  } catch (error) {
    console.warn("Erro ao buscar workHoursPerWeek dos colaboradores:", error);
    // Mantém 40h como padrão
  }

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

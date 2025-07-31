document.addEventListener('DOMContentLoaded', () => {
  const tabs       = document.querySelectorAll('.tab');
  const steps      = document.querySelectorAll('.form-step');
  const btnNext    = document.querySelector('.next-btn');
  const btnPrev    = document.querySelector('.prev-btn');
  const btnSave    = document.querySelector('.save-btn');
  const btnCancel  = document.querySelector('.cancel-btn');
  let currentStep  = 1;
  const maxSteps   = steps.length;

  function showStep(step) {
    // ativa aba
    tabs.forEach(t => t.classList.toggle('active', Number(t.dataset.step) === step));
    // mostra conteúdo
    steps.forEach(s => s.classList.toggle('hidden', Number(s.dataset.step) !== step));
    // controla botões
    btnPrev.style.display  = step === 1    ? 'none' : 'inline-flex';
    btnNext.style.display  = step === maxSteps ? 'none' : 'inline-flex';
    btnSave.style.display  = step === maxSteps ? 'inline-flex' : 'none';
  }

  // clique direto na tab
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      currentStep = Number(tab.dataset.step);
      showStep(currentStep);
    });
  });

  // próximo
  btnNext.addEventListener('click', () => {
    if (currentStep < maxSteps) {
      currentStep++;
      showStep(currentStep);
    }
  });

  // voltar
  btnPrev.addEventListener('click', () => {
    if (currentStep > 1) {
      currentStep--;
      showStep(currentStep);
    }
  });

  // cancelar volta pra lista
  btnCancel.addEventListener('click', () => {
    window.location.href = '../collaborators.html';
  });

  // inicializa
  showStep(currentStep);
});

function isI18nReady() {
  return window.i18n && typeof window.i18n.t === "function";
}

function createChart() {
  const ctx = document.getElementById("workloadChart").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: [
        window.i18n.t("dashboard.chart_labels.development"),
        window.i18n.t("dashboard.chart_labels.design"),
        window.i18n.t("dashboard.chart_labels.qa"),
        window.i18n.t("dashboard.chart_labels.devops"),
      ],
      datasets: [
        {
          label: window.i18n.t("dashboard.chart_overload_rate"),
          data: [85, 50, 20, 90],
          backgroundColor: "rgba(255, 99, 132, 0.6)",
        },
        {
          label: window.i18n.t("dashboard.chart_allocated_hours"),
          data: [170, 120, 60, 190],
          backgroundColor: "rgba(54, 162, 235, 0.6)",
        },
        {
          label: window.i18n.t("dashboard.chart_available_hours"),
          data: [200, 180, 160, 200],
          backgroundColor: "rgba(75, 192, 192, 0.6)",
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: window.i18n.t("dashboard.chart_axis_label"),
          },
        },
      },
      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });
}

// Aguarda até o i18n estar pronto antes de rodar o gráfico
if (isI18nReady()) {
  createChart();
} else {
  const interval = setInterval(() => {
    if (isI18nReady()) {
      clearInterval(interval);
      createChart();
    }
  }, 100);
}

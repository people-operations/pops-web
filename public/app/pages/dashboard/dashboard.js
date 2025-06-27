const ctx = document.getElementById("workloadChart").getContext("2d");
new Chart(ctx, {
  type: "bar",
  data: {
    labels: ["Desenvolvimento", "Design", "QA", "DevOps"],
    datasets: [
      {
        label: "Taxa de Sobrecarga (%)",
        data: [85, 50, 20, 90],
        backgroundColor: "rgba(255, 99, 132, 0.6)",
      },
      {
        label: "Horas Alocadas",
        data: [170, 120, 60, 190],
        backgroundColor: "rgba(54, 162, 235, 0.6)",
      },
      {
        label: "Horas Disponíveis",
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
          text: "Horas / Porcentagem",
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

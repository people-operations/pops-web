
// Torna as linhas da tabela de colaboradores clicáveis e redireciona para a tela de detalhe
document.addEventListener('DOMContentLoaded', function () {
	const rows = document.querySelectorAll('.collaborators-table .collaborator-row');
	rows.forEach(row => {
		row.style.cursor = 'pointer';
		row.addEventListener('click', function (e) {
			// Evita que clique em botões dentro da linha dispare o redirecionamento
			if (e.target.tagName === 'BUTTON') return;
			window.location.href = 'collaborators-detail/collaborators-detail.html';
		});
	});
});

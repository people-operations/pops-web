// Importa o framework Express para criar o servidor web
const express = require("express");
// Importa o módulo 'path' para lidar com caminhos de arquivos e diretórios
const path = require("path");

// Cria uma instância do aplicativo Express
const app = express();

// Define a porta do servidor (usa a variável de ambiente PORT ou 3000 por padrão)
const PORT = process.env.PORT || 3000;

// Configura o Express para servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, "public")));

// Inicia o servidor e exibe uma mensagem no console quando estiver pronto
app.listen(PORT, () => {
  console.log(`Aplicação da POPS está rodando em http://localhost:${PORT} 🚀`);
});

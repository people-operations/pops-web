// ===================== IMPORTAÇÕES =====================
const express = require("express");
const path = require("path");

// ===================== CONFIGURAÇÃO DO APP =====================
const app = express();
const PORT = process.env.PORT || 3000;

// ===================== MIDDLEWARES =====================
app.use(express.static(path.join(__dirname, "public")));

// ===================== INICIALIZAÇÃO DO SERVIDOR =====================
app.listen(PORT, () => {
  console.log(`Aplicação da POPS está rodando em http://localhost:${PORT} 🚀`);
});

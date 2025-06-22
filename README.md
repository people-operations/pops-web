<h1 align="center">POPs - People Operations Web 🌐</h1>

<p align="center">
  Front-end do sistema de gestão de squads, performance e desenvolvimento de colaboradores.
</p>

<div align="center">

![🚧 Em desenvolvimento](https://img.shields.io/badge/status-🚧%20em%20desenvolvimento-yellow)
![📜 Licença MIT](https://img.shields.io/badge/license-MIT-blue)
![🧠 i18n Ativo](https://img.shields.io/badge/i18n-suporte%20pt%2Fen-brightgreen)
![✨ Último commit](https://img.shields.io/github/last-commit/people-operations/pops-web)

</div>

## 📘 Sobre o Projeto

**POPs (People Operations)** é uma plataforma de apoio à gestão ágil de times. Permite ao RH e líderes:

- Alocar pessoas em squads com visibilidade clara
- Avaliar performance por meio de feedbacks e PDI
- Visualizar indicadores estratégicos de sobrecarga e alocação
- Padronizar a organização por áreas, cargos e habilidades

Esta interface web oferece o front-end completo do sistema.

---

## 🎯 Funcionalidades

✅ Autenticação de login  
✅ Recuperação de senha com verificação por e-mail  
✅ Dashboard com KPIs e alertas de sobrecarga  
✅ Gestão de squads, membros e líderes  
✅ Controle de projetos por squads  
✅ Cadastro e visualização de cargos, skills e áreas  
✅ Caixa de entrada para ações pendentes (feedbacks e aprovações)  

---

## 🗺️ Fluxo do Usuário

```mermaid
graph TD;
  Login --> Dashboard;
  Dashboard --> Squads;
  Squads --> Membros;
  Dashboard --> Feedbacks;
  Feedbacks --> Performance;
````

---

## 📁 Estrutura do Projeto

```
POPS-WEB/
├── public/
│   ├── app/
│   │   ├── auth/                 # Login e recuperação de senha
│   │   └── pages/                # Áreas principais do sistema
│   └── assets/                   # Estáticos: css, img, i18n, svg
├── .github/
├── package.json
└── README.md
```

---

## 🚀 Instalação e Execução

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/POPS-WEB.git

# Acesse o diretório
cd POPS-WEB

# (Opcional) Instale dependências
npm install

# Inicie um servidor local
npx serve public/
```

---

## 🧠 Tecnologias e Padrões

* HTML5 / CSS3 / JS Vanilla
* Arquitetura modular
* Suporte a internacionalização (i18n)
* Consumo de APIs com padrão RESTful
* Estrutura pronta para migração futura (ex: React, Vue)

---

## 🧪 Testes

* Testes unitários com arquivos `.spec.js`
* Scripts de testes organizados por módulo

---

## 🤝 Contribuindo

1. Faça um fork 🍴
2. Crie sua branch: `git checkout -b feat/nome-da-feature`
3. Commit: `git commit -m 'feat: Minha feature'`
4. Push: `git push origin feat/nome-da-feature`
5. Crie um Pull Request ✨

---

## 📄 Licença

Distribuído sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

## 💡 Contato

Desenvolvido com 💜 por Equipe People Operations
📫 [email@empresa.com](mailto:email@empresa.com) | 🌐 [peopleoperations.dev](https://peopleoperations.dev)

---

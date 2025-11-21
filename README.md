# Fortnite Cosmetic Hub — Full Stack Project  
Este projeto, Fortnite Cosmetic Hub, é uma aplicação Full-Stack desenvolvida como prova de conceito para um desafio técnico de estágio, demonstrando conhecimento em integração de API de terceiros, autenticação segura baseada em cookies/sessão e manipulação dinâmica de dados no lado do servidor.
O objetivo principal foi criar uma plataforma completa que simula o ecossistema de gerenciamento de conta e comércio de um jogo. O sistema consome a Fortnite API para exibir o catálogo atual de cosméticos e utiliza Node.js/Express com Supabase para gerenciar o estado do usuário, protegendo rotas e inserindo dados de perfil e saldo (V-Bucks) na base de dados após o cadastro.

---

## Tecnologias Utilizadas

### Frontend
- HTML5 + CSS3  
- JavaScript (ES6)  
- EJS Templates (para páginas privadas)  
- Vercel (deploy)

### Backend
- Node.js + Express  
- Supabase (Auth + Database)  
- API externa: Fortnite API  
- Cookies + sessão  
- Vercel (deploy)

---

## Funcionalidades

### Concluídas
- Login e Registro  
- Proteção de rotas  
- Página privada dinâmica (via EJS)  
- Lista completa de cosméticos  
- Filtros avançados:
  - Tipo  
  - Raridade  
  - Itens novos  
  - Itens em promoção  
  - Itens à venda  
  - Pesquisa por nome  
  - Pesquisa por data  
- Paginação  
- Modal de compra com dados reais da API  

### Em Desenvolvimento
- Registrar compra do usuário
- Inventário do usuário  
- Exibir os itens comprados na conta  
- Exibir página de comunidade na qual os usuários podem ver os itens de outros usuários

---

### Estrutura do Projeto
<details>
  <summary><strong>Abrir</strong></summary>

│── public/<br>
│ ├── js/<br>
│ ├── styles/<br>
│ ├── images/<br>
│ ├── index.html<br>
│ ├── store.html<br>
│ └── register.html<br>
│<br>
│── views/<br>
│ └── private.ejs<br>
│<br>
│── server.js<br>
│── package.json<br>
│── .env<br>
└── README.md<br>
<details>

---

## Como Rodar Localmente

### 1. Clone o repositório
git clone https://github.com/cammyscode/Fortnite-Cosmetic-Hub.git
cd Fortnite-Cosmetic-Hub

- npm install

### 2.Configuração
Crie um arquivo .env na raiz do projeto:
SUPABASE_URL=sua_url_aqui
SUPABASE_KEY=sua_key_aqui

### 3.Rodando o servidor
node server.js

### 4.Acessando o projeto
Após rodar, abra no navegador: http://localhost:3000

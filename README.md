# 🛒 Marketplace Fullstack

Um marketplace completo e moderno desenvolvido com tecnologias de ponta, permitindo que usuários comprem e vendam produtos de forma segura e intuitiva.

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Tecnologias](#-tecnologias)
- [Funcionalidades](#-funcionalidades)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Como Executar](#-como-executar)
- [Documentação da API](#-documentação-da-api)
- [Autenticação](#-autenticação)
- [Deploy](#-deploy)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

## 🎯 Sobre o Projeto

Este é um marketplace fullstack completo que permite:

- **Compradores**: Navegar produtos, adicionar ao carrinho, fazer pedidos e realizar pagamentos
- **Vendedores**: Cadastrar produtos, gerenciar estoque, receber pedidos e processar pagamentos
- **Administradores**: Gerenciar usuários, produtos e monitorar o sistema

O projeto foi desenvolvido seguindo as melhores práticas de desenvolvimento, com arquitetura modular, código limpo e segurança em primeiro lugar.

## 🚀 Tecnologias

### Frontend
- **Next.js 15.3.0** - Framework React com SSR e SSG
- **React 19.0.0** - Biblioteca JavaScript para interfaces
- **TypeScript** - Superset JavaScript com tipagem estática
- **Tailwind CSS 4** - Framework CSS utility-first
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas
- **Axios** - Cliente HTTP
- **Socket.io Client** - Comunicação em tempo real
- **React OAuth Google** - Autenticação via Google
- **Stripe.js** - Integração de pagamentos

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js 4.21.2** - Framework web
- **TypeScript** - Superset JavaScript com tipagem estática
- **Prisma 6.5.0** - ORM moderno para TypeScript
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação baseada em tokens
- **Bcrypt** - Hash de senhas
- **Socket.io 4.8.3** - WebSockets para comunicação em tempo real
- **Stripe 18.4.0** - Processamento de pagamentos
- **Multer** - Upload de arquivos
- **Node-cron** - Agendamento de tarefas
- **Swagger** - Documentação da API
- **Google Auth Library** - Autenticação OAuth Google

## ✨ Funcionalidades

### 🔐 Autenticação e Autorização
- ✅ Cadastro de usuários com validação completa
- ✅ Login com email e senha
- ✅ Login via Google OAuth
- ✅ Autenticação JWT
- ✅ Recuperação de senha
- ✅ Perfis de usuário (Comprador, Vendedor, Admin)
- ✅ Middleware de autenticação

### 🛍️ Gestão de Produtos
- ✅ Listagem de produtos com filtros e busca
- ✅ Cadastro de produtos com múltiplas imagens
- ✅ Edição e exclusão de produtos
- ✅ Categorização por tipo (Eletrônicos, Roupas, Móveis, etc.)
- ✅ Controle de estoque
- ✅ Sistema de avaliações e comentários
- ✅ Histórico de preços

### 🛒 Carrinho de Compras
- ✅ Adicionar produtos ao carrinho
- ✅ Gerenciar quantidades
- ✅ Carrinho persistente (usuário logado ou sessão)
- ✅ Limpeza automática de carrinhos expirados (cron job)
- ✅ Cálculo automático de totais

### 📦 Gestão de Pedidos
- ✅ Criação de pedidos
- ✅ Acompanhamento de status (Pendente, Pago, Enviado, Entregue)
- ✅ Histórico de pedidos (comprador e vendedor)
- ✅ Gestão de endereços de entrega
- ✅ Tipos de envio (Normal e Expresso)

### 💳 Pagamentos
- ✅ Integração com Stripe
- ✅ Múltiplos métodos de pagamento (Cartão, PIX, Boleto)
- ✅ Webhooks para processamento de pagamentos
- ✅ Histórico de transações
- ✅ Onboarding de vendedores no Stripe Connect

### 💬 Mensagens em Tempo Real
- ✅ Sistema de mensagens entre usuários
- ✅ Comunicação via WebSocket
- ✅ Notificações em tempo real
- ✅ Histórico de conversas

### ⭐ Sistema de Avaliações
- ✅ Avaliar produtos (1-5 estrelas)
- ✅ Comentários em produtos
- ✅ Visualização de avaliações

### ❤️ Favoritos
- ✅ Adicionar produtos aos favoritos
- ✅ Listar produtos favoritos
- ✅ Remover favoritos

### 📍 Gestão de Endereços
- ✅ Cadastro de múltiplos endereços
- ✅ Validação de CEP e estados brasileiros
- ✅ Endereços para usuários logados e sessões

### 👤 Perfil de Usuário
- ✅ Visualização e edição de dados pessoais
- ✅ Upload de foto de perfil
- ✅ Alteração de senha
- ✅ Histórico de atividades
- ✅ Gestão de produtos (para vendedores)

### 🔧 Administração
- ✅ Painel administrativo
- ✅ Gerenciamento de usuários
- ✅ Gerenciamento de produtos
- ✅ Estatísticas e relatórios
- ✅ Visualização de pedidos

## 📁 Estrutura do Projeto

```
projeto-marketplace/
├── monorepo/
│   ├── apps/
│   │   ├── backend/              # API Backend
│   │   │   ├── src/
│   │   │   │   ├── controllers/  # Controladores da API
│   │   │   │   ├── routes/       # Rotas da API
│   │   │   │   ├── middlewares/  # Middlewares (auth, etc)
│   │   │   │   ├── services/     # Serviços (WebSocket, etc)
│   │   │   │   ├── types/        # Tipos TypeScript
│   │   │   │   ├── App.ts        # Configuração do Express
│   │   │   │   └── server.ts     # Ponto de entrada
│   │   │   ├── prisma/
│   │   │   │   ├── schema.prisma # Schema do banco de dados
│   │   │   │   └── migrations/   # Migrações do Prisma
│   │   │   ├── uploads/          # Arquivos enviados
│   │   │   └── package.json
│   │   │
│   │   └── frontend/             # Aplicação Next.js
│   │       ├── src/
│   │       │   ├── app/          # App Router do Next.js
│   │       │   │   ├── (paginas)/# Páginas da aplicação
│   │       │   │   ├── layout.tsx
│   │       │   │   └── page.tsx
│   │       │   ├── components/   # Componentes React
│   │       │   ├── context/      # Context API
│   │       │   ├── services/    # Serviços de API
│   │       │   ├── types/        # Tipos TypeScript
│   │       │   └── utils/        # Utilitários
│   │       ├── public/           # Arquivos estáticos
│   │       └── package.json
│   │
│   └── packages/
│       └── shared/               # Código compartilhado
│           └── schemas/          # Schemas de validação Zod
│
└── README.md
```

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn**
- **PostgreSQL** (versão 12 ou superior)
- **Git**

## 🔧 Instalação

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd projeto-marketplace
```

2. **Instale as dependências**
```bash
cd monorepo
npm install
```

3. **Configure o banco de dados**

Crie um banco de dados PostgreSQL e anote a string de conexão.

4. **Configure as variáveis de ambiente**

Veja a seção [Configuração](#-configuração) abaixo.

5. **Execute as migrações do Prisma**
```bash
cd apps/backend
npx prisma migrate dev
npx prisma generate
```

## ⚙️ Configuração

### Variáveis de Ambiente - Backend

Crie um arquivo `.env` na pasta `monorepo/apps/backend/`:

```env
# Banco de Dados
DATABASE_URL="postgresql://usuario:senha@localhost:5432/marketplace?schema=public"

# JWT
JWT_SECRET="seu-secret-key-super-seguro-aqui"
JWT_EXPIRES_IN="7d"

# Servidor
PORT=5000
BACKEND_URL="http://localhost:5000"
FRONTEND_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="seu-google-client-id"

# Stripe
STRIPE_SECRET_KEY="sk_test_seu-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="whsec_seu-webhook-secret"
```

### Variáveis de Ambiente - Frontend

Crie um arquivo `.env.local` na pasta `monorepo/apps/frontend/`:

```env
# API
NEXT_PUBLIC_API_URL="http://localhost:5000"

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID="seu-google-client-id"
```

## 🚀 Como Executar

### Desenvolvimento

1. **Inicie o backend**
```bash
cd monorepo/apps/backend
npm run dev
```

O servidor estará rodando em `http://localhost:5000`

2. **Inicie o frontend** (em outro terminal)
```bash
cd monorepo/apps/frontend
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

### Produção

1. **Build do frontend**
```bash
cd monorepo/apps/frontend
npm run build
npm start
```

2. **Backend**
```bash
cd monorepo/apps/backend
npm run build
node dist/server.js
```

## 📚 Documentação da API

A documentação completa da API está disponível via Swagger quando o servidor está rodando:

```
http://localhost:5000/docs
```

### Principais Endpoints

#### Autenticação
- `POST /usuarios/cadastro` - Cadastrar novo usuário
- `POST /usuarios/login` - Login com email/senha
- `POST /usuarios/login/google` - Login via Google OAuth
- `GET /usuarios/:id` - Obter dados do usuário
- `PUT /usuarios/:id` - Atualizar dados do usuário
- `PUT /usuarios/senha` - Alterar senha

#### Produtos
- `GET /produtos` - Listar produtos (com filtros)
- `GET /produtos/:id` - Obter produto específico
- `POST /produtos` - Criar produto (vendedor)
- `PUT /produtos/:id` - Atualizar produto (vendedor)
- `DELETE /produtos/:id` - Excluir produto (vendedor/admin)

#### Carrinho
- `GET /carrinho` - Obter itens do carrinho
- `POST /carrinho` - Adicionar produto ao carrinho
- `PUT /carrinho` - Atualizar quantidade
- `DELETE /carrinho/:idProduto` - Remover produto do carrinho

#### Pedidos
- `GET /pedidos` - Listar pedidos do usuário
- `POST /pedidos` - Criar novo pedido
- `GET /pedidos/:id` - Obter detalhes do pedido
- `PUT /pedidos/:id` - Atualizar status do pedido

#### Pagamentos
- `POST /pagamentos` - Criar pagamento
- `GET /pagamentos/:id` - Obter detalhes do pagamento
- `POST /stripe/webhook` - Webhook do Stripe

#### Endereços
- `GET /enderecos` - Listar endereços
- `POST /enderecos` - Criar endereço
- `PUT /enderecos/:id` - Atualizar endereço
- `DELETE /enderecos/:id` - Excluir endereço

#### Mensagens
- `GET /mensagens/:idUsuario` - Obter conversa
- `POST /mensagens` - Enviar mensagem
- `DELETE /mensagens/:id` - Excluir mensagem

## 🔐 Autenticação

### Login Tradicional

```javascript
POST /usuarios/login
{
  "email": "usuario@example.com",
  "senha": "senha123"
}
```

### Login Google OAuth

1. Configure o Google OAuth no [Google Cloud Console](https://console.cloud.google.com/)
2. Crie credenciais OAuth 2.0 (Web application)
3. Adicione as origens autorizadas:
   - `http://localhost:3000` (desenvolvimento)
   - Seu domínio de produção
4. Configure as variáveis de ambiente com o Client ID

### Uso do Token

Após o login, você receberá um token JWT. Use-o nas requisições:

```javascript
Authorization: Bearer <seu-token-jwt>
```

## 🌐 Deploy

### Backend

1. Configure as variáveis de ambiente no servidor
2. Execute as migrações:
```bash
npx prisma migrate deploy
```
3. Inicie o servidor com PM2 ou similar

### Frontend

1. Configure as variáveis de ambiente
2. Build da aplicação:
```bash
npm run build
```
3. Deploy na Vercel, Netlify ou servidor próprio

### Banco de Dados

Use um serviço gerenciado como:
- **Supabase**
- **Railway**
- **Heroku Postgres**
- **AWS RDS**

## 🔒 Segurança

- ✅ Senhas hasheadas com bcrypt
- ✅ Autenticação JWT
- ✅ Validação de dados com Zod
- ✅ CORS configurado
- ✅ Sanitização de inputs
- ✅ Proteção contra SQL Injection (Prisma)
- ✅ Upload seguro de arquivos
- ✅ Rate limiting (recomendado em produção)

## 🧪 Testes

```bash
# Backend
cd monorepo/apps/backend
npm test

# Frontend
cd monorepo/apps/frontend
npm test
```

## 📝 Scripts Disponíveis

### Backend
- `npm run dev` - Inicia servidor em modo desenvolvimento
- `npx prisma migrate dev` - Cria nova migração
- `npx prisma generate` - Gera cliente Prisma
- `npx prisma studio` - Abre Prisma Studio

### Frontend
- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm start` - Inicia servidor de produção
- `npm run lint` - Executa linter

---


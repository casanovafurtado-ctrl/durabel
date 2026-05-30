# DURABEL — Sua Secretária Inteligente 🤖

Secretária executiva com IA para engenheiros e consultores. Integrada com Google Calendar, Google Tasks e Claude AI.

## ✨ Funcionalidades

- 🎙 **Chat por voz e texto** com IA (Claude Sonnet)
- 🗓 **Google Calendar** — ver, criar e gerenciar eventos
- ✅ **Google Tasks** — criar e concluir tarefas
- 📄 **Geração de documentos** — propostas, e-mails, laudos
- 📱 **PWA** — instala como app no iPhone/Android
- 🔐 **Login seguro** com Google OAuth

---

## 🚀 Deploy em 5 passos

### 1. Fork e Clone

```bash
# Fork este repositório no GitHub, depois:
git clone https://github.com/SEU_USUARIO/durabel.git
cd durabel
npm install
```

### 2. Configurar Google Cloud Console

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie um projeto novo: **"DURABEL"**
3. Ative as APIs:
   - Menu → **APIs e Serviços** → **Biblioteca**
   - Ative **Google Calendar API**
   - Ative **Tasks API**
4. Crie as credenciais OAuth:
   - Menu → **APIs e Serviços** → **Credenciais**
   - **Criar Credenciais** → **ID do cliente OAuth 2.0**
   - Tipo: **Aplicativo da Web**
   - Origens autorizadas: `https://seu-app.vercel.app` e `http://localhost:3000`
   - URIs de redirecionamento: `https://seu-app.vercel.app/api/auth/callback/google` e `http://localhost:3000/api/auth/callback/google`
   - Copie o **Client ID** e **Client Secret**

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local`:

```env
NEXTAUTH_URL=https://seu-app.vercel.app
NEXTAUTH_SECRET=rode_este_comando_e_cole_aqui

GOOGLE_CLIENT_ID=seu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-seu_secret

ANTHROPIC_API_KEY=sk-ant-sua_chave
```

> Para gerar o NEXTAUTH_SECRET: `openssl rand -base64 32`

> Chave Anthropic: [console.anthropic.com](https://console.anthropic.com)

### 4. Testar localmente

```bash
npm run dev
# Abra http://localhost:3000
```

### 5. Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com) → **New Project**
2. Importe o repositório do GitHub
3. Em **Environment Variables**, adicione todas as variáveis do `.env.local`
4. Clique em **Deploy** ✅

---

## 📱 Instalar como app no iPhone

1. Abra o app no **Safari**
2. Toque no ícone de **compartilhar** (quadrado com seta)
3. **"Adicionar à Tela de Início"**
4. Nomeie como **DURABEL** e confirme

O app abrirá em tela cheia, sem barra do navegador!

---

## 🏗 Estrutura do projeto

```
durabel/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/  # OAuth Google
│   │   │   ├── chat/               # AI + ferramentas
│   │   │   ├── calendar/           # Google Calendar
│   │   │   └── tasks/              # Google Tasks
│   │   ├── dashboard/              # Painel principal
│   │   └── page.jsx                # Login
│   ├── components/
│   │   ├── ChatPanel.jsx           # Interface de chat
│   │   ├── CalendarPanel.jsx       # Agenda
│   │   └── TasksPanel.jsx          # Tarefas
│   └── lib/
│       ├── google.js               # Helpers Google API
│       └── prompts.js              # System prompt da IA
├── public/
│   └── manifest.json               # PWA config
└── .env.example                    # Variáveis necessárias
```

---

## 🔒 Segurança

- Nunca comite o arquivo `.env.local`
- O `.gitignore` já protege este arquivo
- Os tokens Google ficam criptografados no JWT do NextAuth

---

## 🛠 Desenvolvido com

- [Next.js 14](https://nextjs.org) — framework
- [NextAuth.js](https://next-auth.js.org) — autenticação
- [Google APIs](https://developers.google.com) — Calendar + Tasks
- [Anthropic Claude](https://anthropic.com) — inteligência artificial
- [Vercel](https://vercel.com) — hospedagem

---

*DURABEL by DURAR Consultoria e Engenharia*

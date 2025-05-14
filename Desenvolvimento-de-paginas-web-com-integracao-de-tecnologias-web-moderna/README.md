# Projeto Multitemático: Desenvolvimento de Página Web com Integração de Tecnologias Web Modernas

## Descrição
Este projeto demonstra a utilização prática de tecnologias web modernas, incluindo autenticação de usuários, AJAX, WebSocket, ChatBot, sistema multitemático e dashboard administrativo. A plataforma oferece uma experiência adaptável baseada no tema selecionado pelo usuário, com diferentes níveis de permissão para usuários e administradores.

## Estrutura do Projeto
```
/projeto-pagina-web
│
├── public/
│   ├── index.html       # Página principal com AJAX
│   ├── chat.html        # Página de chat com WebSocket
│   ├── login.html       # Página de autenticação
│   ├── chatbot.html     # Interface do ChatBot
│   ├── admin.html       # Dashboard administrativo
│   └── estilo.css       # Estilo personalizado
│
├── server/
│   ├── app.js           # Servidor Node.js (Express + Socket.io)
│   └── dados.json       # Armazenamento de dados (usuários, temas, etc.)
│
├── package.json         # Dependências do projeto
└── README.md            # Documentação do projeto
```

## Tecnologias Utilizadas
- **Node.js**: Backend JavaScript
- **Express.js**: Framework para APIs RESTful
- **Socket.io**: Comunicação WebSocket em tempo real
- **Express-session**: Gerenciamento de sessões de usuário
- **Bootstrap 5**: Layout responsivo e moderno
- **HTML5/CSS3/JS**: Estrutura e interatividade
- **JSON**: Armazenamento de dados

## Como Executar o Projeto
1. Instale as dependências:
   ```bash
   npm install
   ```
2. Inicie o servidor:
   ```bash
   npm start
   ```
3. Acesse no navegador:
   - [http://localhost:3000/](http://localhost:3000/) — Página principal
   - [http://localhost:3000/login.html](http://localhost:3000/login.html) — Autenticação
   - [http://localhost:3000/chat.html](http://localhost:3000/chat.html) — Chat em tempo real
   - [http://localhost:3000/chatbot.html](http://localhost:3000/chatbot.html) — ChatBot
   - [http://localhost:3000/admin.html](http://localhost:3000/admin.html) — Dashboard Admin (requer login como admin)

## Funcionalidades

### 1. Sistema de Autenticação
- Registro de novos usuários
- Login com sessão persistente
- Diferentes níveis de permissão (usuário, admin1, admin2)
- Proteção de rotas para usuários não autenticados

### 2. Chat em Tempo Real (WebSocket)
- Comunicação instantânea entre usuários
- Identificação de usuários logados
- Distinção visual entre mensagens de usuários e administradores
- Lista de usuários online em tempo real

### 3. ChatBot Interativo
- Interface de conversação intuitiva
- Limite de 5 perguntas por usuário
- Respostas adaptadas ao tema selecionado
- Feedback visual do número de perguntas restantes

### 4. Sistema Multitemático
- Seleção de temas (Tecnologia, Educação, Saúde)
- Adaptação visual baseada no tema selecionado
- Conteúdo contextual do ChatBot por tema
- Persistência do tema escolhido pelo usuário

### 5. Dashboard Administrativo
- Estatísticas de uso do sistema
- Monitoramento de atividades dos usuários
- Dois níveis de acesso administrativo:
  - Admin1 ("Eu"): Acesso completo
  - Admin2 ("Docente"): Apenas monitoramento

### 6. AJAX – Comunicação Assíncrona
- Formulário de contato envia dados ao servidor sem recarregar a página
- Feedback visual com modal Bootstrap

## Dados de Acesso
- **Administrador Principal**:
  - Email: admin@exemplo.com
  - Senha: admin123
- **Docente**:
  - Email: docente@exemplo.com
  - Senha: docente123
- **Usuário Teste**:
  - Email: usuario@exemplo.com
  - Senha: usuario123

## Comentários e Organização do Código
- Código comentado para facilitar o entendimento
- Estrutura de pastas separa frontend (public) e backend (server)
- Dados armazenados em JSON para facilitar demonstração

## Licença
Este projeto foi desenvolvido para fins acadêmicos.

// Importa módulos necessários
const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const session = require('express-session');
const app = express();

// Middleware para parsear JSON nas requisições
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração da sessão
const sessionMiddleware = session({
  secret: 'projetoMultitematico2023',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 3600000 } // 1 hora
});

app.use(sessionMiddleware);

// Caminho para o arquivo de dados
const dadosFilePath = path.join(__dirname, 'dados.json');

// Função para ler dados
function lerDados() {
  try {
    const dadosRaw = fs.readFileSync(dadosFilePath);
    return JSON.parse(dadosRaw);
  } catch (error) {
    console.error('Erro ao ler dados:', error);
    return null;
  }
}

// Função para salvar dados
function salvarDados(dados) {
  try {
    fs.writeFileSync(dadosFilePath, JSON.stringify(dados, null, 2));
    return true;
  } catch (error) {
    console.error('Erro ao salvar dados:', error);
    return false;
  }
}

// Middleware para verificar autenticação
function verificarAutenticacao(req, res, next) {
  if (req.session && req.session.usuario) {
    return next();
  }
  res.status(401).json({ erro: 'Não autorizado. Faça login para continuar.' });
}

// Middleware para verificar permissões de admin
function verificarAdmin(req, res, next) {
  if (req.session && (req.session.perfil === 'admin1' || req.session.perfil === 'admin2')) {
    return next();
  }
  res.status(403).json({ erro: 'Acesso negado. Permissões insuficientes.' });
}

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, '../public')));

// Rotas para autenticação
app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;
  const dados = lerDados();
  
  if (!dados) {
    return res.status(500).json({ erro: 'Erro ao acessar banco de dados.' });
  }

  const usuario = dados.usuarios.find(u => u.email === email && u.senha === senha);
  
  if (!usuario) {
    return res.status(401).json({ erro: 'Credenciais inválidas.' });
  }

  // Atualiza histórico de login
  const dataLogin = new Date().toISOString();
  const ip = req.ip || '0.0.0.0';
  
  usuario.ultimoLogin = dataLogin;
  usuario.historicoLogin.push({ data: dataLogin, ip });
  
  // Incrementa estatísticas
  dados.estatisticas.acessosTotais += 1;
  dados.estatisticas.usuariosAtivos += 1;
  
  salvarDados(dados);
  
  // Configura sessão
  req.session.usuario = usuario.id;
  req.session.nome = usuario.nome;
  req.session.perfil = usuario.perfil;
  req.session.temaSelecionado = usuario.temaSelecionado;
  
  // Remove senha antes de enviar ao cliente
  const usuarioResponse = { ...usuario };
  delete usuarioResponse.senha;
  
  res.json({
    mensagem: 'Login realizado com sucesso',
    usuario: usuarioResponse
  });
});

app.post('/api/registro', (req, res) => {
  const { nome, email, senha } = req.body;
  const dados = lerDados();
  
  if (!dados) {
    return res.status(500).json({ erro: 'Erro ao acessar banco de dados.' });
  }
  
  // Verifica se email já existe
  if (dados.usuarios.some(u => u.email === email)) {
    return res.status(400).json({ erro: 'Email já cadastrado.' });
  }
  
  // Cria novo usuário
  const novoId = Math.max(0, ...dados.usuarios.map(u => u.id)) + 1;
  const dataAtual = new Date().toISOString();
  const ip = req.ip || '0.0.0.0';
  
  const novoUsuario = {
    id: novoId,
    nome,
    email,
    senha,
    perfil: 'usuario',
    dataCriacao: dataAtual,
    ultimoLogin: dataAtual,
    temaSelecionado: 'padrao',
    perguntasChatBot: 0,
    historicoLogin: [{ data: dataAtual, ip }]
  };
  
  dados.usuarios.push(novoUsuario);
  dados.estatisticas.acessosTotais += 1;
  dados.estatisticas.usuariosAtivos += 1;
  
  salvarDados(dados);
  
  // Configura sessão
  req.session.usuario = novoUsuario.id;
  req.session.nome = novoUsuario.nome;
  req.session.perfil = novoUsuario.perfil;
  req.session.temaSelecionado = novoUsuario.temaSelecionado;
  
  // Remove senha antes de enviar ao cliente
  const usuarioResponse = { ...novoUsuario };
  delete usuarioResponse.senha;
  
  res.status(201).json({
    mensagem: 'Usuário registrado com sucesso',
    usuario: usuarioResponse
  });
});

app.post('/api/logout', (req, res) => {
  if (req.session) {
    const dados = lerDados();
    
    if (dados && req.session.usuario) {
      dados.estatisticas.usuariosAtivos = Math.max(0, dados.estatisticas.usuariosAtivos - 1);
      salvarDados(dados);
    }
    
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ erro: 'Erro ao fazer logout' });
      }
      res.json({ mensagem: 'Logout realizado com sucesso' });
    });
  } else {
    res.json({ mensagem: 'Logout realizado com sucesso' });
  }
});

// Rota para obter temas disponíveis
app.get('/api/temas', (req, res) => {
  const dados = lerDados();
  
  if (!dados) {
    return res.status(500).json({ erro: 'Erro ao acessar banco de dados.' });
  }
  
  res.json(dados.temas);
});

// Rota para alterar tema do usuário
app.post('/api/tema', verificarAutenticacao, (req, res) => {
  const { tema } = req.body;
  const dados = lerDados();
  
  if (!dados) {
    return res.status(500).json({ erro: 'Erro ao acessar banco de dados.' });
  }
  
  // Verifica se o tema existe
  if (!dados.temas.some(t => t.id === tema)) {
    return res.status(400).json({ erro: 'Tema inválido.' });
  }
  
  // Atualiza tema do usuário
  const usuario = dados.usuarios.find(u => u.id === req.session.usuario);
  usuario.temaSelecionado = tema;
  req.session.temaSelecionado = tema;
  
  salvarDados(dados);
  
  res.json({
    mensagem: 'Tema alterado com sucesso',
    tema
  });
});

// Rota para o ChatBot
app.post('/api/chatbot', verificarAutenticacao, (req, res) => {
  const { pergunta } = req.body;
  const dados = lerDados();
  
  if (!dados) {
    return res.status(500).json({ erro: 'Erro ao acessar banco de dados.' });
  }
  
  // Encontra usuário
  const usuario = dados.usuarios.find(u => u.id === req.session.usuario);
  const tema = usuario.temaSelecionado;
  
  // Verifica limite de perguntas
  if (usuario.perguntasChatBot >= 5) {
    return res.json({
      resposta: dados.chatbot.respostas[tema]?.limiteAtingido || dados.chatbot.respostas.padrao.limiteAtingido,
      limiteAtingido: true
    });
  }
  
  // Incrementa contador de perguntas
  usuario.perguntasChatBot += 1;
  dados.estatisticas.perguntasChatbot += 1;
  salvarDados(dados);
  
  // Procura resposta para a pergunta
  const perguntaNormalizada = pergunta.toLowerCase().trim();
  let resposta;
  
  // Verifica respostas específicas do tema
  if (dados.chatbot.respostas[tema]?.perguntas?.[perguntaNormalizada]) {
    resposta = dados.chatbot.respostas[tema].perguntas[perguntaNormalizada];
  } 
  // Se não encontrar, procura na lista padrão
  else if (dados.chatbot.respostas.padrao?.perguntas?.[perguntaNormalizada]) {
    resposta = dados.chatbot.respostas.padrao.perguntas[perguntaNormalizada];
  } 
  // Se ainda não encontrar, retorna mensagem de sem resposta
  else {
    resposta = dados.chatbot.respostas[tema]?.semResposta || dados.chatbot.respostas.padrao.semResposta;
  }
  
  res.json({
    resposta,
    perguntasRestantes: 5 - usuario.perguntasChatBot
  });
});

// Rota protegida para dashboard admin
app.get('/api/admin/estatisticas', verificarAdmin, (req, res) => {
  const dados = lerDados();
  
  if (!dados) {
    return res.status(500).json({ erro: 'Erro ao acessar banco de dados.' });
  }
  
  res.json(dados.estatisticas);
});

// Rota para listar usuários (apenas para admins)
app.get('/api/admin/usuarios', verificarAdmin, (req, res) => {
  const dados = lerDados();
  
  if (!dados) {
    return res.status(500).json({ erro: 'Erro ao acessar banco de dados.' });
  }
  
  // Remove senhas antes de enviar
  const usuariosSeguro = dados.usuarios.map(u => {
    const usuario = { ...u };
    delete usuario.senha;
    return usuario;
  });
  
  res.json(usuariosSeguro);
});

// Rota para verificar login
app.get('/api/verificar-login', (req, res) => {
  if (req.session && req.session.usuario) {
    const dados = lerDados();
    
    if (!dados) {
      return res.status(500).json({ erro: 'Erro ao acessar banco de dados.' });
    }
    
    // Busca dados atualizados do usuário
    const usuario = dados.usuarios.find(u => u.id === req.session.usuario);
    
    if (!usuario) {
      req.session.destroy();
      return res.status(401).json({ erro: 'Sessão inválida.' });
    }
    
    // Remove senha antes de enviar
    const usuarioResponse = { ...usuario };
    delete usuarioResponse.senha;
    
    res.json({
      logado: true,
      usuario: usuarioResponse,
      temaSelecionado: req.session.temaSelecionado
    });
  } else {
    res.status(401).json({ logado: false, erro: 'Usuário não autenticado.' });
  }
});

// Rota para receber dados do formulário AJAX
app.post('/api/contato', (req, res) => {
  const { nome, email, mensagem } = req.body;
  // Aqui poderia salvar em banco de dados ou enviar email
  // Para demonstração, apenas retorna mensagem de sucesso
  res.json({ mensagem: `Obrigado pelo contato, ${nome}! Sua mensagem foi recebida.` });
});

// Cria servidor HTTP e integra com Socket.io
const server = http.createServer(app);
const io = new Server(server);

// Configuração para Socket.io acessar a sessão do Express
// Método wrapper para compartilhar sessão
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
io.use(wrap(sessionMiddleware));

// Mapa para acompanhar conexões de usuário
const usuariosConectados = new Map();

// Middleware Socket.io para autenticação
io.use((socket, next) => {
  if (socket.request.session && socket.request.session.usuario) {
    next();
  } else {
    next(new Error('Não autorizado'));
  }
});

// Lida com conexões WebSocket para o chat
io.on('connection', (socket) => {
  // Obtém dados do usuário da sessão
  const session = socket.request.session;
  const userId = session.usuario;
  const userName = session.nome;
  const userTheme = session.temaSelecionado;
  const userProfile = session.perfil;
  
  // Registra conexão
  usuariosConectados.set(socket.id, {
    id: userId,
    nome: userName,
    tema: userTheme,
    perfil: userProfile
  });
  
  // Emite lista de usuários para todos
  io.emit('usuariosOnline', Array.from(usuariosConectados.values()));
  
  // Recebe mensagem do cliente e retransmite para todos com dados do remetente
  socket.on('mensagemChat', (data) => {
    const usuario = usuariosConectados.get(socket.id);
    
    // Incrementa estatísticas
    const dados = lerDados();
    if (dados) {
      dados.estatisticas.mensagensChat += 1;
      salvarDados(dados);
    }
    
    // Emite mensagem para todos com dados do usuário
    io.emit('mensagemChat', {
      userId: usuario.id,
      nome: usuario.nome,
      perfil: usuario.perfil,
      mensagem: data.mensagem,
      timestamp: new Date().toISOString()
    });
  });
  
  // Quando usuário desconecta
  socket.on('disconnect', () => {
    // Remove do mapa de conexões
    usuariosConectados.delete(socket.id);
    
    // Atualiza lista para todos
    io.emit('usuariosOnline', Array.from(usuariosConectados.values()));
  });
});

// Inicia o servidor na porta 3000 ou definida pelo ambiente
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

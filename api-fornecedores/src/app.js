const express = require('express');
const autenticar = require('./middlewares/autenticar');
const fornecedorRoutes = require('./routes/fornecedorRoutes');
const cidadeRoutes = require('./routes/cidadeRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/v1/fornecedores', autenticar, fornecedorRoutes);

app.use('/api/v1/cidades', autenticar, cidadeRoutes);

app.use('/api/v1/usuarios', autenticar, usuarioRoutes);

app.use('/api/v1/auth', authRoutes);

app.use((erro, req, res, next) => {
  if (res.headersSent) {
    return next(erro);
  }

  if ([400, 401, 404].includes(erro.statusCode)) {
    return res.status(erro.statusCode).json({
      erro: erro.message,
    });
  }

  console.error(erro);

  return res.status(500).json({
    erro: 'Não foi possivel concluir a solicitação.'
  });
});

module.exports = app;
require('dotenv').config({ quiet: true });

const jwt = require('jsonwebtoken');

const segredo = process.env.JWT_SECRET;

if (!segredo || !/^[a-f0-9]{64}$/i.test(segredo)) {
  throw new Error(
    'Configure JWT_SECRET no .env com a chave hexadecimal de 64 caracteres.'
  );
}

function gerarToken(usuarioId) {
  return jwt.sign({}, segredo, {
    algorithm: 'HS256',
    subject: String(usuarioId),
    expiresIn: '1h',
    issuer: 'api-fornecedores',
    audience: 'web-fornecedores',
  });
}

function verificarToken(token) {
  const conteudo = jwt.verify(token, segredo, {
    algorithms: ['HS256'],
    issuer: 'api-fornecedores',
    audience: 'web-fornecedores',
  });

  if (
    typeof conteudo !== 'object' ||
    typeof conteudo.sub !== 'string' ||
    !/^[1-9]\d*$/.test(conteudo.sub) ||
    !Number.isSafeInteger(conteudo.exp)
  ) {
    throw new Error('Token inválido.');
  }

  const usuarioId = Number(conteudo.sub);

  if (!Number.isSafeInteger(usuarioId) || usuarioId > 2147483647) {
    throw new Error('Identificador inválido no token.');
  }

  return usuarioId;
}

module.exports = { gerarToken, verificarToken };
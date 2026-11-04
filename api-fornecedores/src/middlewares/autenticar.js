const { verificarToken } = require('../utils/token');
const usuarioRepository = require('../repositories/usuarioRepository');

function naoAutorizado(res) {
  res.set('WWW-Authenticate', 'Bearer');
  return res.status(401).json({ erro: 'Autenticação necessária. Faça login novamente.' });
}

async function autenticar(req, res, next) {
  const authorization = req.get('Authorization');
  const partes = typeof authorization === 'string'
    ? authorization.match(/^Bearer ([^\s]+)$/i)
    : null;

  if (!partes) return naoAutorizado(res);

  let usuarioId;

  try {
    usuarioId = verificarToken(partes[1]);
  } catch {
    return naoAutorizado(res);
  }

  try {
    const usuario = await usuarioRepository.buscarPorId(usuarioId);

    if (!usuario || !usuario.ativo) return naoAutorizado(res);

    req.usuario = usuario;
    return next();
  } catch (erro) {
    // Falhas de banco seguem para o tratamento de erro interno.
    return next(erro);
  }
}

module.exports = autenticar;

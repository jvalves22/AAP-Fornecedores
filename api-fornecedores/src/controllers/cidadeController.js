const cidadeService = require('../services/cidadeService');

async function listar(req, res, next) {
  try {
    const cidades = await cidadeService.listar(
      req.query.uf,
      req.query.busca,
      req.query.codigoIbge
    );

    return res.status(200).json(cidades);
  } catch (erro) {
    next(erro);
  }
}

module.exports = { listar };
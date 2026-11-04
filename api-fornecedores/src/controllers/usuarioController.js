const usuarioService = require('../services/usuarioService');

async function criar(req, res, next) {
  try {
    const usuario = await usuarioService.criar(req.body);

    return res.status(201).json(usuario);
  } catch (erro) {
    next(erro);
  }
}

async function alterarSenha(req, res, next) {
  try {
    const resultado = await usuarioService.alterarSenha(req.usuario.id, req.body);
    return res.status(200).json(resultado);
  } catch (erro) {
    next(erro);
  }
}

module.exports = { criar, alterarSenha };
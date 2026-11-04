const fornecedorService = require('../services/fornecedorService');

async function listar(req, res, next) {
    try{
        const fornecedores = await fornecedorService.listar(
            req.query.pagina,
            req.query.limite,
            req.query.busca,
            req.query.ativo
        );

        return res.status(200).json(fornecedores);
    } catch(erro) {
        next(erro);
    }
}

async function criar(req, res, next) {
    try {
        const fornecedor = await fornecedorService.criar(req.body);

        return res.status(201).json(fornecedor);
    } catch (erro) {
        next(erro);
    }
}

async function buscarPorId(req, res, next) {
    try {
        const fornecedor = await fornecedorService.buscarPorId(
            req.params.id
        );

        return res.status(200).json(fornecedor);
    } catch (erro) {
        next(erro);
    }
}

async function atualizar(req, res, next) {
    try {
        const fornecedor = await fornecedorService.atualizar(
            req.params.id,
            req.body
        );

        return res.status(200).json(fornecedor);
    } catch (erro) {
        next(erro);
    }
}

async function alterarAtivo(req, res, next) {
    try {
        const fornecedor = await fornecedorService.alterarAtivo(
            req.params.id,
            req.body
        );

        return res.status(200).json(fornecedor);
    } catch (erro) {
        next(erro);
    }
}

async function excluir(req, res, next) {
  try {
    const resultado = await fornecedorService.excluir(req.params.id, req.body);
    return res.status(200).json(resultado);
  } catch (erro) {
    next(erro);
  }
}

module.exports = {
    excluir,
    listar,
    criar,
    buscarPorId,
    atualizar,
    alterarAtivo,
}

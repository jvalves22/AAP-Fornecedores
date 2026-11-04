const prisma = require('../config/database')

async function listar(pagina = 1, limite = 20, busca = '', ativo) {
  return prisma.fornecedor.findMany({
    where: {
      nomeRazaoSocial: {
        contains: busca,
      },
      ...(ativo !== undefined ? { ativo } : {}),
    },
    skip: (pagina - 1) * limite,
    take: limite,
    orderBy: [
      { nomeRazaoSocial: 'asc' },
      { id: 'asc' },
    ],
    include: {
      cidade: true,
    },
  });
}

async function criar(dados) {
    return prisma.fornecedor.create({
        data: dados,
        include: {
            cidade: true,
        },
    });
}

async function contar(busca = '', ativo) {
  return prisma.fornecedor.count({
    where: {
      nomeRazaoSocial: {
        contains: busca,
      },
      ...(ativo !== undefined ? { ativo } : {}),
    },
  });
}

async function buscaPorId(id) {
  return prisma.fornecedor.findUnique({
    where: {
      id,
    },
    include: {
      cidade: true,
    },
  });
}

async function atualizar(id, dados) {
  return prisma.fornecedor.update({
    where: {
      id,
    },

    data: dados,
    include: {
      cidade: true,
    },
  });
}

async function alterarAtivo(id, ativo) {
  return prisma.fornecedor.update({
    where: {
      id,
    },
    data: {
      ativo,
    },
  });
}
async function excluir(id) {
  return prisma.fornecedor.delete({ where: { id }, select: { id: true } });
}

module.exports ={
    excluir,
    listar,
    criar,
    contar,
    buscaPorId,
    atualizar,
    alterarAtivo,
}; 
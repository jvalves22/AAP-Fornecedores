const prisma = require('../config/database');

async function listar(uf, busca = '', codigoIbge) {
  return prisma.cidade.findMany({
    where: {
      ...(codigoIbge !== undefined ? { codigoIbge } : {}),
      ...(uf !== undefined ? { uf } : {}),
      nome: {
        contains: busca,
      },
    },
    take: 50,
    orderBy: [
      { uf: 'asc' },
      { nome: 'asc' },
      { id: 'asc' },
    ],
  });
}

async function buscarPorId(id) {
    return prisma.cidade.findUnique({
        where: { id },
    });
}

module.exports = {
    listar,
    buscarPorId,
}
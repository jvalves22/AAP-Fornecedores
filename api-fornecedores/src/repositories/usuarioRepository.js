const prisma = require('../config/database');

async function buscarPorLogin(login) {
  return prisma.usuario.findUnique({
    where: {
      login,
    },
  });
}

async function criar({ nome, login, senhaHash }) {
  return prisma.usuario.create({
    data: {
      nome,
      login,
      senhaHash,
    },
    select: {
      id: true,
      nome: true,
      login: true,
      ativo: true,
      criadoEm: true,
    },
  });
}

async function buscarPorId(id) {
  return prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      login: true,
      ativo: true,
    },
  });
}

async function buscarCredenciaisPorId(id) {
  return prisma.usuario.findUnique({
    where: { id },
    select: { id: true, senhaHash: true, ativo: true },
  });
}

async function alterarSenha(id, hashAtual, senhaHash) {
  return prisma.usuario.updateMany({
    where: { id, ativo: true, senhaHash: hashAtual },
    data: { senhaHash },
  });
}

module.exports = {
  buscarCredenciaisPorId,
  alterarSenha,
  buscarPorId,
  buscarPorLogin,
  criar,
};
const prisma = require('../config/database');

async function testarConexao() {
  try {
    const quantidade = await prisma.fornecedor.count();

    console.log('Conexão com o MariaDB funcionando!');
    console.log('Fornecedores cadastrados:', quantidade);
  } catch (erro) {
    console.error('Erro ao conectar ao banco:', erro.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

testarConexao();
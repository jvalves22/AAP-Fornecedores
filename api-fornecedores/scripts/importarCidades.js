const prisma = require('../src/config/database');
const { lerCidades } = require('./lerCidades');

async function importarCidades() {
  try {
    const cidades = lerCidades();
    const tamanhoLote = 50;

    console.log(`Iniciando importação de ${cidades.length} cidades.`);

    for (let inicio = 0; inicio < cidades.length; inicio += tamanhoLote) {
      const lote = cidades.slice(inicio, inicio + tamanhoLote);

      const operacoes = lote.map(cidade =>
        prisma.cidade.upsert({
          where: {
            codigoIbge: cidade.codigoIbge,
          },
          create: cidade,
          update: {
            nome: cidade.nome,
            uf: cidade.uf,
          },
        })
      );

      await prisma.$transaction(operacoes);

      console.log(
        `Processadas: ${inicio + lote.length}/${cidades.length}`
      );
    }

    console.log('Importação concluída.');
  } catch (erro) {
    console.error('Falha na importação:', erro.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

importarCidades();
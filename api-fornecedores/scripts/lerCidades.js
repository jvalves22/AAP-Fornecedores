const fs = require('node:fs');
const path = require('node:path');

function lerCidades() {
  const arquivo = path.resolve(
    __dirname,
    '../prisma/dados/tsmun.sql'
  );

  const conteudo = fs.readFileSync(arquivo, 'utf8');

  const linhas = conteudo
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map(linha => linha.trim());

  const cidades = [];
  const codigos = new Set();

  const formato =
    /^INSERT INTO `tsmun` VALUES \((\d+), '(\d{7})', '(\d{2})', '(.*)', '([A-Z]{2})'\);$/;

  for (const [indice, linha] of linhas.entries()) {
    if (!linha) continue;

    const registro = linha.match(formato);

    if (!registro) {
      throw new Error(`Formato inesperado na linha ${indice + 1}.`);
    }

    const codigoIbge = registro[2];
    const codigoUf = registro[3];
    const uf = registro[5];

    const nome = registro[4]
      .replace(/\\'\\'/g, "'")
      .replace(/\\'/g, "'")
      .replace(/''/g, "'")
      .trim();

    if (!nome || nome.length > 100) {
      throw new Error(`Nome inválido na linha ${indice + 1}.`);
    }

    if (!codigoIbge.startsWith(codigoUf)) {
      throw new Error(`Código de UF inconsistente na linha ${indice + 1}.`);
    }

    if (codigos.has(codigoIbge)) {
      throw new Error(`Código IBGE duplicado: ${codigoIbge}.`);
    }

    codigos.add(codigoIbge);
    cidades.push({ codigoIbge, nome, uf });
  }

  if (cidades.length === 0) {
    throw new Error('Nenhuma cidade encontrada no arquivo.');
  }

  return cidades;
}

if (require.main === module) {
  try {
    const cidades = lerCidades();

    console.log('Cidades encontradas:', cidades.length);
    console.table(cidades.slice(0, 5));
  } catch (erro) {
    console.error(erro.message);
    process.exitCode = 1;
  }
}

module.exports = { lerCidades };
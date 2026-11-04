const cidadeRepository = require('../repositories/cidadeRepository');

async function listar(uf, busca = '', codigoIbge) {
  const ufsValidas = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF',
    'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
    'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS',
    'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
  ];

  let filtroUf;

  if (uf !== undefined) {
    if (typeof uf !== 'string') {
      const erro = new Error('Informe uma UF válida.');
      erro.statusCode = 400;
      throw erro;
    }

    filtroUf = uf.trim().toUpperCase();

    if (!ufsValidas.includes(filtroUf)) {
      const erro = new Error('Informe uma UF válida.');
      erro.statusCode = 400;
      throw erro;
    }
  }

  if (typeof busca !== 'string' || busca.trim().length > 100) {
    const erro = new Error('A busca deve ser um texto de até 100 caracteres.');
    erro.statusCode = 400;
    throw erro;
  }

  if (codigoIbge !== undefined && (typeof codigoIbge !== 'string' || !/^\d{7}$/.test(codigoIbge))) {
    const erro = new Error('Informe um código IBGE com 7 dígitos.');
    erro.statusCode = 400;
    throw erro;
  }

  return cidadeRepository.listar(filtroUf, busca.trim(), codigoIbge);
}

module.exports = { listar };
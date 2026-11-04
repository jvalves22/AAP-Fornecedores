const fornecedorRepository = require('../repositories/fornecedorRepository');
const cidadeRepository = require('../repositories/cidadeRepository');
const { validarFornecedor } = require('../validators/fornecedorValidator');

async function listar(pagina = '1', limite = '20', busca = '', ativo) {
  const parametros = [pagina, limite];

  if (
    parametros.some(
      valor => typeof valor !== 'string' || !/^[1-9]\d*$/.test(valor)
    )
  ) {
    const erro = new Error('Número de páginas inválido.');
    erro.statusCode = 400;
    throw erro;
  }

  const numeroPagina = Number(pagina);
  const numeroLimite = Number(limite);
  const deslocamento = (numeroPagina - 1) * numeroLimite;

  if (
    !Number.isSafeInteger(numeroPagina) ||
    !Number.isSafeInteger(numeroLimite) ||
    numeroLimite > 100 ||
    !Number.isSafeInteger(deslocamento) ||
    deslocamento > 2147483647
  ) {
    const erro = new Error(
      'Paginação fora do intervalo permitido. Use limite entre 1 e 100 e uma página menor.'
    );
    erro.statusCode = 400;
    throw erro;
  }

if (typeof busca !== 'string' || busca.trim().length > 150) {
  const erro = new Error('A busca deve ser um texto de até 150 caracteres.');
  erro.statusCode = 400;
  throw erro;
}

const termo = busca.trim();

let filtroAtivo;

if (ativo !== undefined) {
  if (ativo !== 'true' && ativo !== 'false') {
    const erro = new Error('O filtro ativo deve ser true ou false.');
    erro.statusCode = 400;
    throw erro;
  }

  filtroAtivo = ativo === 'true';
}

const [fornecedores, total] = await Promise.all([
  fornecedorRepository.listar(
    numeroPagina,
    numeroLimite,
    termo,
    filtroAtivo
  ),
  fornecedorRepository.contar(termo, filtroAtivo),
]);

return {
  dados: fornecedores,
  paginacao: {
    pagina: numeroPagina,
    limite: numeroLimite,
    total,
    totalPaginas: Math.ceil(total / numeroLimite),
  },
};
}

async function criar(dados) {
    validarFornecedor(dados);

    const cidade = await cidadeRepository.buscarPorId(dados.cidadeId);

    if (!cidade) {
        const erro = new Error('A cidade informada não está cadastrada');
        erro.statusCode = 400;
        throw erro;
    }

    const fornecedor = prepararDados(dados);

  try {

    return await fornecedorRepository.criar(fornecedor);
  } catch (erro) {
    if (erro.code === 'P2002') {
        const conflito = new Error(
            'Já existe um fornecedor com o CPF ou CNPJ informado.'
        );

        conflito.statusCode = 400;
        throw conflito;
    }

    throw erro;
    }
}

async function buscarPorId(id) {
  if (typeof id !== 'string' || !/^[1-9]\d*$/.test(id)) {
    const erro = new Error('Informe um ID inválido.')
    erro.statusCode = 400;
    throw erro;
  }

  const numeroId = Number(id);

  if (!Number.isSafeInteger(numeroId) || numeroId > 2147483647) {
    const erro = new Error('O ID está fora do intervalo permitido')
    erro.statusCode = 400;
    throw erro;
  }

  const fornecedor = await fornecedorRepository.buscaPorId(numeroId);

  if (!fornecedor) {
    const erro = new Error('Fornecedor não encontrado.');
    erro.statusCode = 404;
    throw erro;
  }

  return fornecedor;
}

function prepararDados(dados, ativoPadrao = true) {
  const camposTexto = [
    'nomeRazaoSocial',
    'nomeFantasia',
    'cpf',
    'cnpj',
    'inscricaoEstadual',
    'rg',
    'logradouro',
    'numero',
    'complemento',
    'bairro',
    'cep',
    'nomeContato',
    'email',
    'telefone',
    'celular',
    'site',
    'setor',
    'observacoes',
  ];

  const fornecedor = {
    tipoPessoa: dados.tipoPessoa,
    cidadeId: dados.cidadeId,
    ativo: dados.ativo ?? ativoPadrao,
  };

  for (const campo of camposTexto) {
    const valor = dados[campo];

    fornecedor[campo] =
      typeof valor === 'string' ? valor.trim() || null : null;
  }

  return fornecedor;
}

async function atualizar(id, dados) {
  const fornecedorAtual = await buscarPorId(id);

  validarFornecedor(dados);

  const cidade = await cidadeRepository.buscarPorId(dados.cidadeId);

  if (!cidade) {
    const erro = new Error('A cidade informada não está cadastrada');
    erro.statusCode = 400;
    throw erro;
  }

  const fornecedor = prepararDados(dados, fornecedorAtual.ativo);

  try {
    return await fornecedorRepository.atualizar(
      fornecedorAtual.id,
      fornecedor
    );
  } catch (erro) {
    if (erro.code === 'P2002') {
      const conflito = new Error('Já existe um fornecedor com o CPF ou CNPJ informado');

      conflito.statusCode = 400;
      throw conflito;
    }

    if (erro.code === 'P2025') {
      const naoEncontrado = new Error('Fornecedor não encontrado');

      naoEncontrado.statusCode = 404;
      throw naoEncontrado;
    }

    throw erro;
  }

}

async function alterarAtivo(id, dados) {
  const fornecedor = await buscarPorId(id);

  if (
    !dados ||
    typeof dados !== 'object' ||
    Array.isArray(dados) ||
    typeof dados.ativo !== 'boolean'
  ) {
    const erro = new Error('Informe se o fornecedor está ativo ou inativo.');
    erro.statusCode = 400;
    throw erro;
  }

  try {
    return await fornecedorRepository.alterarAtivo(
      fornecedor.id,
      dados.ativo
    );
  } catch (erro) {
    if (erro.code === 'P2025') {
      const naoEncontrado = new Error('Fornecedor não encontrado');

      naoEncontrado.statusCode = 404;
      throw naoEncontrado
    }

    throw erro;
  }
}
async function excluir(id, dados) {
  if (!dados || dados.confirmacao !== 'EXCLUIR') {
    const erro = new Error('Confirme a exclusão digitando EXCLUIR.');
    erro.statusCode = 400;
    throw erro;
  }

  const fornecedor = await buscarPorId(id);
  try {
    await fornecedorRepository.excluir(fornecedor.id);
    return { mensagem: 'Fornecedor excluído com sucesso.' };
  } catch (erro) {
    if (erro.code === 'P2025') {
      throw Object.assign(new Error('Fornecedor não encontrado.'), { statusCode: 404 });
    }
    if (erro.code === 'P2003') {
      throw Object.assign(new Error('Este fornecedor possui registros vinculados e não pode ser excluído.'), { statusCode: 400 });
    }
    throw erro;
  }
}

module.exports = {
  excluir,
  listar,
  criar,
  buscarPorId,
  atualizar,
  alterarAtivo,
};

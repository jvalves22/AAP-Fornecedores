function validarFornecedor(dados) {
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
    throw criarErro('Envie os dados do fornecedor em um objeto JSON.');
  }

  if (!['FISICA', 'JURIDICA'].includes(dados.tipoPessoa)) {
    throw criarErro('O tipo de pessoa deve ser FISICA ou JURIDICA.');
  }

    if (textoPreenchido(dados.cnpj) && !cnpjValido(dados.cnpj)) {
    throw criarErro(
      'Informe um CNPJ válido com 14 caracteres, sem pontuação e com letras maiúsculas.'
    );
  }

  if (!textoPreenchido(dados.nomeRazaoSocial)) {
    throw criarErro('Informe o nome ou a razão social.');
  }

  if (dados.tipoPessoa === 'FISICA' && !textoPreenchido(dados.cpf)) {
    throw criarErro('Informe o CPF da pessoa física.');
  }

  if (textoPreenchido(dados.cpf) && !cpfValido(dados.cpf)) {
    throw criarErro('Informe um CPF válido com 11 dígitos, sem pontuação.');
  }

  if (dados.tipoPessoa === 'JURIDICA' && !textoPreenchido(dados.cnpj)) {
    throw criarErro('Informe o CNPJ da pessoa jurídica.');
  }

  const temContato = [
    dados.email,
    dados.telefone,
    dados.celular,
  ].some(textoPreenchido);

  if (!temContato) {
    throw criarErro('Informe pelo menos um e-mail, telefone ou celular.');
  }

  const camposEndereco = {
    logradouro: 'logradouro',
    numero: 'numero do endereço', 
    bairro: 'bairro',
  };

  for (const [campo, descricao] of Object.entries(camposEndereco)) {
    if (!textoPreenchido(dados[campo])) {
        throw criarErro(`Informe o ${descricao}`);
    }
  }

  if (
    typeof dados.cep !== 'string' || !/^\d{8}$/.test(dados.cep)
  ) {
    throw criarErro('Informe o CEP com 8 dígitos, sem pontuação.')
  }

  if (
    !Number.isInteger(dados.cidadeId) ||
    dados.cidadeId <= 0 ||
    dados.cidadeId > 2147483647
  ) {
    throw criarErro('Informe um identificador de cidade válido.');
  }

    const limitesTexto = {
    nomeRazaoSocial: 150,
    nomeFantasia: 150,
    cpf: 11,
    cnpj: 14,
    inscricaoEstadual: 20,
    rg: 20,
    logradouro: 150,
    numero: 20,
    complemento: 100,
    bairro: 100,
    nomeContato: 100,
    email: 254,
    telefone: 20,
    celular: 20,
    site: 255,
    setor: 100,
  };

  for (const [campo, limite] of Object.entries(limitesTexto)) {
    const valor = dados[campo];

    if (valor === undefined || valor === null) {
      continue;
    }

    if (typeof valor !== 'string') {
      throw criarErro(`O campo ${campo} deve ser um texto.`);
    }

    if (valor.length > limite) {
      throw criarErro(
        `O campo ${campo} deve ter no máximo ${limite} caracteres.`
      );
    }
  }

  if (
    dados.observacoes !== undefined &&
    dados.observacoes !== null &&
    typeof dados.observacoes !== 'string'
  ) {
    throw criarErro('O campo observacoes deve ser um texto.');
  }

  if (
    dados.ativo !== undefined &&
    typeof dados.ativo !== 'boolean'
  ) {
    throw criarErro('O campo ativo deve ser true ou false.');
  }

    if (textoPreenchido(dados.email)) {
    const email = dados.email.trim();
    const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formatoEmail.test(email)) {
      throw criarErro('Informe um e-mail válido.');
    }
  }

  

}

function cpfValido(cpf) {
  if (typeof cpf !== 'string' || !/^\d{11}$/.test(cpf)) {
    return false;
  }

  // Rejeita sequências como 00000000000 e 11111111111.
  if (/^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  for (let tamanho = 9; tamanho <= 10; tamanho++) {
    let soma = 0;

    for (let i = 0; i < tamanho; i++) {
      soma += Number(cpf[i]) * (tamanho + 1 - i);
    }

    const resto = soma % 11;
    const digito = resto < 2 ? 0 : 11 - resto;

    if (Number(cpf[tamanho]) !== digito) {
      return false;
    }
  }

  return true;
}

function cnpjValido(cnpj) {
  if (
    typeof cnpj !== 'string' ||
    !/^[A-Z0-9]{12}\d{2}$/.test(cnpj)
  ) {
    return false;
  }

  if (/^(\d)\1{13}$/.test(cnpj)) {
    return false;
  }

  function calcularDigito(base) {
    let soma = 0;
    let peso = 2;

    for (let i = base.length - 1; i >= 0; i--) {
      const valor = base.charCodeAt(i) - 48;

      soma += valor * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }

    const resto = soma % 11;

    return resto < 2 ? 0 : 11 - resto;
  }

  const base = cnpj.slice(0, 12);
  const primeiroDigito = calcularDigito(base);
  const segundoDigito = calcularDigito(base + primeiroDigito);

  return cnpj.slice(12) === `${primeiroDigito}${segundoDigito}`;
}

function textoPreenchido(valor) {
  return typeof valor === 'string' && valor.trim().length > 0;
}

function criarErro(mensagem) {
  const erro = new Error(mensagem);
  erro.statusCode = 400;

  return erro;
}

module.exports = { validarFornecedor };
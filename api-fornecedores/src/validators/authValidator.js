function validarLogin(dados) {
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
    throw criarErro('Envie os dados de login em um objeto JSON.');
  }

  if (
    typeof dados.login !== 'string' ||
    !/^[a-zA-Z0-9._-]{3,100}$/.test(dados.login)
  ) {
    throw criarErro('Informe um login válido.');
  }

  if (
    typeof dados.senha !== 'string' ||
    dados.senha.length === 0 ||
    dados.senha.length > 128
  ) {
    throw criarErro('Informe uma senha de até 128 caracteres.');
  }
}

function criarErro(mensagem) {
  const erro = new Error(mensagem);
  erro.statusCode = 400;

  return erro;
}

module.exports = { validarLogin };
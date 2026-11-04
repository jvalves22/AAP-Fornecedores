function validarUsuario(dados) {
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
    throw criarErro('Envie os dados do usuário em um objeto JSON.');
  }

  if (
    typeof dados.nome !== 'string' ||
    !dados.nome.trim() ||
    dados.nome.length > 100
  ) {
    throw criarErro('Informe um nome com até 100 caracteres.');
  }

  if (
    typeof dados.login !== 'string' ||
    !/^[a-zA-Z0-9._-]{3,100}$/.test(dados.login)
  ) {
    throw criarErro(
      'O login deve ter de 3 a 100 caracteres e usar apenas letras, números, ponto, hífen ou sublinhado.'
    );
  }

  if (
    typeof dados.senha !== 'string' ||
    dados.senha.length < 3 ||
    dados.senha.length > 128
  ) {
    throw criarErro('A senha deve ter de 3 a 128 caracteres.');
  }
}

function criarErro(mensagem) {
  const erro = new Error(mensagem);
  erro.statusCode = 400;

  return erro;
}

module.exports = { validarUsuario };
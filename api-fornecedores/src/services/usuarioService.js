const usuarioRepository = require('../repositories/usuarioRepository');
const { validarUsuario } = require('../validators/usuarioValidator');
const { gerarHash, verificarSenha } = require('../utils/senha');

async function criar(dados) {
  validarUsuario(dados);

  const nome = dados.nome.trim();
  const login = dados.login.toLowerCase();

  const usuarioExistente = await usuarioRepository.buscarPorLogin(login);

  if (usuarioExistente) {
    throw criarErroLoginDuplicado();
  }

  const senhaHash = await gerarHash(dados.senha);

  try {
    return await usuarioRepository.criar({
      nome,
      login,
      senhaHash,
    });
  } catch (erro) {
    if (erro.code === 'P2002') {
      throw criarErroLoginDuplicado();
    }

    throw erro;
  }
}

function criarErroLoginDuplicado() {
  const erro = new Error('Este login já está em uso.');
  erro.statusCode = 400;

  return erro;
}

async function alterarSenha(usuarioId, dados) {
  function erroValidacao(mensagem) {
    return Object.assign(new Error(mensagem), { statusCode: 400 });
  }

  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
    throw erroValidacao('Envie os dados da alteração de senha.');
  }
  if (typeof dados.senhaAtual !== 'string' || !dados.senhaAtual.length || dados.senhaAtual.length > 128) {
    throw erroValidacao('Informe a senha atual.');
  }
  if (typeof dados.novaSenha !== 'string' || dados.novaSenha.length < 3 || dados.novaSenha.length > 128) {
    throw erroValidacao('A nova senha deve ter de 3 a 128 caracteres.');
  }
  if (dados.confirmacaoSenha !== dados.novaSenha) {
    throw erroValidacao('A confirmação da nova senha não confere.');
  }

  const usuario = await usuarioRepository.buscarCredenciaisPorId(usuarioId);
  if (!usuario || !usuario.ativo) {
    throw Object.assign(new Error('Faça login novamente.'), { statusCode: 401 });
  }
  if (!await verificarSenha(dados.senhaAtual, usuario.senhaHash)) {
    throw erroValidacao('A senha atual está incorreta.');
  }

  const senhaHash = await gerarHash(dados.novaSenha);
  const resultado = await usuarioRepository.alterarSenha(usuarioId, usuario.senhaHash, senhaHash);
  if (resultado.count !== 1) {
    throw erroValidacao('Não foi possível alterar a senha. Confira a senha atual e tente novamente.');
  }
  return { mensagem: 'Senha alterada com sucesso.' };
}

module.exports = { criar, alterarSenha };
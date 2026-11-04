const usuarioRepository = require('../repositories/usuarioRepository');
const { validarLogin } = require('../validators/authValidator');
const { verificarSenha } = require('../utils/senha');
const { gerarToken } = require('../utils/token');

async function autenticar(dados) {
  validarLogin(dados);

  const login = dados.login.toLowerCase();
  const usuario = await usuarioRepository.buscarPorLogin(login);

  if (!usuario) {
    throw criarErroAutenticacao();
  }

  const senhaCorreta = await verificarSenha(
    dados.senha,
    usuario.senhaHash
  );

  if (!senhaCorreta || !usuario.ativo) {
    throw criarErroAutenticacao();
  }

  const token = gerarToken(usuario.id);

  return {
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      login: usuario.login,
    },
  };
}

function criarErroAutenticacao() {
  const erro = new Error('Login ou senha inválidos.');
  erro.statusCode = 401;

  return erro;
}

module.exports = { autenticar };
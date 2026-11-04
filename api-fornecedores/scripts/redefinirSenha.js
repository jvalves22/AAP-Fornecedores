const readline = require('node:readline/promises');
const { Writable } = require('node:stream');
const { gerarHash } = require('../src/utils/senha');

async function redefinirSenha({ prisma, perguntar }) {
  const login = (await perguntar('Login do usuário: ')).trim().toLowerCase();

  if (!/^[a-z0-9._-]{3,100}$/.test(login)) {
    throw new Error('Informe um login válido.');
  }

  const usuario = await prisma.usuario.findUnique({
    where: { login },
    select: { id: true },
  });

  if (!usuario) throw new Error('Usuário não encontrado.');

  const senha = await perguntar('Nova senha (entrada oculta): ', true);

  if (senha.length < 3 || senha.length > 128) {
    throw new Error('A senha deve ter de 3 a 128 caracteres.');
  }

  const confirmacao = await perguntar('Confirme a nova senha: ', true);

  if (senha !== confirmacao) throw new Error('As senhas não são iguais.');

  const senhaHash = await gerarHash(senha);

  try {
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { senhaHash },
      select: { id: true },
    });
  } catch (erro) {
    if (erro.code === 'P2025') throw new Error('Usuário não encontrado.');
    throw erro;
  }
}

async function executar() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('Execute npm run usuario:senha diretamente em um terminal interativo.');
  }

  let ocultar = false;
  const saida = new Writable({
    write(texto, encoding, callback) {
      if (!ocultar) process.stdout.write(texto, encoding);
      callback();
    },
  });
  saida.columns = process.stdout.columns || 80;

  const terminal = readline.createInterface({
    input: process.stdin,
    output: saida,
    terminal: true,
    historySize: 0,
  });
  const cancelamento = new AbortController();
  terminal.on('SIGINT', () => cancelamento.abort());
  let prisma;

  async function perguntar(mensagem, secreto = false) {
    ocultar = secreto;
    if (secreto) process.stdout.write(mensagem);
    try {
      return await terminal.question(secreto ? '' : mensagem, {
        signal: cancelamento.signal,
      });
    } finally {
      if (secreto) process.stdout.write('\n');
      ocultar = false;
    }
  }

  try {
    prisma = require('../src/config/database');
    await redefinirSenha({ prisma, perguntar });
    console.log('Senha atualizada com sucesso. Faça login com a nova senha.');
  } finally {
    ocultar = false;
    terminal.close();
    if (prisma) await prisma.$disconnect();
  }
}

if (require.main === module) {
  executar().catch(erro => {
    if (erro.name === 'AbortError') console.error('Operação cancelada.');
    else if (erro.code) console.error('Falha ao redefinir a senha. Confira a conexão com o banco.');
    else console.error(erro.message);
    process.exitCode = 1;
  });
}

module.exports = { redefinirSenha };

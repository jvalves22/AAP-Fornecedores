const {
  randomBytes,
  scrypt,
  timingSafeEqual,
} = require('node:crypto');
const { promisify } = require('node:util');

const scryptAsync = promisify(scrypt);

async function gerarHash(senha) {
  const salt = randomBytes(16).toString('hex');

  const chave = await scryptAsync(senha, salt, 64, {
    N: 131072,
    r: 8,
    p: 1,
    maxmem: 256 * 1024 * 1024,
  });

  return `scrypt-v1:${salt}:${chave.toString('hex')}`;
}

async function verificarSenha(senha, hashArmazenado) {
  if (
    typeof senha !== 'string' ||
    senha.length > 128 ||
    typeof hashArmazenado !== 'string'
  ) {
    return false;
  }

  const partes = hashArmazenado.split(':');

  if (partes.length !== 3) {
    return false;
  }

  const [versao, salt, hash] = partes;

  if (
    versao !== 'scrypt-v1' ||
    !/^[a-f0-9]{32}$/.test(salt) ||
    !/^[a-f0-9]{128}$/.test(hash)
  ) {
    return false;
  }

  const chave = await scryptAsync(senha, salt, 64, {
    N: 131072,
    r: 8,
    p: 1,
    maxmem: 256 * 1024 * 1024,
  });

  const chaveArmazenada = Buffer.from(hash, 'hex');

  return timingSafeEqual(chave, chaveArmazenada);
}

module.exports = {
  gerarHash,
  verificarSenha,
};
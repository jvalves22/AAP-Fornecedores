const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const jwt = require('jsonwebtoken');

// Chave exclusiva dos testes. Nenhuma credencial real é utilizada.
process.env.JWT_SECRET = 'a'.repeat(64);

let usuario;
const novosUsuarios=[];
let fornecedorExcluido = false;
let exclusoes = 0;
let consultasUsuario = 0;
const cidade = { id: 3606, codigoIbge: '3509502', nome: 'Campinas', uf: 'SP' };
const fakePrisma = {
  usuario: {
    create: async ({data}) => {
      if(novosUsuarios.some(item=>item.login===data.login))throw Object.assign(new Error('Duplicado'),{code:'P2002'});
      const novo={id:100+novosUsuarios.length,...data,ativo:true,criadoEm:new Date().toISOString()};novosUsuarios.push(novo);
      const {senhaHash,...publico}=novo;return publico;
    },
    updateMany: async ({ where, data }) => {
      if (where.id !== usuario.id || !usuario.ativo || where.senhaHash !== usuario.senhaHash) return {count:0};
      usuario.senhaHash = data.senhaHash;
      return {count:1};
    },
    findUnique: async ({ where }) => {
      consultasUsuario++;
      if (where.id === usuario.id || where.login === usuario.login) return { ...usuario };
      return novosUsuarios.find(item=>item.id===where.id || item.login===where.login) || null;
    },
  },
  cidade: { findMany: async ({where}) => !where.codigoIbge || where.codigoIbge === cidade.codigoIbge ? [cidade] : [] },
  fornecedor: {
    findMany: async () => [], count: async () => 0,
    findUnique: async ({where}) => where.id === 24 || (where.id === 23 && !fornecedorExcluido) ? {id:where.id,nomeRazaoSocial:'Fornecedor de teste'} : null,
    delete: async ({where}) => {
      if(where.id === 24) throw Object.assign(new Error('Vinculo'),{code:'P2003'});
      if(where.id !== 23 || fornecedorExcluido) throw Object.assign(new Error('Ausente'),{code:'P2025'});
      exclusoes++;fornecedorExcluido=true;return {id:23};
    },
  },
};
const databasePath = require.resolve('../src/config/database');
require.cache[databasePath] = {
  id: databasePath, filename: databasePath, loaded: true, exports: fakePrisma,
};

const app = require('../src/app');
const { gerarHash } = require('../src/utils/senha');
const { gerarToken } = require('../src/utils/token');

test('login e acesso às rotas protegidas, sem conexão com MariaDB', async t => {
  usuario = {
    id: 7, nome: 'Usuário de Teste', login: 'usuario.teste', ativo: true,
    senhaHash: await gerarHash('SenhaDeTeste!2026'),
  };
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = 'http://127.0.0.1:' + server.address().port;
  async function request(path, { token, method = 'GET', body, authorization } = {}) {
    const headers = {};
    if (authorization !== undefined) headers.Authorization = authorization;
    else if (token) headers.Authorization = 'Bearer ' + token;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const response = await fetch(base + path, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, body: await response.json(), headers: response.headers };
  }
  const cidades = '/api/v1/cidades?uf=SP&busca=campinas';
  const loginPath = '/api/v1/auth/login';
  const credenciais = { login: 'usuario.teste', senha: 'SenhaDeTeste!2026' };
  const options = {
    algorithm: 'HS256', subject: '7', expiresIn: '1h',
    issuer: 'api-fornecedores', audience: 'web-fornecedores',
  };
  async function rejeitaToken(token) {
    const antes = consultasUsuario;
    assert.equal((await request(cidades, { token })).status, 401);
    assert.equal(consultasUsuario, antes);
  }
  try {
    await t.test('health público', async () => {
      assert.equal((await request('/health')).status, 200);
    });
    await t.test('fornecedores, cidades e cadastro de usuários exigem token', async () => {
      for (const [path, method] of [
        ['/api/v1/fornecedores', 'GET'], ['/api/v1/cidades', 'GET'], ['/api/v1/usuarios', 'POST'],
      ]) {
        const resposta = await request(path, { method });
        assert.equal(resposta.status, 401);
        assert.equal(resposta.headers.get('www-authenticate'), 'Bearer');
      }
    });
    await t.test('cabeçalho malformado', async () => {
      assert.equal((await request(cidades, { authorization: 'Basic exemplo' })).status, 401);
    });
    await t.test('login inválido', async () => {
      assert.equal((await request(loginPath, { method: 'POST', body: {} })).status, 400);
    });
    await t.test('senha incorreta', async () => {
      const resposta = await request(loginPath, {
        method: 'POST', body: { ...credenciais, senha: 'SenhaIncorreta!2026' },
      });
      assert.equal(resposta.status, 401);
      assert.equal(resposta.body.erro, 'Login ou senha inválidos.');
    });
    let token;
    await t.test('login válido retorna token sem senha ou hash', async () => {
      const resposta = await request(loginPath, { method: 'POST', body: credenciais });
      assert.equal(resposta.status, 200);
      assert.deepEqual(resposta.body.usuario, { id: 7, nome: usuario.nome, login: usuario.login });
      assert.equal(JSON.stringify(resposta.body).includes(usuario.senhaHash), false);
      token = resposta.body.token;
      const payload = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256'], issuer: options.issuer, audience: options.audience,
      });
      assert.equal(payload.sub, '7');
      assert.equal(payload.exp - payload.iat, 3600);
    });
    await t.test('token do login permite consultar cidades e fornecedores', async () => {
      const resposta = await request(cidades, { token });
      assert.equal(resposta.status, 200);
      assert.deepEqual(resposta.body, [cidade]);
      assert.equal((await request('/api/v1/fornecedores', { token })).status, 200);
    });
    await t.test('token alterado', async () => {
      const partes = token.split('.');
      partes[2] = (partes[2][0] === 'a' ? 'b' : 'a') + partes[2].slice(1);
      await rejeitaToken(partes.join('.'));
    });
    await t.test('token expirado', async () => {
      await rejeitaToken(jwt.sign({}, process.env.JWT_SECRET, { ...options, expiresIn: -1 }));
    });
    await t.test('algoritmo diferente', async () => {
      await rejeitaToken(jwt.sign({}, process.env.JWT_SECRET, { ...options, algorithm: 'HS384' }));
    });
    await t.test('emissor ou destinatário incorretos', async () => {
      for (const campo of ['issuer', 'audience']) {
        await rejeitaToken(jwt.sign({}, process.env.JWT_SECRET, { ...options, [campo]: 'outra-aplicacao' }));
      }
    });
    await t.test('identificador inválido e token sem expiração', async () => {
      await rejeitaToken(gerarToken('abc'));
      const { expiresIn, ...semExpiracao } = options;
      await rejeitaToken(jwt.sign({}, process.env.JWT_SECRET, semExpiracao));
    });
    await t.test('usuário removido', async () => {
      assert.equal((await request(cidades, { token: gerarToken(99) })).status, 401);
    });
    await t.test('usuário inativado perde acesso com token ainda válido', async () => {
      usuario.ativo = false;
      try {
        assert.equal((await request(cidades, { token })).status, 401);
        assert.equal((await request(loginPath, { method: 'POST', body: credenciais })).status, 401);
      } finally { usuario.ativo = true; }
    });
    await t.test('alterar senha exige autenticação', async () => {
      assert.equal((await request('/api/v1/usuarios/me/senha',{method:'PATCH',body:{}})).status,401);
    });
    await t.test('validação da nova senha e confirmação', async () => {
      const token = gerarToken(usuario.id);
      for (const body of [null,{}, {senhaAtual:credenciais.senha,novaSenha:'ab',confirmacaoSenha:'ab'}, {senhaAtual:credenciais.senha,novaSenha:'abc',confirmacaoSenha:'xyz'}]) {
        assert.equal((await request('/api/v1/usuarios/me/senha',{method:'PATCH',token,body})).status,400);
      }
    });
    await t.test('senha atual incorreta não altera a credencial', async () => {
      const hashAntes=usuario.senhaHash;
      const resposta=await request('/api/v1/usuarios/me/senha',{method:'PATCH',token:gerarToken(usuario.id),body:{senhaAtual:'incorreta',novaSenha:'abc',confirmacaoSenha:'abc'}});
      assert.equal(resposta.status,400);
      assert.equal(usuario.senhaHash,hashAntes);
    });
    await t.test('troca da própria senha aceita 3 caracteres e permite novo login', async () => {
      const resposta=await request('/api/v1/usuarios/me/senha',{method:'PATCH',token:gerarToken(usuario.id),body:{usuarioId:99,senhaAtual:credenciais.senha,novaSenha:'abc',confirmacaoSenha:'abc'}});
      assert.equal(resposta.status,200);
      assert.deepEqual(resposta.body,{mensagem:'Senha alterada com sucesso.'});
      assert.notEqual(usuario.senhaHash,'abc');
      assert.equal((await request(loginPath,{method:'POST',body:credenciais})).status,401);
      assert.equal((await request(loginPath,{method:'POST',body:{...credenciais,senha:'abc'}})).status,200);
    });
    await t.test('consulta de cidade por código IBGE e formato inválido', async () => {
      const token=gerarToken(usuario.id);
      const resposta=await request('/api/v1/cidades?codigoIbge=3509502',{token});
      assert.equal(resposta.status,200);assert.deepEqual(resposta.body,[cidade]);
      assert.deepEqual((await request('/api/v1/cidades?codigoIbge=9999999',{token})).body,[]);
      assert.equal((await request('/api/v1/cidades?codigoIbge=abc',{token})).status,400);
    });
    await t.test('exclusão exige autenticação e confirmação explícita',async()=>{
      const endpoint='/api/v1/fornecedores/23';
      assert.equal((await request(endpoint,{method:'DELETE',body:{confirmacao:'EXCLUIR'}})).status,401);
      for(const body of [undefined,{},null,{confirmacao:'sim'},{confirmacao:'excluir'}]) {
        assert.equal((await request(endpoint,{method:'DELETE',token:gerarToken(usuario.id),body})).status,400);
      }
      assert.equal(exclusoes,0);
    });
    await t.test('exclusão valida ID e fornecedor existente',async()=>{
      const args={method:'DELETE',token:gerarToken(usuario.id),body:{confirmacao:'EXCLUIR'}};
      assert.equal((await request('/api/v1/fornecedores/abc',args)).status,400);
      assert.equal((await request('/api/v1/fornecedores/99',args)).status,404);
      assert.equal(exclusoes,0);
    });
    await t.test('exclusão confirmada remove somente o fornecedor indicado',async()=>{
      const args={method:'DELETE',token:gerarToken(usuario.id),body:{confirmacao:'EXCLUIR'}};
      const resposta=await request('/api/v1/fornecedores/23',args);
      assert.equal(resposta.status,200);assert.deepEqual(resposta.body,{mensagem:'Fornecedor excluído com sucesso.'});
      assert.equal(exclusoes,1);
      assert.equal((await request('/api/v1/fornecedores/23',args)).status,404);
      assert.equal(exclusoes,1);
    });
    await t.test('fornecedor com vínculo não é excluído',async()=>{
      const resposta=await request('/api/v1/fornecedores/24',{method:'DELETE',token:gerarToken(usuario.id),body:{confirmacao:'EXCLUIR'}});
      assert.equal(resposta.status,400);assert.match(resposta.body.erro,/registros vinculados/);assert.equal(exclusoes,1);
    });
    await t.test('cadastro de usuário exige dados válidos e não expõe a senha',async()=>{
      const token=gerarToken(usuario.id);
      const endpoint='/api/v1/usuarios';
      assert.equal((await request(endpoint,{method:'POST',token,body:{nome:'Maria',login:'maria',senha:'ab'}})).status,400);
      const resposta=await request(endpoint,{method:'POST',token,body:{nome:' Maria Silva ',login:'MARIA.SILVA',senha:'abc'}});
      assert.equal(resposta.status,201);assert.equal(resposta.body.nome,'Maria Silva');assert.equal(resposta.body.login,'maria.silva');
      assert.equal(resposta.body.senhaHash,undefined);assert.equal(resposta.body.senha,undefined);
      assert.notEqual(novosUsuarios[0].senhaHash,'abc');
      assert.equal((await request(loginPath,{method:'POST',body:{login:'maria.silva',senha:'abc'}})).status,200);
      assert.equal((await request(endpoint,{method:'POST',token,body:{nome:'Maria',login:'maria.silva',senha:'abc'}})).status,400);
    });
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

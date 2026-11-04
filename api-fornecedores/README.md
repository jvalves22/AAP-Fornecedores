# API — Gestão de Fornecedores

Backend em **Node.js, JavaScript, Express, Prisma ORM e MariaDB**. Fornece autenticação, cadastro de usuários, fornecedores e consulta de cidades.

## Instalar

Requer Node.js 24, npm e MariaDB configurado.

~~~powershell
npm ci
Copy-Item .env.example .env
~~~

Se .env já existir, preserve-o. Configure PORT, DATABASE_URL e JWT_SECRET conforme o exemplo. Gere a chave:

~~~powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
~~~

JWT_SECRET precisa receber os 64 caracteres hexadecimais gerados. MariaDB utiliza mysql:// na DATABASE_URL; não há usuário, senha ou banco padrão distribuído.

Prepare a estrutura e o cliente:

~~~powershell
npx prisma validate --config prisma.config.js
npx prisma migrate deploy --config prisma.config.js
npx prisma generate --config prisma.config.js
~~~

O usuário do banco precisa ter as permissões necessárias; crie o banco previamente se sua instalação não permitir a criação pela ferramenta.

Importe os municípios, se ainda não estiverem disponíveis:

~~~powershell
node scripts/lerCidades.js
node scripts/importarCidades.js
~~~

Siga [Primeiro usuário](docs/PRIMEIRO_USUARIO.md) para inicializar um banco sem contas. Não há senha padrão.

## Executar

~~~powershell
npm run dev
~~~

A API usa a porta 3000 por padrão. [GET /health](http://localhost:3000/health) retorna {"status":"ok"}. Essa rota não verifica o MariaDB.

## Scripts

| Comando | Finalidade |
|---|---|
| npm run dev | Servidor com reinicialização pelo Node --watch |
| npm start | Servidor sem observação dos arquivos |
| npm test | Testes HTTP com banco simulado |
| npm run usuario:senha | Redefinição interativa de uma senha existente |
| node scripts/lerCidades.js | Conferir o arquivo de municípios, sem gravar |
| node scripts/importarCidades.js | Importar/atualizar municípios no banco |

## Documentação da API

- [Rotas, exemplos e erros](docs/API.md)
- [OpenAPI importável](docs/openapi.json)
- [Banco, migrations e municípios](docs/BANCO_DE_DADOS.md)
- [Primeiro usuário](docs/PRIMEIRO_USUARIO.md)
- [Operação e diagnóstico](docs/OPERACAO.md)

A URL base das operações é http://localhost:3000/api/v1. Somente health e login são públicos. As demais rotas exigem Bearer token e usuário ativo.

## Estrutura

~~~text
prisma/
  schema.prisma
  migrations/
  dados/tsmun.sql
scripts/
src/
  config/
  controllers/
  middlewares/
  repositories/
  routes/
  services/
  utils/
  validators/
  app.js
  server.js
test/
~~~

O cliente gerado fica em src/generated/prisma e não deve ser enviado ao Git. Inclua schema, migrations e package-lock.json.

## Integração com frontend

O frontend React é um módulo separado, web-fornecedores. Durante o desenvolvimento, o Vite encaminha /api para esta API. Publicar o código deste repositório no GitHub não publica automaticamente o frontend nem hospeda o banco.

## Permissões e limites

Todos os usuários ativos possuem as mesmas permissões. Não há endpoint de listagem, exclusão ou inativação de usuários na versão atual. O JWT expira em uma hora; sair e trocar a senha não revogam automaticamente tokens anteriores. Não há recuperação por e-mail ou refresh token.

## Licença

O package.json declara ISC, mas não há arquivo LICENSE estabelecendo uma licença para o projeto completo e seus recursos.

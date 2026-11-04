# Instalação e primeiro acesso

Este guia considera a pasta contendo api-fornecedores e web-fornecedores lado a lado. Para instalar somente a API, seu [README](../api-fornecedores/README.md) é independente.

## 1. Requisitos

- Node.js 24; a versão validada foi 24.14.0.
- npm disponível no terminal.
- MariaDB em execução e um usuário com permissões no banco escolhido.
- Microsoft Edge se for executar os testes de interface.
- Git para obter e publicar o código.

~~~powershell
node --version
npm --version
git --version
~~~

O projeto não instala nem inicia o serviço MariaDB. No Windows, confira o serviço pelo aplicativo Serviços.

## 2. Dependências

Na raiz do conjunto:

~~~powershell
npm ci --prefix api-fornecedores
npm ci --prefix web-fornecedores
~~~

npm ci usa os arquivos de lock. Não omita devDependencies nesta preparação: o Prisma CLI e o Vite são utilizados nas próximas etapas.

## 3. Backend: variáveis locais

~~~powershell
cd api-fornecedores
Copy-Item .env.example .env
~~~

Se .env já existir, edite-o; não substitua suas configurações ao atualizar o projeto.

~~~dotenv
PORT=3000
DATABASE_URL="mysql://SEU_USUARIO:SUA_SENHA@localhost:3306/SEU_BANCO"
JWT_SECRET=SUBSTITUA_PELA_CHAVE_GERADA
~~~

Gere a chave JWT localmente:

~~~powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
~~~

Cole o resultado em JWT_SECRET. O código exige exatamente 64 caracteres hexadecimais. Não coloque aspas extras dentro do valor nem use a indicação do exemplo como chave.

Usuário, senha, host, porta e nome do banco dependem da sua instalação. Caracteres especiais nas credenciais da URL devem ser codificados; por exemplo, @ como %40 e # como %23. MariaDB usa o protocolo mysql na DATABASE_URL.

## 4. Estrutura do banco

Ainda na pasta da API:

~~~powershell
npx prisma validate --config prisma.config.js
npx prisma migrate deploy --config prisma.config.js
npx prisma generate --config prisma.config.js
~~~

migrate deploy aplica as migrations já versionadas. O banco pode precisar ser criado previamente pelo responsável da instalação, conforme as permissões do usuário. Não execute uma nova migration init em cada instalação.

Para desenvolver uma alteração real no schema, use migrate dev com um nome descritivo. Esse comando usa um shadow database e exige permissões adicionais; consulte [Banco de dados](../api-fornecedores/docs/BANCO_DE_DADOS.md).

## 5. Cidades

Confirme a existência de prisma/dados/tsmun.sql e execute:

~~~powershell
node scripts/lerCidades.js
node scripts/importarCidades.js
~~~

A leitura não grava no banco. A importação grava cidades em lotes de 50 usando código IBGE único, sem duplicá-las ao repetir a execução. A base fornecida contém 5.564 registros e não deve ser apresentada como uma base atualizada automaticamente pelo IBGE.

## 6. Primeiro usuário

Uma instalação vazia ainda não possui uma conta para obter token. Siga o [procedimento de primeiro usuário](../api-fornecedores/docs/PRIMEIRO_USUARIO.md).

Em instalações que já têm conta ativa, faça login e use **Configurações → Novo usuário**. O comando usuario:senha redefine uma conta existente; não cria uma conta ausente.

## 7. Iniciar a API

~~~powershell
npm run dev
~~~

O terminal deve permanecer aberto. Confira [http://localhost:3000/health](http://localhost:3000/health). O retorno esperado é {"status":"ok"}; essa rota confirma o processo HTTP, não testa a conexão com o banco.

## 8. Iniciar o frontend

Abra outro terminal na raiz do conjunto:

~~~powershell
cd web-fornecedores
Copy-Item .env.example .env
npm run dev
~~~

O exemplo define API_TARGET=http://127.0.0.1:3000. Ajuste se a API usar outra porta. Abra [http://127.0.0.1:5173](http://127.0.0.1:5173) e faça login.

O Vite encaminha /api para o backend. Não é necessário configurar CORS na API para esse fluxo. Depois de alterar API_TARGET, reinicie o Vite.

## 9. Atualizações

1. Preserve .env e dados locais.
2. Atualize o código e execute npm ci nos módulos cujos locks mudaram.
3. Na API, execute migrate deploy e prisma generate com a configuração explícita.
4. Execute os testes relevantes.
5. Reinicie os processos.
6. Se servir arquivos compilados, gere e substitua o dist do frontend.

Não use dados de teste da documentação como credenciais reais do ambiente.

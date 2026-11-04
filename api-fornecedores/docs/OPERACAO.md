# Operação e diagnóstico

## Rotina

- MariaDB deve estar em execução antes das operações que acessam o banco.
- Use npm run dev durante desenvolvimento e npm start para executar sem watch.
- Mudanças em .env e configurações exigem reiniciar o processo.
- A API pode responder /health mesmo que o banco esteja indisponível.
- Não há seed automático de usuários ou de cidades.

## Senha esquecida

Na pasta da API:

~~~powershell
npm run usuario:senha
~~~

usuario:senha é o nome literal do comando; não substitua por login e senha. O script pergunta o login, a nova senha e a confirmação. A entrada da senha é oculta. O mínimo é 3 e o máximo 128 caracteres.

O comando altera somente a senha de uma conta existente e não a reativa nem cria uma conta ausente. Se retornar Usuário não encontrado, confira o login cadastrado. Não grave senha como texto diretamente no banco.

Para a troca normal com senha atual, utilize Configurações na interface.

## Migração e geração

~~~powershell
npx prisma validate --config prisma.config.js
npx prisma migrate status --config prisma.config.js
npx prisma migrate deploy --config prisma.config.js
npx prisma generate --config prisma.config.js
~~~

validate verifica o schema; não testa a conexão com MariaDB. migrate status consulta a situação das migrations. deploy altera a estrutura aplicando migrations pendentes. generate cria o cliente local.

Não use reset como solução automática para divergências em um banco que contenha dados.

## Backup e restauração

Com as ferramentas de linha de comando do MariaDB disponíveis, um exemplo de backup é:

~~~powershell
mariadb-dump -u SEU_USUARIO -p --result-file=C:/backups/fornecedores.sql SEU_BANCO
~~~

A pasta de destino deve existir. A opção -p pede a senha; não acrescente a senha ao comando. O backup contém os dados do ambiente e fica fora do Git.

Para restaurar, use um banco de destino previamente preparado e abra o cliente:

~~~powershell
mariadb -u SEU_USUARIO -p SEU_BANCO_DESTINO
~~~

Dentro do cliente MariaDB:

~~~sql
SOURCE C:/backups/fornecedores.sql;
~~~

A restauração executa as instruções do backup e pode substituir dados do destino. Verifique o destino antes de executar.

## Problemas comuns

| Sintoma | Conferir |
|---|---|
| Cannot find module | Pasta atual, npm ci e geração do Prisma Client |
| JWT_SECRET inválido | Exatamente 64 caracteres hexadecimais no .env |
| ECONNREFUSED / banco indisponível | Serviço MariaDB, host e porta da DATABASE_URL |
| Access denied / autenticação do banco | Usuário, senha e permissões da instalação |
| Cannot find module config/prisma | O módulo correto é prisma/config |
| Prisma P1012 | Conteúdo e sintaxe do schema; @relation deve permanecer em uma linha neste projeto |
| Importação com formato inesperado | Estrutura específica do tsmun.sql e codificação UTF-8 |
| Cidade não cadastrada | Execute leitura/importação e use o ID interno retornado pela API |
| Falha genérica 500 | Erro detalhado no terminal da API |
| 401 em rota protegida | Login, Bearer token, expiração de uma hora e conta ativa |
| 400 no cadastro | Leia a mensagem de validação retornada |
| CPF/CNPJ ou login duplicado | Já existe registro usando o valor |
| Falha no ViaCEP | Formato do CEP, conexão externa e existência da cidade local |
| Frontend não conecta | API_TARGET, processo da API e reinício do Vite |
| Porta 5173 ocupada | O Vite usa strictPort; encerre somente a instância conhecida ou escolha outra porta conscientemente |
| Microsoft Edge não encontrado nos testes | Instale Edge ou ajuste o canal do Playwright no seu ambiente |
| Tela antiga após atualização | Atualize com Ctrl+F5 e confira se o servidor aponta para a pasta correta |
| Senha não aparece ao digitar no terminal | Comportamento esperado da entrada oculta |

## Instalação fora do desenvolvimento

O Vite dev e o preview não configuram uma implantação completa de produção. Para servir dist, use um servidor HTTP com proxy /api para o Express.

O código atual não define TLS, roles, limite de tentativas de login ou revogação individual de JWT. Trocar senha e sair da interface não invalidam tokens previamente emitidos; o middleware bloqueia usuários inativos consultando a conta.

O banco, arquivos de ambiente e eventuais backups são administrados separadamente do repositório.

## Conferir a conexão com o banco real

Na pasta da API, execute:

~~~powershell
node src/test/testDatabase.js
~~~

Esse script conta os fornecedores e encerra a conexão, sem gravar dados. Ele acessa o MariaDB configurado no .env e não faz parte dos testes simulados de npm test.

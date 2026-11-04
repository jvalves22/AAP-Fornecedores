# Contribuindo

## Ambiente

Siga [a instalação](docs/INSTALACAO.md) e use Node.js 24, MariaDB local e Microsoft Edge para os testes de navegador. Instale dependências com npm ci em cada módulo.

## Organização

- Backend em JavaScript CommonJS: routes → controllers → services → repositories → Prisma.
- Frontend em JavaScript/JSX com módulos ES, React e CSS.
- Validadores recebem dados externos; services executam regras de negócio.
- Repositories concentram o acesso ao banco.
- Senhas são processadas por src/utils/senha.js; nunca grave senha original na coluna usu_senha.
- Respostas de usuário não devem incluir senhaHash.
- Mantenha os nomes físicos existentes por meio de @map e @@map no Prisma.

## Fluxo sugerido

1. Crie uma branch descritiva.
2. Faça uma alteração delimitada.
3. Execute os testes relevantes e o build do frontend quando ele for alterado.
4. Atualize a referência da API, o OpenAPI e os exemplos quando o contrato mudar.
5. Abra uma pull request descrevendo problema, comportamento novo e validação realizada.

~~~powershell
git switch -c melhoria/descricao-curta
~~~

Os comandos de validação estão em [TESTES.md](docs/TESTES.md). Os testes automatizados usam respostas simuladas e não devem depender de registros pessoais.

## Banco

Mudanças de schema devem acompanhar uma migration revisada. Não edite migrations já aplicadas para ocultar divergências. Dados locais não são arquivos de migração. Não execute reset do banco para resolver erros sem avaliar os dados existentes.

## Arquivos

Inclua os dois package-lock.json, as migrations e os exemplos de ambiente. Não inclua .env, senhas, tokens, node_modules, builds, resultados de testes ou cópias de bancos reais.

## Interface

Preserve a escala compacta e a navegação por teclado. Confira telas de notebook e desktop, além de uma largura móvel. Máscaras alteram a apresentação; mantenha a normalização no envio à API.

## Licença

Não acrescente uma licença ou atribuição de autoria em nome de terceiros. O licenciamento do projeto completo ainda precisa ser definido pelo responsável.

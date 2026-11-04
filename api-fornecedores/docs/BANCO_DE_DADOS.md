# Banco de dados

Fonte da estrutura: prisma/schema.prisma. A migration inicial está em prisma/migrations/20261103154503_init/migration.sql.

## Models e tabelas

| Model Prisma | Tabela MariaDB | Finalidade |
|---|---|---|
| Usuario | gpc001 | Contas de acesso |
| Fornecedor | gpc002 | Dados comerciais, contato e endereço |
| Cidade | gp_cidades | Municípios e UF |

Os IDs são Int autoincrementais. Os nomes usados no JavaScript são associados às colunas legadas por @map e @@map. O datasource usa provider mysql, também utilizado para MariaDB.

~~~mermaid
erDiagram
  CIDADE ||--o{ FORNECEDOR : possui
  CIDADE {
    int id PK
    string codigoIbge UK
    string nome
    string uf
  }
  FORNECEDOR {
    int id PK
    int cidadeId FK
    string tipoPessoa
    string nomeRazaoSocial
    string cpf UK
    string cnpj UK
    string setor
    boolean ativo
  }
  USUARIO {
    int id PK
    string nome
    string login UK
    string senhaHash
    boolean ativo
  }
~~~

Não há vínculo de autoria entre usuário e fornecedor no schema atual.

## Usuario — gpc001

| Propriedade | Coluna | Tipo/regra |
|---|---|---|
| id | id_usu | Int, chave primária autoincremental |
| nome | usu_nome | VarChar(100), obrigatório |
| login | usu_login | VarChar(100), único |
| senhaHash | usu_senha | VarChar(255), hash scrypt, não senha original |
| ativo | ativo | Boolean, padrão true |
| criadoEm | criado_em | DateTime, padrão now |
| atualizadoEm | atualizado_em | DateTime, @updatedAt |

## Fornecedor — gpc002

| Propriedade | Coluna | Tipo |
|---|---|---|
| id | id_for | Int, chave primária autoincremental |
| tipoPessoa | for_pessoa | Enum FISICA / JURIDICA |
| nomeRazaoSocial | for_razao | VarChar(150) |
| nomeFantasia | for_fantasia | VarChar(150), opcional |
| cpf | for_cpf | VarChar(11), único, opcional no schema |
| cnpj | for_cnpj | VarChar(14), único, opcional no schema |
| inscricaoEstadual | for_ie | VarChar(20), opcional |
| rg | for_rg | VarChar(20), opcional |
| logradouro | for_end | VarChar(150) |
| numero | for_numero | VarChar(20) |
| complemento | for_complemento | VarChar(100), opcional |
| bairro | for_bairro | VarChar(100) |
| cep | for_cep | Char(8) |
| cidadeId | cod_cid | Int, chave estrangeira |
| nomeContato | for_contato | VarChar(100), opcional |
| email | for_email | VarChar(254), opcional |
| telefone | for_telefone | VarChar(20), opcional |
| celular | for_celular | VarChar(20), opcional |
| site | for_site | VarChar(255), opcional |
| setor | for_setor | VarChar(100), opcional |
| observacoes | for_obs | Text, opcional |
| ativo | ativo | Boolean, padrão true |
| criadoEm | data_cadastro | DateTime, padrão now |
| atualizadoEm | atualizado_em | DateTime, @updatedAt |

A aplicação exige CPF ou CNPJ conforme tipoPessoa e pelo menos um meio de contato. Essas regras condicionais ficam nos validadores, não em um campo NOT NULL comum aos dois documentos.

Cada fornecedor tem um endereço e um contato. Nome da cidade e UF são obtidos pela relação; não são duplicados em gpc002. Cargo não faz parte do model.

## Cidade — gp_cidades

| Propriedade | Coluna | Tipo/regra |
|---|---|---|
| id | id_cidades | Int, chave primária autoincremental |
| codigoIbge | cid_numero | Char(7), único |
| nome | cid_nome | VarChar(100) |
| uf | cid_uf | Char(2) |
| fornecedores | Relação | Lista de fornecedores, sem coluna própria |

Índices: cidadeId no fornecedor; uf + nome na cidade. A relação usa onDelete Restrict e onUpdate Cascade: não se exclui uma cidade referenciada por fornecedores.

## Migrations

Instalar uma estrutura já versionada:

~~~powershell
npx prisma migrate deploy --config prisma.config.js
npx prisma generate --config prisma.config.js
~~~

Desenvolver uma mudança de schema:

~~~powershell
npx prisma migrate dev --name descricao_da_mudanca --config prisma.config.js
npx prisma generate --config prisma.config.js
~~~

migrate dev depende de shadow database e permissões de desenvolvimento. Não é necessário executá-lo a cada inicialização. Versione o SQL e migration_lock.toml; não versione o cliente gerado.

A configuração correta usa migrations.path = prisma/migrations no prisma.config.js. No Prisma 7, DATABASE_URL fica na configuração e não no bloco datasource do schema.

## Importação de municípios

O arquivo de entrada fica em prisma/dados/tsmun.sql. O leitor aceita o formato específico:

~~~sql
INSERT INTO `tsmun` VALUES (1, '3509502', '35', 'Campinas', 'SP');
~~~

Valores: ID de origem, código IBGE, código numérico da UF, nome e sigla.

O leitor:

- Ignora o ID de origem; MariaDB gera o ID local.
- Não grava o código numérico de UF, ausente no model.
- Confere formato, prefixo de UF, duplicidade de código e tamanho do nome.
- Corrige os apóstrofos escapados encontrados nesse arquivo.
- Não executa os comandos SQL originais contra tsmun.

~~~powershell
node scripts/lerCidades.js
node scripts/importarCidades.js
~~~

A base fornecida tem 5.564 municípios. A importação faz upsert por codigoIbge em transações de 50 operações. Em erro, lotes anteriores permanecem e o lote atual é revertido. Repetir atualiza nome/UF e preserva IDs, sem apagar cidades que não estiverem no arquivo.

A origem editorial e a atualização desse arquivo devem ser mantidas pelo responsável pelos dados. O script não consulta automaticamente o IBGE.

## Backup

O banco é um recurso separado do Git. Preserve backups fora do repositório. Os comandos sugeridos estão em [Operação](OPERACAO.md).

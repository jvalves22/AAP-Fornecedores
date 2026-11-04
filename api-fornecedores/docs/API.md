# Referência da API

Base local: **http://localhost:3000/api/v1**. A rota de health está fora desse prefixo.

[Contrato OpenAPI](openapi.json) • [Banco](BANCO_DE_DADOS.md) • [Operação](OPERACAO.md)

## Autenticação

Envie o cabeçalho:

~~~http
Authorization: Bearer SEU_TOKEN
~~~

O JWT dura uma hora. A API verifica assinatura HS256, expiração, emissor, destinatário e conta ativa. Somente login e health dispensam autenticação.

## Rotas

| Método | Caminho | Acesso | Resultado |
|---|---|---|---|
| GET | /health (fora de /api/v1) | Público | Processo HTTP ativo |
| POST | /auth/login | Público | Token e dados básicos |
| GET | /fornecedores | Autenticado | Lista paginada |
| GET | /fornecedores/:id | Autenticado | Detalhes com cidade |
| POST | /fornecedores | Autenticado | Novo fornecedor |
| PUT | /fornecedores/:id | Autenticado | Atualização completa |
| PATCH | /fornecedores/:id/ativo | Autenticado | Alteração de status |
| DELETE | /fornecedores/:id | Autenticado | Exclusão permanente confirmada |
| GET | /cidades | Autenticado | Até 50 cidades |
| POST | /usuarios | Autenticado | Nova conta |
| PATCH | /usuarios/me/senha | Autenticado | Troca da própria senha |

## Health

GET http://localhost:3000/health

~~~json
{"status":"ok"}
~~~

Não confirma a conexão com MariaDB.

## Login

POST /auth/login

~~~json
{
  "login": "seu.login",
  "senha": "SUA_SENHA_LOCAL"
}
~~~

Resposta 200:

~~~json
{
  "token": "JWT_GERADO_PELA_API",
  "usuario": {"id": 1, "nome": "Pessoa de Exemplo", "login": "seu.login"}
}
~~~

Login é convertido para minúsculas. Senha é verificada exatamente como recebida. Credenciais incorretas ou conta inativa retornam 401 com a mesma mensagem. Dados malformados retornam 400. Não há conta padrão.

## Listar fornecedores

GET /fornecedores?pagina=1&limite=20&busca=exemplo&ativo=true

| Parâmetro | Padrão | Regra |
|---|---|---|
| pagina | 1 | Inteiro positivo; deslocamento limitado ao intervalo aceito pelo service |
| limite | 20 | Inteiro de 1 a 100 |
| busca | Texto vazio | Texto de até 150 caracteres, somente nome/razão social |
| ativo | Ausente | Exatamente true ou false; ausente inclui ambos |

A ordenação é nomeRazaoSocial e id, ambos crescentes. A comparação textual depende da collation do MariaDB.

~~~json
{
  "dados": [],
  "paginacao": {"pagina": 1, "limite": 20, "total": 0, "totalPaginas": 0}
}
~~~

O filtro multicoluna e os filtros de pessoa e UF presentes na interface são aplicados no frontend; não são parâmetros adicionais desta rota.

## Buscar fornecedor

GET /fornecedores/1

Retorna 200 com o registro, seus campos e a cidade relacionada. IDs inválidos retornam 400; um ID válido sem registro retorna 404.

## Cadastrar fornecedor

POST /fornecedores

Exemplo ilustrativo; substitua cidadeId por um ID existente na instalação:

~~~json
{
  "tipoPessoa": "FISICA",
  "nomeRazaoSocial": "Fornecedor de Exemplo",
  "cpf": "52998224725",
  "email": "contato@example.com",
  "telefone": "1134567890",
  "setor": "Manutenção industrial",
  "logradouro": "Rua de Exemplo",
  "numero": "100",
  "complemento": "Sala 2",
  "bairro": "Centro",
  "cep": "01001000",
  "cidadeId": 1,
  "ativo": true
}
~~~

Resposta 201 com os dados e cidade. O CPF é apenas um valor ilustrativo de teste; validação matemática não comprova titularidade.

### Regras

- tipoPessoa: FISICA ou JURIDICA.
- nomeRazaoSocial: obrigatório, até 150 caracteres.
- Pessoa física exige CPF; jurídica exige CNPJ.
- CPF: 11 dígitos, sem pontuação, com dígitos verificadores válidos.
- CNPJ: 14 caracteres, sem pontuação, letras maiúsculas quando houver; aceita o formato alfanumérico.
- CPF/CNPJ preenchidos são únicos e validados, inclusive se ambos forem enviados.
- Pelo menos um entre email, telefone e celular deve estar preenchido.
- Logradouro, número, bairro, CEP e cidadeId são obrigatórios.
- CEP: texto com oito dígitos. cidadeId: inteiro positivo de uma cidade existente.
- O backend recebe documentos e CEP já sem máscara; a normalização visual é feita no frontend.
- Campos opcionais vazios são convertidos para null; espaços nas extremidades de textos são removidos.
- Campos controlados como id e datas não são copiados do corpo para a gravação.

Limites adicionais:

| Campo | Limite |
|---|---|
| nomeFantasia | 150 |
| inscricaoEstadual, rg | 20 |
| logradouro | 150 |
| numero | 20 |
| complemento, bairro, nomeContato, setor | 100 |
| email | 254 |
| telefone, celular | 20 |
| site | 255 |
| observacoes | Campo textual; armazenamento Text no banco |

E-mail preenchido tem validação básica de formato. Site não tem validação de URL, conforme a regra atual do projeto.

## Atualizar fornecedor

PUT /fornecedores/1

Usa o mesmo contrato do cadastro e retorna 200 com o registro atualizado. É uma **atualização completa**: campos opcionais omitidos são convertidos para null. O campo ativo mantém o valor atual se não for enviado. ID e criadoEm são preservados; atualizadoEm é atualizado pelo Prisma.

O frontend preserva site e observacoes existentes no formulário, embora esses campos não tenham controles próprios na interface atual.

## Ativar ou inativar

PATCH /fornecedores/1/ativo

~~~json
{"ativo": false}
~~~

Exige booleano JSON, não o texto "false". Retorna 200 com o registro. true reativa o fornecedor.

## Excluir

DELETE /fornecedores/1

~~~json
{"confirmacao": "EXCLUIR"}
~~~

A confirmação no corpo deve corresponder exatamente a EXCLUIR. O frontend aceita a digitação sem diferenciar maiúsculas e normaliza o texto antes de enviar.

Resposta 200:

~~~json
{"mensagem":"Fornecedor excluído com sucesso."}
~~~

Ausência de confirmação retorna 400. Fornecedor inexistente retorna 404. Registros vinculados que impeçam a exclusão retornam 400. Não existe desfazer pela API.

## Cidades

GET /cidades?uf=SP&busca=campinas

Também é possível resolver o município pelo código IBGE:

~~~http
GET /api/v1/cidades?codigoIbge=3509502
~~~

| Parâmetro | Regra |
|---|---|
| uf | Opcional, sigla válida; normalizada para maiúsculas |
| busca | Opcional, até 100 caracteres; contém parte do nome |
| codigoIbge | Opcional, exatamente sete dígitos |

Filtros enviados juntos são combinados. Retorna um array com até 50 registros, ordenados por UF, nome e ID.

~~~json
[
  {"id": 1, "codigoIbge": "3509502", "nome": "Campinas", "uf": "SP"}
]
~~~

O id do exemplo não é fixo. Use o ID retornado pela sua instalação em cidadeId, não o código IBGE.

Não existe rota de cadastro de cidades. A base é importada pelo script local.

## Criar usuário

POST /usuarios

~~~json
{
  "nome": "Pessoa de Exemplo",
  "login": "pessoa.exemplo",
  "senha": "SENHA_ESCOLHIDA_LOCALMENTE"
}
~~~

Nome obrigatório, até 100 caracteres. Login de 3 a 100 caracteres, com letras, números, ponto, hífen ou sublinhado. Senha de 3 a 128 caracteres.

O nome é aparado nas extremidades, o login é convertido em minúsculas e a senha vira hash. Resposta 201: id, nome, login, ativo e criadoEm; nunca senha ou senhaHash. Duplicidade retorna 400.

A confirmação da senha é um controle do formulário de novo usuário; a API de criação recebe apenas nome, login e senha. Todos os usuários ativos podem criar contas.

## Alterar a própria senha

PATCH /usuarios/me/senha

~~~json
{
  "senhaAtual": "SENHA_ATUAL",
  "novaSenha": "NOVA_SENHA",
  "confirmacaoSenha": "NOVA_SENHA"
}
~~~

A conta é obtida exclusivamente do token. Enviar usuarioId no corpo não permite alterar outra conta.

Nova senha: 3 a 128 caracteres. Confirmação deve ser idêntica. Senha atual incorreta ou confirmação inválida retorna 400, mantendo a sessão da interface. Usuário ausente/inativo retorna 401.

Resposta 200:

~~~json
{"mensagem":"Senha alterada com sucesso."}
~~~

## Erros

As validações e regras da aplicação retornam:

~~~json
{"erro":"Mensagem para o usuário"}
~~~

| Status | Uso |
|---|---|
| 200 | Consulta/alteração/exclusão concluída |
| 201 | Registro criado |
| 400 | Dados inválidos, conflito de documento/login ou confirmação |
| 401 | Token/credenciais inválidos ou conta indisponível |
| 404 | Registro inexistente |
| 500 | Falha interna; detalhes ficam no terminal |

O middleware de autenticação acrescenta WWW-Authenticate: Bearer em suas respostas 401. A resposta genérica de falha interna não deve ser usada para descobrir a causa: consulte o terminal da API.

Rotas desconhecidas e erros fora dessas validações podem seguir o tratamento padrão do Express. Não há contrato adicional de 204, 409 ou 422 na versão atual.

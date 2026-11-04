# Testes e validação

## Comandos

Na raiz do conjunto:

~~~powershell
npm test --prefix api-fornecedores
npm run test:masks --prefix web-fornecedores
npm test --prefix web-fornecedores
npm run build --prefix web-fornecedores
~~~

Os testes da API e das máscaras não precisam do MariaDB. Os testes de navegador precisam do Microsoft Edge instalado e da porta 5173 disponível, ou de um Vite compatível já em execução.

O Playwright inicia o Vite quando necessário. Em execução local, a configuração permite reutilizar um servidor existente; evite reutilizar uma instância que sirva outra versão do código.

## API

test/auth.test.js usa node:test, servidor HTTP temporário e Prisma simulado.

Cobre login, token válido/inválido/expirado, emissor e destinatário, usuário ativo, rotas protegidas, troca de senha, criação de usuário, consulta de cidade por IBGE e exclusão com confirmação. Credenciais de teste e chave JWT são exclusivas do ambiente simulado.

## Máscaras

test-unit/masks.test.js confere:

- CNPJ numérico e alfanumérico.
- CPF e CEP com zeros iniciais.
- RG com dígito X e formatos legados.
- Telefone fixo, celular e números internacionais.
- Normalização e campos vazios.

## Interface

tests/frontend.spec.js simula a API e o ViaCEP. Não cria contas nem exclui fornecedores do MariaDB.

Cobre telas, filtros, paginação, criação e edição, setor, status, confirmação/cancelamento/falha de exclusão, CEP, máscaras, criação de usuários, senhas, logout, sessão expirada e layout.

Capturas são geradas em web-fornecedores/test-results. Esse diretório é local e ignorado pelo Git; as imagens selecionadas para o README ficam em docs/imagens.

## Resultado documentado

Validação executada em 04/11/2026:

| Verificação | Resultado |
|---|---|
| API | 25 testes aprovados |
| Máscaras | 2 testes aprovados |
| Frontend | 13 testes aprovados |
| Build Vite | Concluído |

Os números podem mudar conforme forem acrescentados testes. O sucesso com mocks não substitui uma verificação de uma instalação real do MariaDB e do serviço externo.

## Verificação manual de uma instalação

1. Inicie MariaDB, API e frontend.
2. Confira /health.
3. Faça login com uma conta ativa local.
4. Consulte uma cidade importada.
5. Cadastre um fornecedor de teste e confira a cidade, documentos e setor.
6. Edite, inative e reative o fornecedor.
7. Confira filtros e dashboard.
8. Teste a alteração de senha e um novo login.
9. Exclua apenas o cadastro de teste pela caixa de confirmação.
10. Saia e confira o retorno ao login.

Migrations, importação de cidades, redefinição local e a interface real alteram dados quando executados contra o banco. Não confunda esses comandos com os testes simulados.

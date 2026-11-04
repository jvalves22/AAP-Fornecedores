# Arquitetura

## Componentes

| Componente | Tecnologias | Responsabilidade |
|---|---|---|
| Interface | React 19.2, Vite 7.2, JavaScript/JSX, CSS | Formulários, navegação, máscaras, filtros e indicadores |
| API | Node.js 24, Express 5.3, CommonJS | HTTP, autenticação e regras de negócio |
| Persistência | Prisma 7.10 + adapter-mariadb | Consultas e gravações no MariaDB |
| Banco | MariaDB | Usuários, fornecedores e cidades |
| Consulta externa | ViaCEP HTTPS | Endereço e código IBGE de um CEP |
| Testes | node:test e Playwright com Edge | Regras, contratos HTTP e fluxos de interface |

Versões refletem os manifests atuais; o lock define a instalação exata.

~~~mermaid
flowchart LR
  U[Usuário] --> W[React / Vite]
  W -->|/api via proxy| E[Express]
  E --> A[Middleware JWT e usuário ativo]
  A --> C[Controllers]
  C --> S[Services e validadores]
  S --> R[Repositories]
  R --> P[Prisma e adaptador MariaDB]
  P --> DB[(MariaDB)]
  W -->|CEP| V[ViaCEP]
~~~

O formulário é o responsável pela consulta externa. Depois consulta a API local para resolver a cidade pelo código IBGE.

## Backend

- routes: métodos e caminhos.
- controllers: leem req.params, req.query e req.body, chamam services e enviam HTTP.
- services: validações, documentos, cidades, normalização, confirmação de exclusão e tratamento de conflitos.
- repositories: operações Prisma.
- validators: validações dos dados externos.
- middlewares/autenticar.js: Bearer token, assinatura, expiração, emissor, destinatário e usuário ativo.
- utils/senha.js: scrypt e comparação por timingSafeEqual.
- utils/token.js: geração e verificação JWT.
- config/database.js: cliente Prisma compartilhado e adaptador MariaDB.

O Prisma é configurado por prisma.config.js e gera o cliente JavaScript em src/generated/prisma. Esse diretório não é versionado.

## Frontend

- src/main.jsx: componentes de login, dashboard, listagem, formulário, configurações e confirmação de exclusão.
- src/api.js: requisições, sessão e carregamento das páginas de fornecedores.
- src/masks.js: apresentação e normalização de documentos e telefones.
- src/styles.css: estilos compactos e pontos de adaptação de layout.
- public/assets: logos, ícones e recursos exportados do protótipo.
- vite.config.js: proxy /api no desenvolvimento e preview.

A navegação é controlada pelo estado do React; as páginas não são rotas independentes de um roteador. Recarregar a aplicação autenticada retorna ao dashboard.

## Autenticação

1. Login e senha são enviados a POST /api/v1/auth/login.
2. O backend encontra a conta, compara o hash e confere ativo.
3. Emite JWT HS256 com sub, exp, issuer api-fornecedores e audience web-fornecedores.
4. O frontend guarda token e dados básicos em sessionStorage.
5. As próximas chamadas enviam Authorization: Bearer.
6. A API consulta a conta a cada requisição protegida e bloqueia contas ausentes ou inativas.

A chave JWT deve ter 64 caracteres hexadecimais. As senhas usam salt aleatório de 16 bytes, chave scrypt de 64 bytes e formato scrypt-v1. O custo configurado é N=131072, r=8 e p=1, com maxmem de 256 MiB; autenticações simultâneas consomem memória e devem ser consideradas ao dimensionar o processo.

## Limites e comportamento atual

- Uso local; o frontend não é uma hospedagem do banco.
- Todos os usuários ativos podem criar usuários e operar fornecedores. Não há distinção de administrador.
- Logout apaga o token na aba, mas não o revoga no servidor.
- Alterar senha não invalida automaticamente tokens já emitidos.
- Não há refresh token, recuperação de senha por e-mail, limitação de tentativas ou trilha de auditoria.
- Health informa o processo HTTP, sem teste de banco.
- Dashboard e pesquisa multicoluna carregam todas as páginas; não há endpoint de agregação.
- Tabelas extensas rolam dentro do painel; o layout foi verificado de 1024 a 2560 px e em largura móvel.
- A base importada não recebe atualizações automáticas do IBGE.
- O número mínimo de 3 caracteres para senhas é uma decisão atual do projeto, aplicada no cadastro, troca e redefinição.
- Endpoints desconhecidos usam o 404 padrão do Express; nem todos os erros de parsing HTTP têm o formato das validações da aplicação.

## Publicação de uma instalação

Vite fornece proxy em desenvolvimento e preview. Servir somente dist exige um servidor/reverse proxy que encaminhe /api para a API. A API não configura CORS nem TLS por conta própria.

src/server.js chama listen sem host explícito. Não presuma que o backend esteja limitado a 127.0.0.1; o acesso de rede depende do sistema e da configuração de implantação.

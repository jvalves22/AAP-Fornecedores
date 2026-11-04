# Frontend — Gestão de Fornecedores

Interface em **React, JavaScript/JSX, Vite e CSS**, integrada à API Express de fornecedores.

## Instalar e executar

Ambiente validado com Node.js 24.14.0.

~~~powershell
npm ci
Copy-Item .env.example .env
npm run dev
~~~

Preserve .env se já estiver configurado. Acesse [http://127.0.0.1:5173](http://127.0.0.1:5173).

A API deve estar em execução e ter cidades e um usuário ativo cadastrados. Não há contas de demonstração no aplicativo. O arquivo .env do frontend recebe somente API_TARGET; não copie a chave JWT nem as credenciais do MariaDB para ele.

## Configuração

~~~dotenv
API_TARGET=http://127.0.0.1:3000
~~~

O Vite encaminha /api para esse endereço no desenvolvimento e no preview. Reinicie o Vite ao mudar a variável.

## Funcionalidades

- Login e sessão por Bearer token em sessionStorage.
- Dashboard com totais e distribuições calculadas dos registros reais.
- Busca de fornecedores, filtros, seis registros por página e Apenas Ativos.
- Cadastro, detalhes, edição, ativação/inativação e exclusão com confirmação.
- Campo Setor no cadastro e na edição.
- Máscaras de CPF, CNPJ alfanumérico, CEP, RG e telefones.
- Consulta ViaCEP com associação de cidade pelo código IBGE.
- Configurações com troca da própria senha e criação de usuários.
- Sair no dashboard e no rodapé lateral.
- Layout compacto para notebooks, desktop e largura móvel.

## Scripts

| Comando | Finalidade |
|---|---|
| npm run dev | Desenvolvimento na porta 5173 |
| npm run build | Gerar arquivos de produção em dist |
| npm run preview | Conferir localmente o build |
| npm test | Testes Playwright com Microsoft Edge |
| npm run test:masks | Testes dos formatadores com Node |

## Estrutura

~~~text
public/assets/       # Logos, ícones e recursos locais
src/
  main.jsx           # Componentes e navegação
  api.js             # Requisições e sessão
  masks.js           # Máscaras e normalização
  styles.css         # Layout compacto e responsivo
tests/               # Fluxos de navegador
test-unit/           # Testes de máscaras
vite.config.js
playwright.config.js
~~~

## Contratos utilizados

A base é /api/v1. Login usa POST /auth/login. As operações de fornecedores ficam em /fornecedores; cidades em /cidades; criação de usuário em POST /usuarios e troca de senha em PATCH /usuarios/me/senha.

A referência completa e o OpenAPI ficam em api-fornecedores/docs no conjunto do projeto. O frontend envia token Bearer automaticamente. Em 401, remove a sessão e volta ao login; respostas de validação são exibidas na tela.

## Testes

Os testes de navegador usam Edge e simulam a API e o ViaCEP; não modificam o banco real. O Playwright inicia ou reutiliza o Vite na porta 5173. Capturas são salvas em test-results e não são versionadas.

## Build e hospedagem

~~~powershell
npm run build
npm run preview
~~~

dist contém arquivos estáticos. O proxy configurado no Vite não acompanha esses arquivos para outro servidor. Na hospedagem, encaminhe /api para a API Express e sirva index.html e assets no mesmo domínio. Nunca publique o .env da API no frontend.

## Observações

O navegador percorre as páginas de fornecedores para montar indicadores e busca multicoluna. Não há roteador de páginas; recarregar com sessão válida retorna ao dashboard. CPF/CNPJ têm verificação no backend; máscaras não comprovam a validade cadastral de documentos.

Fontes ficam locais por meio de @fontsource. Logos, ícones e recursos visuais vieram do protótipo fornecido pelo responsável pelo projeto. Não foi acrescentada uma licença para esses recursos.

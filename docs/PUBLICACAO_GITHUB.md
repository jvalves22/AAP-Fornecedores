# Preparar e publicar no GitHub

## Situação desta pasta

Na preparação desta documentação, o repositório Git existente estava **somente dentro de api-fornecedores**, com remoto:

~~~text
https://github.com/jvalves22/api-fornecedores.git
~~~

web-fornecedores e os guias da raiz estavam fora desse repositório. Um git add executado dentro da API não inclui essas pastas irmãs.

Nenhum commit, push ou reorganização do histórico foi executado para preparar estes guias.

## Opção A — Publicar o sistema completo em um novo repositório

A organização mais direta para os guias da raiz é um repositório contendo api-fornecedores, web-fornecedores e docs. Para preservar o repositório original da API, prepare uma cópia nova e limpa, sem mover ou apagar seu .git.

No PowerShell, partindo da pasta que contém os dois módulos:

~~~powershell
$pastaOrigem = (Get-Location).Path
$pastaPublicacao = Join-Path (Split-Path $pastaOrigem -Parent) "planeta-fornecedores-publicacao"

if (Test-Path -LiteralPath $pastaPublicacao) {
    throw "Escolha uma pasta de publicação nova e vazia antes de continuar."
}

New-Item -ItemType Directory -Path $pastaPublicacao | Out-Null

robocopy $pastaOrigem $pastaPublicacao /E /XD .git node_modules dist test-results playwright-report coverage .backups .npm-cache /XF .env ".env.*" "*.log" "*.dump" "backup*.sql"

if ($LASTEXITCODE -ge 8) {
    throw "A cópia apresentou erro. Confira o resultado antes de continuar."
}

Copy-Item -LiteralPath (Join-Path $pastaOrigem "api-fornecedores/.env.example") -Destination (Join-Path $pastaPublicacao "api-fornecedores/.env.example")
Copy-Item -LiteralPath (Join-Path $pastaOrigem "web-fornecedores/.env.example") -Destination (Join-Path $pastaPublicacao "web-fornecedores/.env.example")

Set-Location -LiteralPath $pastaPublicacao
git init
git add .
git status
~~~

robocopy usa códigos de sucesso diferentes de zero; o teste acima considera falha a partir de 8. Os exemplos de ambiente são copiados separadamente porque a exclusão .env.* também os remove da cópia geral.

Confira a lista antes do commit. Ela deve conter código, documentação, assets, dados de municípios autorizados, lockfiles e migrations. Não deve conter .env, chaves, tokens, senhas, node_modules, backups de banco, dist ou resultados de testes.

Crie no GitHub um repositório novo e vazio, com a visibilidade escolhida por você, sem gerar outro README ou .gitignore. Depois:

~~~powershell
git commit -m "Documenta e organiza o sistema de fornecedores"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/planeta-fornecedores.git
git push -u origin main
~~~

Substitua a URL pelo repositório realmente criado. Esta receita cria um histórico novo para o conjunto; não reescreve o histórico original da API.

## Opção B — Manter repositórios separados

Continue publicando a API em seu repositório existente e crie outro para web-fornecedores.

Cada módulo tem README próprio. Os guias específicos da API ficam dentro de api-fornecedores/docs e acompanham seu repositório. Os guias integrados e imagens na raiz precisam de um local de publicação próprio ou de um repositório agregador; não são incluídos automaticamente nos dois repositórios separados.

## Conferir antes do envio

~~~powershell
git status
git diff --cached --stat
git diff --cached --name-only
~~~

Arquivos esperados:

- README, guias e exemplos de ambiente sanitizados.
- Os package.json e package-lock.json.
- Código, assets, schema e migrations.
- tsmun.sql somente como base de municípios, sem dados de usuários/fornecedores locais.

O .gitignore evita novas inclusões, mas não remove arquivos já rastreados de commits anteriores. Se alguma credencial já foi publicada, removê-la da cópia atual não a elimina do histórico; substitua a credencial exposta e revise o histórico antes de publicar novamente.

## Verificação após publicar

1. Abra o README no GitHub e teste os links e imagens.
2. Faça clone em outra pasta.
3. Execute a instalação sem copiar o .env da máquina original.
4. Configure um banco de teste e crie uma conta própria.
5. Execute a validação documentada.

GitHub guarda o código. A publicação do repositório não sobe Express, MariaDB ou frontend para um servidor.

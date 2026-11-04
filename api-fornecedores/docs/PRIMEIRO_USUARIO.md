# Primeiro usuário de uma instalação

A API de criação de usuários exige autenticação. Por isso, um banco novo precisa receber uma conta inicial por um procedimento local do responsável pela instalação.

**Não existe senha padrão.** O comando npm run usuario:senha só altera uma conta já existente.

## Pré-requisitos

Prepare o .env, aplique as migrations e gere o cliente Prisma conforme o README da API. Faça este procedimento no computador onde a API está instalada, dentro da pasta api-fornecedores.

## 1. Gerar o hash da senha

No PowerShell, execute:

~~~powershell
$senhaInicialSegura = Read-Host "Escolha a senha inicial (3 a 128 caracteres)" -AsSecureString
$credencialInicial = [System.Management.Automation.PSCredential]::new("inicial", $senhaInicialSegura)
$env:SENHA_INICIAL = $credencialInicial.GetNetworkCredential().Password

try {
    node -e "const {gerarHash}=require('./src/utils/senha'); const senha=process.env.SENHA_INICIAL; if(!senha || senha.length<3 || senha.length>128){console.error('Use de 3 a 128 caracteres.');process.exitCode=1;}else{gerarHash(senha).then(console.log).catch(()=>{console.error('Falha ao gerar hash.');process.exitCode=1;});}"
}
finally {
    Remove-Item Env:SENHA_INICIAL -ErrorAction SilentlyContinue
    $credencialInicial = $null
    $senhaInicialSegura = $null
}
~~~

A senha não aparece na digitação nem fica escrita no comando do histórico. O Node recebe o valor temporariamente pelo ambiente e exibe somente o hash scrypt-v1. Copie esse hash completo para o próximo passo, sem adicioná-lo à documentação ou ao Git.

Se houver erro de tamanho, repita com uma senha válida.

## 2. Cadastrar a conta pelo Prisma Studio

~~~powershell
npx prisma studio --config prisma.config.js
~~~

Abra o endereço informado no terminal e selecione o model **Usuario**. Adicione um registro com:

| Campo | Preenchimento |
|---|---|
| nome | Nome da pessoa responsável |
| login | Login em minúsculas, 3 a 100 caracteres; letras, números, ponto, hífen ou sublinhado |
| senhaHash | Hash completo gerado no passo anterior |
| ativo | true |

Os campos automáticos de ID e datas são gerenciados pelo Prisma. Confira o registro e salve. Não coloque a senha original em senhaHash ou usu_senha.

O Studio é uma ferramenta administrativa com acesso ao banco configurado, não uma tela pública do sistema. Feche seu processo após terminar.

## 3. Entrar no sistema

Inicie API e frontend, informe o login escolhido e a senha original usada para gerar o hash. Depois, novas contas podem ser criadas em **Configurações → Novo usuário**.

## Instalação existente

Se já há usuário ativo, não repita o procedimento para recriar a mesma conta. Use o login existente. Caso tenha esquecido a senha, execute npm run usuario:senha em um terminal interativo e informe o login correto.

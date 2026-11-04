# Manual do usuário

## Entrar e sair

Informe seu login e senha na tela inicial. O login é padronizado em minúsculas; a senha preserva espaços e letras maiúsculas e minúsculas.

A sessão usa um token com validade de uma hora. Ao receber 401, a aplicação pede novo login. Para sair, use o botão **Sair** no dashboard ou no rodapé da barra lateral. A ação remove a sessão deste navegador/aba; não revoga o token já emitido no servidor.

## Dashboard

Mostra fornecedores cadastrados, ativos, novos cadastros do mês atual, distribuição por setor, distribuição por estado e dois cadastros recentes. As informações usam os registros carregados da API, não valores fixos de demonstração.

Datas e agrupamentos do frontend seguem o relógio e o fuso do navegador. Fornecedores sem setor aparecem como **Não informado**.

## Encontrar fornecedores

Abra **Fornecedores** e use:

- Busca por razão social/nome, fantasia, CPF/CNPJ, e-mail, telefone, celular ou cidade.
- Checkbox **Apenas Ativos**.
- Filtros de status, tipo de pessoa e estado.
- Paginação de seis registros por página.

O checkbox reflete o filtro de status: ao selecionar Ativos no filtro, ele também fica marcado. Ao desmarcá-lo, volta a consultar todos os status, mantendo os demais filtros.

A pesquisa multicoluna é feita no navegador após carregar os registros. O parâmetro busca da API pesquisa somente nome/razão social.

## Cadastrar

Clique em **Cadastrar** e preencha:

1. Tipo de pessoa: física ou jurídica.
2. Nome/razão social e documento correspondente.
3. Dados opcionais, como fantasia, inscrição estadual/RG e setor.
4. Pelo menos um e-mail, telefone ou celular.
5. Endereço e uma cidade selecionada da base importada.

CPF, CNPJ, CEP, RG e telefones têm máscaras. A aplicação retira a formatação necessária ao enviar os dados. CNPJ aceita letras; RGs de outros tamanhos e telefones internacionais são preservados pelo formatador.

As validações de documentos verificam seus dígitos, não a existência ou situação cadastral na Receita.

## Buscar CEP

Digite o CEP e clique em **Buscar**. O ViaCEP preenche logradouro, bairro, estado e cidade. O município é associado pelo código IBGE ao ID interno do banco.

Número e complemento do imóvel continuam a ser preenchidos pelo usuário. Se o CEP não existir, a conexão falhar ou a cidade não estiver na base local, a tela informa o problema e permite preenchimento manual. O cadastro exige uma cidade válida da base.

## Visualizar e editar

Use os ícones da coluna Ações. Na visualização, os campos ficam desabilitados. Na edição, altere os dados e clique em **Salvar alterações**.

A API usa atualização completa por PUT: campos opcionais omitidos são limpos, com exceção do status, que mantém o valor atual quando não enviado. O formulário envia seus campos e preserva site e observações já existentes.

## Ativar ou inativar

Em **Mais ações**, selecione **Desativar fornecedor** ou **Ativar fornecedor**. A operação muda o status sem apagar os dados. O dashboard e o filtro de ativos refletem o resultado.

## Excluir

Em **Mais ações → Excluir fornecedor**, confira o nome, digite **EXCLUIR** e clique em **Confirmar exclusão**.

Cancelar ou pressionar Esc antes do envio fecha a caixa sem excluir. A exclusão é permanente no banco e não possui restauração pela interface. Se houver erro, a caixa mantém a mensagem e permite nova tentativa.

## Configurações

### Alterar senha

Informe a senha atual, a nova senha e sua confirmação. A nova senha deve ter de **3 a 128 caracteres**. Somente a senha da conta autenticada é alterada.

### Novo usuário

Preencha nome completo, login, senha e confirmação. O login deve ter de 3 a 100 caracteres, usando letras, números, ponto, hífen ou sublinhado. A senha deve ter de 3 a 128 caracteres.

Após o cadastro, a sessão continua na conta atual. O novo usuário poderá fazer login separadamente. Todos os usuários ativos têm as mesmas permissões na versão atual.

### Senha esquecida

A interface de troca exige a senha atual. Para recuperação local sem a senha antiga, o responsável pela instalação utiliza o [comando de redefinição](../api-fornecedores/docs/OPERACAO.md).

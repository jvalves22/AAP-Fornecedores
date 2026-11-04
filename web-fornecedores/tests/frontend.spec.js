import { test, expect } from '@playwright/test';

const city = {id:3550308,nome:'São Paulo',uf:'SP',codigoIbge:'3550308'};
const supplier = {id:1,tipoPessoa:'JURIDICA',nomeRazaoSocial:'Fornecedor XYZ Comércio Ltda.',nomeFantasia:'XYZ Comércio',cnpj:'12345678000190',inscricaoEstadual:'',email:'contato@xyz.com.br',telefone:'',celular:'',nomeContato:'',setor:'Setor 1',logradouro:'Rua Exemplo',numero:'10',bairro:'Centro',cep:'01001000',complemento:'',cidadeId:city.id,cidade:city,ativo:true,criadoEm:new Date().toISOString()};
async function fixture(page,{count=8}={}) {
  let rows = Array.from({length:count},(_,index) => ({...supplier,id:index+1,nomeFantasia:index === 1 ? 'Busca Fantasia' : supplier.nomeFantasia,ativo:index !== 1,setor:`Setor ${index%4+1}`}));
  const writes=[];
  let senhaAtual="senha-teste";
  const logins=new Set(["teste"]);
  await page.route('**/api/v1/**',async route => {
    const req=route.request(), url=new URL(req.url()), path=url.pathname;
    const reply=(data,status=200) => route.fulfill({status,json:data});
    if(path.endsWith('/auth/login')) return reply({token:'test-session',usuario:{id:1,nome:'Usuario',login:'teste'}});
    if(req.headers().authorization !== 'Bearer test-session') return reply({erro:'Autenticação necessária.'},401);
    if(path.endsWith('/usuarios') && req.method()==='POST') {
      const data=req.postDataJSON();writes.push({method:'POST',data});
      if(logins.has(data.login.toLowerCase()))return reply({erro:'Este login já está em uso.'},400);
      logins.add(data.login.toLowerCase());return reply({id:10,nome:data.nome,login:data.login.toLowerCase(),ativo:true},201);
    }
    if(path.endsWith('/usuarios/me/senha')) {
      const data=req.postDataJSON();writes.push({method:'PATCH',data});
      if(data.senhaAtual !== senhaAtual)return reply({erro:'A senha atual está incorreta.'},400);
      senhaAtual=data.novaSenha;return reply({mensagem:'Senha alterada com sucesso.'});
    }
    if(req.method() === 'DELETE') {
      const id=Number(path.split('/').at(-1));const data=req.postDataJSON();
      writes.push({method:'DELETE',id,data});rows=rows.filter(row=>row.id!==id);
      return reply({mensagem:'Fornecedor excluído com sucesso.'});
    }
    if(path.endsWith('/cidades')) return reply([city]);
    if(path.endsWith('/ativo')) {const id=Number(path.split('/').at(-2));const data=req.postDataJSON();writes.push({method:'PATCH',data});rows=rows.map(row => row.id === id ? {...row,...data} : row);return reply(rows.find(row => row.id === id));}
    if(req.method() === 'POST' || req.method() === 'PUT') {const data=req.postDataJSON();writes.push({method:req.method(),data});const row={...data,id:req.method()==='POST'?99:Number(path.split('/').at(-1)),cidade:city};rows=req.method()==='POST'?[...rows,row]:rows.map(item => item.id===row.id?row:item);return reply(row,req.method()==='POST'?201:200);}
    if(/\/fornecedores\/\d+$/.test(path)) return reply(rows.find(row => row.id===Number(path.split('/').at(-1))));
    return reply({dados:rows,paginacao:{pagina:1,limite:100,total:rows.length,totalPaginas:rows.length?1:0}});
  });
  return {writes};
}
async function login(page) {
  await page.goto('/');
  await page.getByRole('textbox',{name:'Usuário',exact:true}).fill('teste');
  await page.getByLabel('Senha',{exact:true}).fill('senha-teste');
  await page.getByRole('button',{name:'Entrar',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Dashboard - Visão Geral'})).toBeVisible();
}
async function screenshot(page,name) {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({path:`test-results/${name}.png`,fullPage:true});
}

test('telas do Figma, busca multicoluna, filtros, paginação e ativos',async({page}) => {
  const {writes}=await fixture(page);
  await page.goto('/');await screenshot(page,'login-desktop');
  await login(page);await screenshot(page,'dashboard-desktop');
  await page.getByRole('button',{name:'Fornecedores',exact:true}).click();
  await expect(page.locator('.supplier-table tbody tr')).toHaveCount(6);
  await screenshot(page,'fornecedores-desktop');
  await page.getByRole('button',{name:'Próxima',exact:true}).click();
  await expect(page.getByText('Mostrando 7-8 de 8')).toBeVisible();
  await page.getByRole('textbox',{name:'Pesquisar fornecedores'}).fill('Busca Fantasia');
  await expect(page.locator('.supplier-table tbody tr')).toHaveCount(1);
  await expect(page.getByText('Mostrando 1-1 de 1')).toBeVisible();
  await page.getByRole('textbox',{name:'Pesquisar fornecedores'}).fill('');
  await page.getByRole('button',{name:'Filtros',exact:true}).click();
  await page.getByRole('combobox',{name:'Status',exact:true}).selectOption('false');
  await expect(page.locator('.supplier-table tbody tr')).toHaveCount(1);
  await page.getByRole('button',{name:/Mais ações/}).click();
  await page.getByRole('button',{name:'Ativar fornecedor',exact:true}).click();
  await expect(page.getByText('Status do fornecedor atualizado.')).toBeVisible();
  expect(writes[0]).toEqual({method:'PATCH',data:{ativo:true}});
  await page.getByRole('button',{name:'Limpar filtros',exact:true}).click();
  await page.getByRole('button',{name:'Cadastrar',exact:true}).click();
  await screenshot(page,'cadastro-desktop');
  await page.setViewportSize({width:390,height:844});await screenshot(page,'cadastro-mobile');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test('cadastro e edição enviam o contrato do backend e consulta seleciona cidade',async({page}) => {
  const {writes}=await fixture(page);
  await page.route('https://viacep.com.br/**',route => route.fulfill({json:{logradouro:'Praça da Sé',bairro:'Sé',localidade:'São Paulo',uf:'SP',ibge:'3550308'}}));
  await login(page);await page.getByRole('button',{name:'Fornecedores',exact:true}).click();
  await page.getByRole('button',{name:'Cadastrar',exact:true}).click();
  await page.getByLabel('Razão Social').fill('Nova Empresa Ltda.');
  await page.getByLabel('CNPJ',{exact:false}).fill('12.345.678/0001-90');
  await page.getByLabel('E-mail',{exact:true}).fill('nova@empresa.com.br');
  await page.getByLabel('Setor',{exact:true}).fill('Manutenção industrial');
  await page.getByRole('textbox',{name:'CEP',exact:true}).fill('01001-000');
  await page.getByRole('button',{name:'Buscar',exact:true}).click();
  await expect(page.getByLabel('Logradouro',{exact:false})).toHaveValue('Praça da Sé');
  await page.getByLabel('Número',{exact:false}).fill('20');
  await page.getByRole('button',{name:'Cadastrar',exact:true}).click();
  await expect(page.getByText('Fornecedor salvo com sucesso.')).toBeVisible();
  expect(writes[0].data).toMatchObject({tipoPessoa:'JURIDICA',cnpj:'12345678000190',cep:'01001000',cidadeId:city.id,nomeRazaoSocial:'Nova Empresa Ltda.',setor:'Manutenção industrial',ativo:true});
  await page.getByRole('button',{name:/Editar Fornecedor XYZ/}).first().click();
  await expect(page.getByRole('heading',{name:'Editar Fornecedor'})).toBeVisible();
  await expect(page.getByLabel('Setor',{exact:true})).toHaveValue('Setor 1');
  await page.getByLabel('Setor',{exact:true}).fill('Elétrica');
  await page.getByLabel('Nome Fantasia',{exact:true}).fill('Fantasia Atualizada');
  await page.getByRole('button',{name:'Salvar alterações'}).click();
  await expect(page.getByText('Fantasia Atualizada')).toBeVisible();
  expect(writes[1].method).toBe('PUT');expect(writes[1].data.cidade).toBeUndefined();expect(writes[1].data.setor).toBe('Elétrica');
});

test('login inválido, sessão expirada e estados sem dados',async({page}) => {
  await fixture(page,{count:0});
  await page.route('**/api/v1/auth/login',route => route.fulfill({status:401,json:{erro:'Login ou senha inválidos.'}}));
  await page.goto('/');await page.getByLabel('Usuário',{exact:true}).fill('teste');await page.getByLabel('Senha',{exact:true}).fill('errada');await page.getByRole('button',{name:'Entrar',exact:true}).click();
  await expect(page.getByRole('alert')).toHaveText('Login ou senha inválidos.');
  await page.unroute('**/api/v1/auth/login');
  await login(page);await expect(page.getByText('Nenhum cadastro recente.')).toBeVisible();
  await page.getByRole('button',{name:'Fornecedores',exact:true}).click();
  await expect(page.getByText(/Nenhum fornecedor cadastrado. Clique/)).toBeVisible();
  await page.route('**/api/v1/fornecedores?**',route => route.fulfill({status:401,json:{erro:'Sessão expirada'}}));
  await page.reload();
  await expect(page.getByRole('heading',{name:'Bem-Vindo!'})).toBeVisible();
  await expect(page.getByRole('alert')).toHaveText('Sua sessão expirou. Faça login novamente.');
  expect(await page.evaluate(() => sessionStorage.getItem('planeta.session'))).toBeNull();
});

test('ativos locais carregam e layout usa escala compacta',async({page}) => {
  await fixture(page);await login(page);
  const assets=await page.locator('img').evaluateAll(images => images.map(image => ({src:image.getAttribute('src'),loaded:image.complete&&image.naturalWidth>0,width:image.getBoundingClientRect().width,height:image.getBoundingClientRect().height})));
  expect(assets.every(asset => asset.loaded && asset.src.startsWith('/assets/'))).toBeTruthy();
  const sidebar=await page.locator('.sidebar').boundingBox();expect(sidebar.width).toBe(240);
  const logo=await page.locator('.sidebar-logo').boundingBox();expect(logo.width).toBe(176);expect(logo.width/logo.height).toBeCloseTo(262.5/96,1);
  await page.getByRole('button',{name:'Fornecedores',exact:true}).click();
  const search=await page.locator('.search-box').boundingBox();expect(search.x).toBeGreaterThanOrEqual(sidebar.width);expect(search.height).toBe(42);
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});


test('troca de senha em Configurações e tratamento de erro sem encerrar sessão',async({page})=>{
  const {writes}=await fixture(page);await login(page);
  await page.getByRole('button',{name:'Configurações',exact:true}).click();
  await page.getByLabel('Senha atual',{exact:false}).fill('incorreta');
  await page.getByLabel(/^Nova senha/).fill('abc');
  await page.getByLabel('Confirmar nova senha',{exact:false}).fill('xyz');
  await page.getByRole('button',{name:'Alterar senha',exact:true}).click();
  await expect(page.getByRole('alert')).toHaveText('A confirmação da nova senha não confere.');
  expect(writes).toHaveLength(0);
  await page.getByLabel('Confirmar nova senha',{exact:false}).fill('abc');
  await page.getByRole('button',{name:'Alterar senha',exact:true}).click();
  await expect(page.getByRole('alert')).toHaveText('A senha atual está incorreta.');
  await page.getByLabel('Senha atual',{exact:false}).fill('senha-teste');
  await page.getByRole('button',{name:'Alterar senha',exact:true}).click();
  await expect(page.getByRole('status')).toHaveText('Senha alterada com sucesso.');
  await expect(page.getByLabel(/^Nova senha/)).toHaveValue('');
  expect(writes.at(-1).data).toEqual({senhaAtual:'senha-teste',novaSenha:'abc',confirmacaoSenha:'abc'});
  await screenshot(page,'configuracoes-senha');
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});

test('CEP inválido, inexistente e falha no ViaCEP permitem preenchimento manual',async({page})=>{
  await fixture(page);let consultas=0;let modo='inexistente';
  await page.route('https://viacep.com.br/**',route=>{consultas++;return modo==='inexistente'?route.fulfill({json:{erro:true}}):route.fulfill({status:503,body:'indisponivel'});});
  await login(page);await page.getByRole('button',{name:'Fornecedores',exact:true}).click();await page.getByRole('button',{name:'Cadastrar',exact:true}).click();
  await page.getByRole('textbox',{name:'CEP',exact:true}).fill('123');await page.getByRole('button',{name:'Buscar',exact:true}).click();
  await expect(page.getByRole('alert')).toHaveText('Informe um CEP com 8 dígitos.');expect(consultas).toBe(0);
  await page.getByRole('textbox',{name:'CEP',exact:true}).fill('99999999');await page.getByRole('button',{name:'Buscar',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('CEP não encontrado');
  modo='indisponivel';await page.getByRole('button',{name:'Buscar',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Não foi possível consultar o ViaCEP');
  await page.getByLabel('Logradouro',{exact:false}).fill('Endereço manual');await expect(page.getByLabel('Logradouro',{exact:false})).toHaveValue('Endereço manual');
});


test('Apenas Ativos combina com busca e reinicia a paginação',async({page})=>{
  await fixture(page);await login(page);await page.getByRole('button',{name:'Fornecedores',exact:true}).click();
  await page.getByRole('button',{name:'Próxima',exact:true}).click();
  await page.getByRole('checkbox',{name:'Apenas Ativos'}).check();
  await expect(page.getByText('Mostrando 1-6 de 7')).toBeVisible();
  await page.getByRole('textbox',{name:'Pesquisar fornecedores'}).fill('Busca Fantasia');
  await expect(page.locator('.supplier-table tbody tr')).toHaveCount(0);
  await page.getByRole('checkbox',{name:'Apenas Ativos'}).uncheck();
  await expect(page.locator('.supplier-table tbody tr')).toHaveCount(1);
  await expect(page.getByText('Mostrando 1-1 de 1')).toBeVisible();
});

test('exclusão pede texto de confirmação, permite cancelar e atualiza a lista',async({page})=>{
  const {writes}=await fixture(page);await login(page);await page.getByRole('button',{name:'Fornecedores',exact:true}).click();
  async function abrir(){await page.getByRole('button',{name:/Mais ações/}).first().click();await page.getByRole('button',{name:'Excluir fornecedor',exact:true}).click();}
  await abrir();const dialog=page.getByRole('dialog',{name:'Excluir fornecedor?'});
  await expect(dialog).toBeVisible();await expect(dialog.getByRole('button',{name:'Confirmar exclusão'})).toBeDisabled();
  await dialog.getByRole('textbox').fill('sim');await expect(dialog.getByRole('button',{name:'Confirmar exclusão'})).toBeDisabled();
  await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();await expect(dialog).not.toBeVisible();expect(writes).toHaveLength(0);
  await abrir();await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();expect(writes).toHaveLength(0);
  await abrir();await dialog.getByRole('textbox').fill('EXCLUIR');await screenshot(page,'confirmar-exclusao');
  await dialog.getByRole('button',{name:'Confirmar exclusão'}).click();
  await expect(dialog).not.toBeVisible();await expect(page.getByText('Fornecedor excluído com sucesso.')).toBeVisible();
  expect(writes).toEqual([{method:'DELETE',id:1,data:{confirmacao:'EXCLUIR'}}]);
  await expect(page.getByText('Mostrando 1-6 de 7')).toBeVisible();
});

test('falha na exclusão mantém o fornecedor e permite tentar novamente',async({page})=>{
  const {writes}=await fixture(page);await login(page);await page.getByRole('button',{name:'Fornecedores',exact:true}).click();
  await page.route('**/api/v1/fornecedores/1',route=>route.request().method()==='DELETE'?route.fulfill({status:500,json:{erro:'Não foi possível excluir agora.'}}):route.fallback());
  await page.getByRole('button',{name:/Mais ações/}).first().click();await page.getByRole('button',{name:'Excluir fornecedor',exact:true}).click();
  const dialog=page.getByRole('dialog');await dialog.getByRole('textbox').fill('EXCLUIR');await dialog.getByRole('button',{name:'Confirmar exclusão'}).click();
  await expect(dialog.getByRole('alert')).toHaveText('Não foi possível excluir agora.');
  await expect(dialog.getByRole('button',{name:'Confirmar exclusão'})).toBeEnabled();expect(writes).toHaveLength(0);
  await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();await expect(page.getByText('Mostrando 1-6 de 8')).toBeVisible();
});

test('layout legível em notebooks e monitores, formulário sem Cargo',async({page})=>{
  await fixture(page);await login(page);
  for(const [width,height] of [[1024,768],[1280,720],[1366,768],[1440,900],[1920,1080],[2560,1440]]){
    await page.setViewportSize({width,height});await page.getByRole('button',{name:'Dashboard',exact:true}).click();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    await page.getByRole('button',{name:'Fornecedores',exact:true}).click();
    await expect(page.getByRole('checkbox',{name:'Apenas Ativos'})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    await page.getByRole('button',{name:'Cadastrar',exact:true}).click();
    await expect(page.getByText('Cargo',{exact:true})).toHaveCount(0);
    expect(await page.getByLabel('Razão Social').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(14);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    if([1280,1366,2560].includes(width))await screenshot(page,'cadastro-'+width);
    await page.getByRole('button',{name:'Cancelar',exact:true}).click();
  }
});


test('máscaras durante digitação, edição e envio sem pontuação',async({page})=>{
  const {writes}=await fixture(page);await login(page);await page.getByRole('button',{name:'Fornecedores',exact:true}).click();
  await page.getByRole('button',{name:/Editar Fornecedor XYZ/}).first().click();
  const cnpj=page.getByLabel('CNPJ',{exact:false});await expect(cnpj).toHaveValue('12.345.678/0001-90');
  await cnpj.fill('12ABC34501DE35');await expect(cnpj).toHaveValue('12.ABC.345/01DE-35');
  const cep=page.getByRole('textbox',{name:'CEP',exact:true});await expect(cep).toHaveValue('01001-000');
  const telefone=page.getByLabel('Telefone',{exact:true});await telefone.fill('1134567890');await expect(telefone).toHaveValue('(11) 3456-7890');
  const celular=page.getByLabel('Celular',{exact:true});await celular.fill('11987654321');await expect(celular).toHaveValue('(11) 98765-4321');
  await page.getByRole('button',{name:'Salvar alterações'}).click();await expect(page.getByText('Fornecedor salvo com sucesso.')).toBeVisible();
  expect(writes[0].data).toMatchObject({cnpj:'12ABC34501DE35',cep:'01001000',telefone:'1134567890',celular:'11987654321'});
  await page.getByRole('button',{name:/Editar Fornecedor XYZ/}).first().click();
  await page.getByRole('combobox',{name:'Tipo de Fornecedor'}).selectOption('FISICA');
  const cpf=page.getByLabel('CPF',{exact:false});await cpf.fill('52998224725');await expect(cpf).toHaveValue('529.982.247-25');
  const rg=page.getByLabel('RG',{exact:true});await rg.fill('12345678X');await expect(rg).toHaveValue('12.345.678-X');
  await cpf.fill('');await expect(cpf).toHaveValue('');await cpf.fill('52998224725');
  await page.getByRole('button',{name:'Salvar alterações'}).click();await expect(page.getByText('Fornecedor salvo com sucesso.')).toBeVisible();
  expect(writes[1].data).toMatchObject({cpf:'52998224725',rg:'12345678X',cnpj:''});
});

test('sair pelo dashboard e pelo rodapé lateral limpa a sessão',async({page})=>{
  await fixture(page);await login(page);
  await page.locator('.user-menu').getByRole('button',{name:'Sair',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Bem-Vindo!'})).toBeVisible();
  expect(await page.evaluate(()=>sessionStorage.getItem('planeta.session'))).toBeNull();
  await login(page);await page.getByRole('button',{name:'Fornecedores',exact:true}).click();
  await page.locator('.sidebar-footer').getByRole('button',{name:'Sair da conta'}).click();
  await expect(page.getByRole('heading',{name:'Bem-Vindo!'})).toBeVisible();
  expect(await page.evaluate(()=>sessionStorage.getItem('planeta.session'))).toBeNull();
  await page.reload();await expect(page.getByRole('heading',{name:'Bem-Vindo!'})).toBeVisible();
});

test('criar novo usuário valida confirmação, informa duplicidade e mantém conta atual',async({page})=>{
  const {writes}=await fixture(page);await login(page);await page.getByRole('button',{name:'Configurações',exact:true}).click();
  const form=page.getByRole('region',{name:'Novo usuário',exact:true});
  await form.getByLabel('Nome completo').fill('Maria Silva');await form.getByLabel('Login do novo usuário').fill('teste');
  await form.getByLabel(/^Senha do novo usuário/).fill('abc');await form.getByLabel(/^Confirmar senha do novo usuário/).fill('xyz');
  await form.getByRole('button',{name:'Criar usuário'}).click();await expect(form.getByRole('alert')).toHaveText('A confirmação da senha não confere.');expect(writes).toHaveLength(0);
  await form.getByLabel(/^Confirmar senha do novo usuário/).fill('abc');await form.getByRole('button',{name:'Criar usuário'}).click();
  await expect(form.getByRole('alert')).toHaveText('Este login já está em uso.');
  await form.getByLabel('Login do novo usuário').fill('maria.silva');await form.getByRole('button',{name:'Criar usuário'}).click();
  await expect(form.getByRole('status')).toHaveText('Usuário maria.silva criado com sucesso.');
  expect(writes.at(-1).data).toEqual({nome:'Maria Silva',login:'maria.silva',senha:'abc'});
  await expect(form.getByLabel(/^Senha do novo usuário/)).toHaveValue('');
  expect(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('planeta.session')).usuario.login)).toBe('teste');
  await screenshot(page,'configuracoes-usuarios');
});

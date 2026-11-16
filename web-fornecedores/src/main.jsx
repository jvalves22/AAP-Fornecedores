import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/600.css';
import '@fontsource/roboto/700.css';
import '@fontsource/roboto-mono/400.css';
import '@fontsource/roboto-mono/500.css';
import '@fontsource/roboto-mono/700.css';
import { loadSuppliers, readSession, request, saveSession } from './api';
import { maskedFields, normalizeField, formatField } from './masks';
import './styles.css';

const ASSETS = '/assets/';
const STATES = { AC:'Acre', AL:'Alagoas', AP:'Amapá', AM:'Amazonas', BA:'Bahia', CE:'Ceará', DF:'Distrito Federal', ES:'Espírito Santo', GO:'Goiás', MA:'Maranhão', MT:'Mato Grosso', MS:'Mato Grosso do Sul', MG:'Minas Gerais', PA:'Pará', PB:'Paraíba', PR:'Paraná', PE:'Pernambuco', PI:'Piauí', RJ:'Rio de Janeiro', RN:'Rio Grande do Norte', RS:'Rio Grande do Sul', RO:'Rondônia', RR:'Roraima', SC:'Santa Catarina', SP:'São Paulo', SE:'Sergipe', TO:'Tocantins' };
const EMPTY = { tipoPessoa:'JURIDICA', nomeRazaoSocial:'', nomeFantasia:'', cpf:'', cnpj:'', inscricaoEstadual:'', rg:'', email:'', telefone:'', celular:'', nomeContato:'', setor:'', logradouro:'', numero:'', complemento:'', bairro:'', cep:'', cidadeId:'', ativo:true };
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const digits = value => value.replace(/\D/g, '');
function documentLabel(row) {
  if (row.tipoPessoa === 'FISICA') return (row.cpf || '').replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  return (row.cnpj || '').replace(/^(.{2})(.{3})(.{3})(.{4})(.{2})$/, '$1.$2.$3/$4-$5');
}
function Icon({ name, ...props }) { return <img src={`${ASSETS}${name}.png`} alt="" {...props} />; }
function ErrorNotice({ children, onRetry }) { return <div className="error" role="alert">{children}{onRetry && <button onClick={onRetry}>Tentar novamente</button>}</div>; }

function Login({ onLogin, expired }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(expired ? 'Sua sessão expirou. Faça login novamente.' : '');
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    const fields = new FormData(event.currentTarget);
    try {
      const result = await request('/auth/login', { method:'POST', body:{ login:fields.get('login').trim(), senha:fields.get('senha') } });
      saveSession(result); onLogin(result);
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  return <main className="login-page"><section className="login-card">
    <img className="login-logo" src={`${ASSETS}logo-login.png`} alt="Grupo Planeta — Soluções Industriais" />
    <h1>Bem-Vindo!</h1><p className="login-subtitle">Faça login para acessar sua conta</p>
    <form onSubmit={submit}>
      <input name="login" aria-label="Usuário" placeholder="Usuário" autoComplete="username" maxLength={100} required />
      <input name="senha" aria-label="Senha" placeholder="Senha" type="password" autoComplete="current-password" required />
      {error && <ErrorNotice>{error}</ErrorNotice>}
      <button className="primary login-submit" disabled={busy}>{busy ? 'Entrando...' : 'Entrar'}</button>
    </form>
  </section></main>;
}

function Sidebar({ page, navigate, onLogout }) {
  return <aside className="sidebar"><img className="sidebar-logo" src={`${ASSETS}logo-sidebar.png`} alt="Grupo Planeta — Soluções Industriais" />
    <nav aria-label="Navegação principal">{[['dashboard','Dashboard'],['fornecedores','Fornecedores'],['configuracoes','Configurações']].map(([key,label]) => <button key={key} className={page === key ? 'active' : ''} aria-current={page === key ? 'page' : undefined} onClick={() => navigate(key)}>
      <Icon name={key === 'dashboard' ? (page === key ? 'dashboard-active' : 'dashboard') : key === 'fornecedores' ? (page === key ? 'suppliers-active' : 'suppliers') : 'settings'} /><span>{label}</span>
    </button>)}</nav><div className="sidebar-footer"><button className="sidebar-logout" onClick={onLogout} aria-label="Sair da conta"><span aria-hidden="true">↪</span><span>Sair</span></button></div></aside>;
}

function Dashboard({ rows, user, onLogout }) {
  const now = new Date();
  const recent = [...rows].sort((a,b) => new Date(b.criadoEm) - new Date(a.criadoEm));
  const month = rows.filter(row => { const date = new Date(row.criadoEm); return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear(); }).length;
  const sectors = Object.entries(rows.reduce((acc,row) => { const key = row.setor || 'Não informado'; acc[key] = (acc[key] || 0) + 1; return acc; }, {})).sort((a,b) => b[1]-a[1]);
  const states = Object.entries(rows.reduce((acc,row) => { const uf = row.cidade?.uf || 'Não informado'; acc[uf] = (acc[uf] || 0) + 1; return acc; }, {})).sort((a,b) => b[1]-a[1]);
  const colors = ['#4285f4','#34a853','#fbbc05','#ea4335','#8e5ac8','#00acc1'];
  let angle = 0;
  const gradient = sectors.map(([,count],index) => { const start = angle; angle += count / rows.length * 360; return `${colors[index % colors.length]} ${start}deg ${angle}deg`; }).join(',');
  return <div className="dashboard-page">
    <div className="user-menu"><span className="user-identity">Olá, <strong>{user.nome}</strong></span><button className="logout-dashboard" onClick={onLogout}>Sair</button></div>
    <h1>Dashboard - Visão Geral</h1>
    <div className="metrics">{[['Fornecedores Cadastrados',rows.length],['Fornecedores Ativos',rows.filter(row => row.ativo).length],['Novos Cadastros (Mês atual)',month]].map(([label,value]) => <article className="metric card" key={label}><h2>{label}</h2><strong>{value}</strong></article>)}</div>
    <div className="dashboard-panels">
      <article className="card sectors"><h2>Fornecedores Por Setores</h2>{rows.length ? <><div className="donut" role="img" aria-label={sectors.map(([label,count]) => `${label}: ${count}`).join(', ')} style={{ background:`conic-gradient(${gradient})` }} /><div className="legend">{sectors.map(([label,count],index) => <span key={label} title={`${count} fornecedores`}><i style={{ background:colors[index % colors.length] }} />{label}</span>)}</div></> : <p className="empty">Nenhum fornecedor cadastrado.</p>}</article>
      <article className="card states"><h2>Fornecedores Por Estado</h2><div className="state-table"><table><thead><tr><th>Estados</th><th>Total</th></tr></thead><tbody>{states.map(([uf,count]) => <tr key={uf}><td>{STATES[uf] || uf}</td><td>{count}</td></tr>)}</tbody></table>{!states.length && <p className="empty">Sem dados.</p>}</div></article>
      <article className="card recent"><h2>Cadastrados Recentemente</h2><table><thead><tr><th>Razão Social</th><th>CNPJ</th></tr></thead><tbody>{recent.slice(0,2).map(row => <tr key={row.id}><td>{row.nomeRazaoSocial}</td><td>{documentLabel(row)}</td></tr>)}</tbody></table>{!recent.length && <p className="empty">Nenhum cadastro recente.</p>}</article>
    </div>
  </div>;
}

function SupplierList({ rows, onOpen, onCreate, onStatus, onDelete, busyId }) {
  const [search,setSearch] = useState('');
  const [filterOpen,setFilterOpen] = useState(false);
  const [status,setStatus] = useState('');
  const [type,setType] = useState('');
  const [uf,setUf] = useState('');
  const [page,setPage] = useState(1);
  const [action,setAction] = useState(null);
  const filtered = useMemo(() => rows.filter(row => {
    const term = normalize(search).trim();
    const text = normalize([row.nomeRazaoSocial,row.nomeFantasia,row.cnpj,row.cpf,documentLabel(row),row.email,row.telefone,row.celular,row.cidade?.nome].join(' '));
    return (!term || text.includes(term) || (digits(term).length > 2 && [row.cnpj,row.cpf,row.telefone,row.celular].some(value => digits(value || '').includes(digits(term))))) && (!status || String(row.ativo) === status) && (!type || row.tipoPessoa === type) && (!uf || row.cidade?.uf === uf);
  }),[rows,search,status,type,uf]);
  const totalPages = Math.max(1,Math.ceil(filtered.length/6));
  const current = Math.min(page,totalPages);
  useEffect(() => { setPage(1); },[search,status,type,uf]);
  const slice = filtered.slice((current-1)*6,current*6);
  return <div className="suppliers-page">
    <header className="page-header"><h1>Fornecedores</h1><div className="header-actions"><button className="primary" onClick={onCreate}>Cadastrar</button><button className="secondary" onClick={() => setFilterOpen(!filterOpen)} aria-expanded={filterOpen}><Icon name="filter" />Filtros</button></div></header>
    <div className="supplier-toolbar"><div className="search-box"><Icon name="search" /><input aria-label="Pesquisar fornecedores" placeholder="Pesquisar por Razão Social, Nome Fantasia, CNPJ, e-Mail, Telefone..." value={search} onChange={event => setSearch(event.target.value)} /></div><label className="active-only"><input type="checkbox" checked={status === 'true'} onChange={event => setStatus(event.target.checked ? 'true' : '')} />Apenas Ativos</label></div>
    {filterOpen && <section className="filters" aria-label="Filtros de fornecedores"><label>Status<select value={status} onChange={event => setStatus(event.target.value)}><option value="">Todos</option><option value="true">Ativos</option><option value="false">Inativos</option></select></label><label>Tipo<select value={type} onChange={event => setType(event.target.value)}><option value="">Todos</option><option value="JURIDICA">Pessoa jurídica</option><option value="FISICA">Pessoa física</option></select></label><label>Estado<select value={uf} onChange={event => setUf(event.target.value)}><option value="">Todos</option>{Object.keys(STATES).map(key => <option key={key}>{key}</option>)}</select></label><button className="secondary" onClick={() => { setStatus(''); setType(''); setUf(''); }}>Limpar filtros</button></section>}
    <section className="supplier-table-panel"><div className="table-scroll"><table className="supplier-table"><colgroup><col style={{width:'19.3%'}}/><col style={{width:'14.4%'}}/><col style={{width:'18.86%'}}/><col style={{width:'15.69%'}}/><col style={{width:'11.7%'}}/><col style={{width:'20.05%'}}/></colgroup><thead><tr>{['Razão Social','Fantasia','CNPJ','Cidade','Status','Ações'].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{slice.map(row => <tr key={row.id}><td>{row.nomeRazaoSocial}</td><td>{row.nomeFantasia || '—'}</td><td>{documentLabel(row)}</td><td>{row.cidade ? `${row.cidade.nome} (${row.cidade.uf})` : '—'}</td><td>{row.ativo ? 'Ativo' : 'Inativo'}</td><td><div className="row-actions"><button aria-label={`Visualizar ${row.nomeRazaoSocial}`} onClick={() => onOpen(row.id,true)}><Icon name="view" /></button><button aria-label={`Editar ${row.nomeRazaoSocial}`} onClick={() => onOpen(row.id,false)}><Icon name="edit" /></button><div className="action-anchor"><button className="more" data-supplier-actions={row.id} aria-label={`Mais ações de ${row.nomeRazaoSocial}`} aria-expanded={action === row.id} onClick={() => setAction(action === row.id ? null : row.id)}>•••</button>{action === row.id && <div className="action-menu"><button disabled={busyId === row.id} onClick={() => { setAction(null); onStatus(row); }}>{row.ativo ? 'Desativar' : 'Ativar'} fornecedor</button><button className="danger-text" disabled={busyId === row.id} onClick={() => {setAction(null);onDelete(row);}}>Excluir fornecedor</button></div>}</div></div></td></tr>)}</tbody></table></div>
      {!slice.length && <p className="empty list-empty">{rows.length ? 'Nenhum fornecedor encontrado para esta pesquisa.' : 'Nenhum fornecedor cadastrado. Clique em Cadastrar para começar.'}</p>}
      <footer className="pagination"><div><button disabled={current === 1} onClick={() => setPage(current-1)}><Icon name="next" className="previous" />Anterior</button>{Array.from({length:Math.min(3,totalPages)},(_,i) => Math.max(1,Math.min(current-1,totalPages-2))+i).map(number => <button className={number === current ? 'selected' : ''} aria-label={`Página ${number}`} aria-current={number === current ? 'page' : undefined} key={number} onClick={() => setPage(number)}>{number}</button>)}<button disabled={current === totalPages} onClick={() => setPage(current+1)}>Próxima<Icon name="next" /></button></div><span>Mostrando {filtered.length ? (current-1)*6+1 : 0}-{Math.min(current*6,filtered.length)} de {filtered.length}</span></footer>
    </section>
  </div>;
}

function MaskedInput({ name, value, onValueChange, ...props }) {
  function change(event) {
    const input=event.target;
    const typed=input.value;
    const position=input.selectionStart ?? typed.length;
    const atEnd=position === typed.length;
    const significant=name === 'cnpj' || name === 'rg' ? /[a-z0-9]/i : /[0-9]/;
    const count=[...typed.slice(0,position)].filter(char=>significant.test(char)).length;
    const raw=normalizeField(name,typed);
    onValueChange(raw);
    requestAnimationFrame(()=>{
      if(document.activeElement !== input) return;
      const formatted=input.value;
      let caret=0, seen=0;
      if(atEnd) caret=formatted.length;
      else while(caret < formatted.length && seen < count) {if(significant.test(formatted[caret]))seen++;caret++;}
      input.setSelectionRange(caret,caret);
    });
  }
  return <input {...props} name={name} value={formatField(name,value)} onChange={change} />;
}

function Field({ label, required, children, ...props }) { return <label className="field">{label && <span>{label}{required && <b> *</b>}</span>}{children || <input required={required} {...props} />}</label>; }

function SupplierForm({ initial, readOnly, onCancel, onSaved }) {
  const [form,setForm] = useState(() => ({ ...EMPTY,...initial }));
  const [uf,setUf] = useState(initial?.cidade?.uf || '');
  const [citySearch,setCitySearch] = useState(initial?.cidade?.nome || '');
  const [cities,setCities] = useState(initial?.cidade ? [initial.cidade] : []);
  const [cityOpen,setCityOpen] = useState(false);
  const [cityError,setCityError] = useState('');
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  const [cepBusy,setCepBusy] = useState(false);
  const cepController = useRef(null);
  useEffect(() => () => cepController.current?.abort(),[]);
  useEffect(() => {
    if (readOnly || !uf) return;
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try { const data = await request(`/cidades?uf=${uf}&busca=${encodeURIComponent(citySearch)}`,{signal:controller.signal}); setCities(data); setCityError(''); }
      catch(error) { if(error.name !== 'AbortError') setCityError(error.message); }
    },250);
    return () => { clearTimeout(timeout); controller.abort(); };
  },[uf,citySearch,readOnly]);
  function update(name,value) { setForm(current => ({...current,[name]:value})); }
  const field = (name,label,options={}) => maskedFields.has(name)
    ? <Field label={label} required={options.required}><MaskedInput name={name} value={form[name] ?? ''} onValueChange={value => update(name,value)} maxLength={20} {...options} /></Field>
    : <Field label={label} value={form[name] ?? ''} onChange={event => update(name,event.target.value)} maxLength={150} {...options} />;
  function changeCep(value) {
    cepController.current?.abort(); cepController.current = null;
    setCepBusy(false); update('cep',normalizeField('cep',value));
  }
  async function lookupCep() {
    const cep = digits(form.cep);
    if (cep.length !== 8) { setError('Informe um CEP com 8 dígitos.'); return; }
    cepController.current?.abort();
    const controller = new AbortController(); cepController.current = controller;
    setCepBusy(true); setError(''); setCityError('');
    const timeout = setTimeout(() => controller.abort(),12000);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`,{signal:controller.signal});
      if (!response.ok) throw new Error('Não foi possível consultar o ViaCEP. Tente novamente ou preencha o endereço manualmente.');
      const data = await response.json();
      if (data.erro) throw new Error('CEP não encontrado. Confira o CEP ou preencha o endereço manualmente.');
      if (!STATES[data.uf] || !/^\d{7}$/.test(String(data.ibge))) throw new Error('O ViaCEP retornou um endereço incompleto. Preencha o endereço manualmente.');
      let matches = [];
      let aviso = '';
      try {
        matches = await request(`/cidades?codigoIbge=${data.ibge}`,{signal:controller.signal});
      } catch(error) {
        if (controller.signal.aborted) throw error;
        aviso = 'Endereço encontrado, mas não foi possível consultar a cidade cadastrada. Selecione a cidade manualmente.';
      }
      if (controller.signal.aborted || cepController.current !== controller) return;
      const city = matches.find(row => row.codigoIbge === String(data.ibge));
      setUf(data.uf); setCitySearch(city?.nome || data.localidade); setCities(matches); setCityOpen(false);
      setForm(current => ({...current,cep,logradouro:data.logradouro || '',bairro:data.bairro || '',cidadeId:city?.id || ''}));
      if (!city) setError(aviso || 'Endereço encontrado, mas a cidade não está cadastrada. Selecione uma cidade da base importada.');
    } catch(error) {
      if (cepController.current === controller) setError(controller.signal.aborted
        ? 'A consulta do CEP demorou demais. Tente novamente ou preencha o endereço manualmente.'
        : error instanceof TypeError ? 'Não foi possível conectar ao ViaCEP. Tente novamente ou preencha o endereço manualmente.' : error.message);
    } finally {
      clearTimeout(timeout);
      if (cepController.current === controller) {setCepBusy(false);cepController.current = null;}
    }
  }
  async function submit(event) {
    event.preventDefault(); setError('');
    if (!form.cidadeId) { setError('Selecione uma cidade na lista de resultados.'); return; }
    if (![form.email,form.telefone,form.celular].some(value => value?.trim())) { setError('Informe pelo menos um e-mail, telefone ou celular.'); return; }
    setBusy(true);
    const payload = { ...form, cidadeId:Number(form.cidadeId), cep:digits(form.cep), cpf:form.tipoPessoa === 'FISICA' ? digits(form.cpf) : '', cnpj:form.tipoPessoa === 'JURIDICA' ? form.cnpj.replace(/[^a-zA-Z0-9]/g,'').toUpperCase() : '' };
    for(const name of ['rg','telefone','celular']) payload[name]=normalizeField(name,form[name]);
    for(const key of ['id','cidade','criadoEm','atualizadoEm']) delete payload[key];
    try { await request(initial ? `/fornecedores/${initial.id}` : '/fornecedores',{method:initial ? 'PUT' : 'POST',body:payload}); onSaved(); }
    catch(error) { setError(error.message); }
    finally { setBusy(false); }
  }
  return <div className="form-page"><header className="page-header"><h1>{readOnly ? 'Detalhes do Fornecedor' : initial ? 'Editar Fornecedor' : 'Cadastro de Fornecedores'}</h1><button className="secondary" onClick={onCancel}>{readOnly ? 'Voltar' : 'Cancelar'}</button></header>
    <form onSubmit={submit}><fieldset className="form-panel" disabled={readOnly || busy}>
      <section className="general-section"><h2>Dados Gerais</h2><div className="general-grid">{field('nomeRazaoSocial',form.tipoPessoa === 'FISICA' ? 'Nome' : 'Razão Social',{required:true})}{field('nomeFantasia','Nome Fantasia')}{form.tipoPessoa === 'JURIDICA' ? field('cnpj','CNPJ',{required:true,maxLength:18}) : field('cpf','CPF',{required:true,maxLength:14})}{form.tipoPessoa === 'JURIDICA' ? field('inscricaoEstadual','Inscrição Estadual',{maxLength:20}) : field('rg','RG',{maxLength:20})}<Field label="Tipo de Fornecedor"><select value={form.tipoPessoa} onChange={event => update('tipoPessoa',event.target.value)}><option value="JURIDICA">Pessoa jurídica</option><option value="FISICA">Pessoa física</option></select></Field><Field label="Status"><div className="status-control"><button type="button" className={`switch ${form.ativo ? 'on' : ''}`} role="switch" aria-checked={form.ativo} aria-label="Fornecedor ativo" onClick={() => update('ativo',!form.ativo)}><i /></button><span>{form.ativo ? 'Ativo' : 'Inativo'}</span></div></Field>{field('setor','Setor',{maxLength:100})}</div></section>
      <section className="contact-section"><h2>Contato</h2>{field('email','E-mail',{type:'email',maxLength:254})}<div className="phone-grid">{field('telefone','Telefone',{type:'tel',maxLength:20})}{field('celular','Celular',{type:'tel',maxLength:20})}</div>{field('nomeContato','Contato',{maxLength:100})}</section>
      <section className="address-section"><h2>Endereço</h2><div className="address-first"><Field label="CEP"><div className="cep-control"><MaskedInput name="cep" aria-label="CEP" value={form.cep} onValueChange={changeCep} maxLength={9} inputMode="numeric" required /><button type="button" className="primary" onClick={lookupCep} disabled={cepBusy}>{cepBusy ? '...' : 'Buscar'}</button></div></Field>{field('numero','Número',{required:true,maxLength:20})}{field('bairro','Bairro',{required:true,maxLength:100})}<Field label="Estado"><select value={uf} required onChange={event => {setUf(event.target.value);setCitySearch('');update('cidadeId','');setCities([]);}}><option value=""></option>{Object.entries(STATES).map(([key,label]) => <option key={key} value={key}>{label} ({key})</option>)}</select></Field></div><div className="address-second">{field('logradouro','Logradouro',{required:true})}<Field label="Cidade"><div className="city-picker"><input role="combobox" aria-label="Cidade" aria-autocomplete="list" aria-expanded={cityOpen} aria-controls="city-results" value={citySearch} required disabled={!uf || readOnly || busy} autoComplete="off" onFocus={() => setCityOpen(true)} onBlur={() => setTimeout(() => setCityOpen(false),150)} onChange={event => {setCitySearch(event.target.value);update('cidadeId','');setCityOpen(true);}} onKeyDown={event => { if(event.key === 'Escape') setCityOpen(false); if(event.key === 'ArrowDown') {event.preventDefault();document.querySelector('#city-results button')?.focus();} }} />{cityOpen && uf && <div id="city-results" className="city-results" role="listbox">{cities.map(city => <button type="button" role="option" aria-selected={form.cidadeId === city.id} key={city.id} onMouseDown={event => event.preventDefault()} onClick={() => {update('cidadeId',city.id);setCitySearch(city.nome);setCityOpen(false);}}>{city.nome} ({city.uf})</button>)}{!cities.length && <span>{cityError || 'Nenhuma cidade encontrada. Digite o nome.'}</span>}</div>}</div></Field>{field('complemento','Complemento',{maxLength:100})}</div></section>
    </fieldset>{error && <ErrorNotice>{error}</ErrorNotice>}{cityError && <ErrorNotice>{cityError}</ErrorNotice>}{!readOnly && <div className="form-actions"><button className="primary" disabled={busy || cepBusy}>{busy ? 'Salvando...' : initial ? 'Salvar alterações' : 'Cadastrar'}</button></div>}
    </form></div>;
}

function NewUserForm() {
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [success,setSuccess]=useState('');
  async function submit(event) {
    event.preventDefault();if(busy)return;setError('');setSuccess('');
    const form=event.currentTarget;
    const fields=new FormData(form);
    const body={nome:fields.get('nome').trim(),login:fields.get('login').trim(),senha:fields.get('senha')};
    if(body.senha !== fields.get('confirmacao')) {setError('A confirmação da senha não confere.');return;}
    setBusy(true);
    try {
      const usuario=await request('/usuarios',{method:'POST',body});
      form.reset();setSuccess(`Usuário ${usuario.login} criado com sucesso.`);
    } catch(error){setError(error.message);}
    finally{setBusy(false);}
  }
  return <section className="settings-panel new-user-panel" aria-labelledby="new-user-title"><h2 id="new-user-title">Novo usuário</h2><p className="password-hint">Cadastre uma conta para acessar o sistema.</p>
    <form onSubmit={submit}><fieldset disabled={busy}>
      <Field label="Nome completo" name="nome" autoComplete="off" maxLength={100} required />
      <Field label="Login do novo usuário" name="login" autoComplete="off" minLength={3} maxLength={100} pattern="[a-zA-Z0-9._\-]{3,100}" title="Use letras, números, ponto, hífen ou sublinhado." required />
      <Field label="Senha do novo usuário" name="senha" type="password" autoComplete="new-password" minLength={3} maxLength={128} required />
      <Field label="Confirmar senha do novo usuário" name="confirmacao" type="password" autoComplete="new-password" minLength={3} maxLength={128} required />
      {error && <ErrorNotice>{error}</ErrorNotice>}{success && <div className="success" role="status">{success}</div>}
      <button className="primary" disabled={busy}>{busy ? 'Criando...' : 'Criar usuário'}</button>
    </fieldset></form>
  </section>;
}

function Settings({ user }) {
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [success,setSuccess] = useState('');
  async function submit(event) {
    event.preventDefault(); setError(''); setSuccess('');
    const form = event.currentTarget;
    const fields = new FormData(form);
    const body = {senhaAtual:fields.get('senhaAtual'),novaSenha:fields.get('novaSenha'),confirmacaoSenha:fields.get('confirmacaoSenha')};
    if (body.novaSenha.length < 3 || body.novaSenha.length > 128) {setError('A nova senha deve ter de 3 a 128 caracteres.');return;}
    if (body.novaSenha !== body.confirmacaoSenha) {setError('A confirmação da nova senha não confere.');return;}
    setBusy(true);
    try {
      const resultado = await request('/usuarios/me/senha',{method:'PATCH',body});
      form.reset(); setSuccess(resultado.mensagem);
    } catch(error) {setError(error.message);}
    finally {setBusy(false);}
  }
  return <section className="settings-page"><header className="page-header"><h1>Configurações</h1></header><div className="settings-grid"><div className="settings-column">
    <div className="settings-panel"><h2>Minha conta</h2><p>{user.nome}</p><p className="account-login">{user.login}</p></div>
    <div className="settings-panel password-panel"><h2>Alterar senha</h2><p className="password-hint">Informe a senha atual e escolha uma nova senha de 3 a 128 caracteres.</p>
      <form onSubmit={submit}><fieldset disabled={busy}>
        <Field label="Senha atual" name="senhaAtual" type="password" autoComplete="current-password" maxLength={128} required />
        <Field label="Nova senha" name="novaSenha" type="password" autoComplete="new-password" minLength={3} maxLength={128} required />
        <Field label="Confirmar nova senha" name="confirmacaoSenha" type="password" autoComplete="new-password" minLength={3} maxLength={128} required />
        {error && <ErrorNotice>{error}</ErrorNotice>}{success && <div className="success" role="status">{success}</div>}
        <button className="primary" disabled={busy}>{busy ? 'Alterando...' : 'Alterar senha'}</button>
      </fieldset></form>
    </div></div><NewUserForm/></div>
  </section>;
}

function DeleteSupplierDialog({ supplier, onCancel, onConfirm }) {
  const dialog = useRef(null);
  const [confirmation,setConfirmation] = useState('');
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => {
      element.close();
      document.querySelector(`[data-supplier-actions="${supplier.id}"]`)?.focus();
    };
  },[supplier.id]);
  async function submit(event) {
    event.preventDefault();
    if (busy || confirmation.trim().toUpperCase() !== 'EXCLUIR') return;
    setBusy(true);setError('');
    try {await onConfirm(supplier);}
    catch(error) {setError(error.message);setBusy(false);}
  }
  return <dialog ref={dialog} className="delete-dialog" aria-labelledby="delete-title" aria-describedby="delete-description" onCancel={event => {event.preventDefault();if(!busy)onCancel();}}>
    <form onSubmit={submit}><h2 id="delete-title">Excluir fornecedor?</h2>
      <p id="delete-description">Você está prestes a excluir <strong>{supplier.nomeRazaoSocial}</strong>. Essa ação é permanente.</p>
      <label className="field"><span>Digite EXCLUIR para confirmar</span><input autoFocus autoComplete="off" value={confirmation} disabled={busy} onChange={event => setConfirmation(event.target.value)} /></label>
      {error && <ErrorNotice>{error}</ErrorNotice>}
      <div className="dialog-actions"><button type="button" className="secondary" disabled={busy} onClick={onCancel}>Cancelar</button><button className="danger" disabled={busy || confirmation.trim().toUpperCase() !== 'EXCLUIR'}>{busy ? 'Excluindo...' : 'Confirmar exclusão'}</button></div>
    </form>
  </dialog>;
}

function App() {
  const [session,setSession] = useState(readSession);
  const [expired,setExpired] = useState(false);
  const [page,setPage] = useState('dashboard');
  const [rows,setRows] = useState([]);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const [editor,setEditor] = useState(null);
  const [busyId,setBusyId] = useState(null);
  const [deleteTarget,setDeleteTarget] = useState(null);
  const [revision,setRevision] = useState(0);
  const operation = useRef(0);
  useEffect(() => {const expire = () => {operation.current++;setSession(null);setRows([]);setEditor(null);setDeleteTarget(null);setExpired(true);};window.addEventListener('session-expired',expire);return () => window.removeEventListener('session-expired',expire);},[]);
  useEffect(() => {
    if(!session) return;
    const controller = new AbortController();setLoading(true);setError('');
    loadSuppliers(controller.signal).then(setRows).catch(error => {if(error.name !== 'AbortError') setError(error.message);}).finally(() => {if(!controller.signal.aborted) setLoading(false);});
    return () => controller.abort();
  },[session,revision]);
  useEffect(() => {if(!notice) return;const timeout=setTimeout(() => setNotice(''),5000);return () => clearTimeout(timeout);},[notice]);
  function navigate(next) {operation.current++;setPage(next);setEditor(null);setError('');}
  function logout() {saveSession(null);operation.current++;setSession(null);setRows([]);setEditor(null);setDeleteTarget(null);setExpired(false);setError('');}
  async function open(id,readOnly) {
    const current = ++operation.current;setBusyId(id);setError('');
    try {const row = await request(`/fornecedores/${id}`);if(current === operation.current) setEditor({initial:row,readOnly});}
    catch(error) {if(current === operation.current) setError(error.message);}
    finally {setBusyId(null);}
  }
  async function status(row) {
    setBusyId(row.id);setError('');
    try {await request(`/fornecedores/${row.id}/ativo`,{method:'PATCH',body:{ativo:!row.ativo}});setRows(current => current.map(item => item.id === row.id ? {...item,ativo:!row.ativo} : item));setNotice('Status do fornecedor atualizado.');}
    catch(error) {setError(error.message);}
    finally {setBusyId(null);}
  }
  async function removeSupplier(row) {
    await request(`/fornecedores/${row.id}`,{method:'DELETE',body:{confirmacao:'EXCLUIR'}});
    setRows(current => current.filter(item => item.id !== row.id));
    setDeleteTarget(null);
    setNotice('Fornecedor excluído com sucesso.');
  }
  if(!session) return <Login expired={expired} onLogin={result => {setSession(result);setPage('dashboard');setExpired(false);}} />;
  return <div className="app-shell"><Sidebar page={page} navigate={navigate} onLogout={logout}/><main className="main-content">
    {notice && <div className="toast" role="status">{notice}</div>}
    {error && <ErrorNotice onRetry={() => setRevision(value => value+1)}>{error}</ErrorNotice>}
    {editor ? <SupplierForm key={editor.initial?.id || 'new'} {...editor} onCancel={() => setEditor(null)} onSaved={() => {setEditor(null);setNotice('Fornecedor salvo com sucesso.');setRevision(value => value+1);}} /> : page === 'configuracoes' ? <Settings user={session.usuario} onLogout={logout} /> : loading ? <div className="loading" role="status">Carregando fornecedores...</div> : page === 'dashboard' ? <Dashboard rows={rows} user={session.usuario} onLogout={logout}/> : <SupplierList rows={rows} onCreate={() => {operation.current++;setEditor({initial:null,readOnly:false});}} onOpen={open} onStatus={status} onDelete={setDeleteTarget} busyId={busyId}/>}
  </main>{deleteTarget && <DeleteSupplierDialog key={deleteTarget.id} supplier={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={removeSupplier}/>}</div>;
}
createRoot(document.getElementById('root')).render(<App/>);


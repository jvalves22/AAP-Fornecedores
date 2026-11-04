const SESSION_KEY = 'planeta.session';

export function readSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null; }
  catch { return null; }
}
export function saveSession(session) {
  if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else sessionStorage.removeItem(SESSION_KEY);
}

export async function request(path, { signal, method = 'GET', body } = {}) {
  const token = readSession()?.token;
  let response;
  try {
    response = await fetch(`/api/v1${path}`, {
      method, signal,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Não foi possível conectar. Verifique sua conexão e tente novamente.');
  }
  const data = await response.json().catch(() => ({}));
  if (response.status === 401 && path !== '/auth/login') {
    saveSession(null);
    window.dispatchEvent(new Event('session-expired'));
  }
  if (!response.ok) throw new Error(data.erro || 'Não foi possível concluir a solicitação. Tente novamente.');
  return data;
}

// A API aceita até 100 registros por página e pesquisa apenas razão social.
// Carregamos todas as páginas para os indicadores e a pesquisa multicoluna.
export async function loadSuppliers(signal) {
  const first = await request('/fornecedores?pagina=1&limite=100', { signal });
  const rows = [...first.dados];
  for (let page = 2; page <= first.paginacao.totalPaginas; page++) {
    const result = await request(`/fornecedores?pagina=${page}&limite=100`, { signal });
    rows.push(...result.dados);
  }
  return rows;
}

/* eslint-disable no-use-before-define */
const API_BASE = 'https://api.benifin.my.id';
const csrfStorageKey = 'betastoria-admin-csrf';
let csrfToken = sessionStorage.getItem(csrfStorageKey) || '';

const byId = (id) => document.getElementById(id);
const setNotice = (message, type = 'info') => {
    const notice = byId('notice');
    notice.textContent = message;
    notice.className = `alert alert-${type}`;
    notice.classList.remove('d-none');
};
const clearNotice = () => byId('notice').classList.add('d-none');
const formatNumber = (value) => new Intl.NumberFormat('id-ID').format(Number(value || 0));
const formatDate = (value) => new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
const statusLabel = { hadir: 'Hadir', belum_pasti: 'Belum pasti', tidak_hadir: 'Tidak hadir' };

const request = async (path, options = {}) => {
    const headers = new Headers(options.headers || {});
    headers.set('Accept', 'application/json');
    if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }
    if (csrfToken && options.method && options.method !== 'GET') {
        headers.set('X-CSRF-Token', csrfToken);
    }
    const response = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: 'include' });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(body.error || `Request gagal (${response.status})`);
    }
    return body;
};

const showApp = () => {
    byId('login-panel').hidden = true;
    byId('app-panel').hidden = false;
    byId('logout-button').hidden = false;
};
const showLogin = () => {
    byId('login-panel').hidden = false;
    byId('app-panel').hidden = true;
    byId('logout-button').hidden = true;
};
const setStats = (data) => {
    byId('stat-total').textContent = formatNumber(data.total);
    byId('stat-hadir').textContent = formatNumber(data.hadir);
    byId('stat-belum-pasti').textContent = formatNumber(data.belum_pasti);
    byId('stat-tidak-hadir').textContent = formatNumber(data.tidak_hadir);
    byId('stat-pending').textContent = formatNumber(data.guestbook?.pending);
    byId('stat-approved').textContent = formatNumber(data.guestbook?.approved);
    byId('stat-likes').textContent = formatNumber(data.likes);
};
const cell = (value, className = '') => {
    const element = document.createElement('td');
    element.textContent = value ?? '';
    if (className) {
        element.className = className;
    }
    return element;
};
const renderRsvps = (rows) => {
    const table = byId('rsvp-table');
    table.replaceChildren();
    if (!rows.length) {
        table.append(cell('Belum ada RSVP.', 'text-secondary'));
        table.firstChild.colSpan = 5;
        return;
    }
    rows.forEach((row) => {
        const tr = document.createElement('tr');
        tr.append(cell(row.name), cell(`${row.guest_count} orang`), cell(statusLabel[row.attendance] || row.attendance), cell(row.message, 'message-cell'), cell(formatDate(row.created_at)));
        table.append(tr);
    });
};
const renderGuestbook = (rows) => {
    const table = byId('guestbook-table');
    table.replaceChildren();
    if (!rows.length) {
        table.append(cell('Tidak ada data pada filter ini.', 'text-secondary'));
        table.firstChild.colSpan = 5;
        return;
    }
    rows.forEach((row) => {
        const tr = document.createElement('tr');
        tr.append(cell(row.name), cell(row.message, 'message-cell'), cell(row.like_count), cell(row.status));
        const actions = document.createElement('td');
        if (row.status !== 'approved') {
            actions.append(actionButton('Setujui', 'success', () => moderate(row.id, 'approved')));
        }
        if (row.status !== 'rejected') {
            actions.append(actionButton('Tolak', 'outline-danger', () => moderate(row.id, 'rejected')));
        }
        tr.append(actions);
        table.append(tr);
    });
};
const actionButton = (label, style, handler) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `btn btn-${style} btn-sm rounded-3 me-1 mb-1`;
    button.textContent = label;
    button.addEventListener('click', handler);
    return button;
};
const loadStats = async () => setStats((await request('/api/admin/stats')).data);
const loadRsvps = async () => renderRsvps((await request('/api/admin/rsvps?limit=500')).data);
const loadGuestbook = async () => renderGuestbook((await request(`/api/admin/guestbook?status=${encodeURIComponent(byId('guestbook-status').value)}`)).data);
const loadDashboard = async () => {
    clearNotice();
    await Promise.all([loadStats(), loadRsvps(), loadGuestbook()]);
};
const moderate = async (id, status) => {
    try {
        await request(`/api/admin/guestbook/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ status }) });
        setNotice(`Ucapan berhasil diubah menjadi ${status}.`, 'success');
        await Promise.all([loadStats(), loadGuestbook()]);
    } catch (error) { setNotice(error.message, 'danger'); }
};
const restoreSession = async () => {
    try {
        const response = await request('/api/admin/session');
        csrfToken = response.data.csrf_token;
        sessionStorage.setItem(csrfStorageKey, csrfToken);
        showApp();
        await loadDashboard();
    } catch { showLogin(); }
};

byId('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = byId('login-button');
    button.disabled = true;
    try {
        const response = await request('/api/admin/login', { method: 'POST', body: JSON.stringify({ token: byId('admin-token').value }) });
        csrfToken = response.data.csrf_token;
        sessionStorage.setItem(csrfStorageKey, csrfToken);
        byId('admin-token').value = '';
        showApp();
        await loadDashboard();
    } catch (error) { setNotice(error.message, 'danger'); }
    finally { button.disabled = false; }
});
byId('logout-button').addEventListener('click', async () => {
    try { await request('/api/admin/logout', { method: 'POST' }); } catch { /* session is cleared locally below */ }
    csrfToken = '';
    sessionStorage.removeItem(csrfStorageKey);
    showLogin();
    setNotice('Anda sudah keluar.', 'success');
});
byId('refresh-button').addEventListener('click', () => loadDashboard().catch((error) => setNotice(error.message, 'danger')));
byId('guestbook-status').addEventListener('change', () => loadGuestbook().catch((error) => setNotice(error.message, 'danger')));
restoreSession();

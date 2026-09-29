/* eslint-disable no-use-before-define */
import { buildWhatsAppInvitation, defaultInvitationTemplate, normalizeIndonesianPhone } from './app/admin/invitation.js';
import { parseGuestCsv } from './app/admin/guest-csv.js';
import { inviteeSaveError, inviteeStatus } from './app/admin/roster-ui.js';

let inviteeRows = [];
let editingInviteeId = null;
let pendingImport = null;

const API_BASE = 'https://api.benifin.my.id';
const CMS_BASE = 'https://directus.benifin.my.id';
const CMS_SLUG = 'beta-storia-2027';
let publishedWedding = null;
const csrfStorageKey = 'betastoria-admin-csrf';
let csrfToken = sessionStorage.getItem(csrfStorageKey) || '';
let rsvpRows = [];
let guestbookRows = [];
let currentRole = null;
let authEpoch = 0;
let privateRequests = new AbortController();
const sessionSignalKey = 'betastoria-admin-session';
const staleRequest = () => new Error('Sesi telah berubah.');
const isCurrent = (epoch) => epoch === authEpoch;
const invalidateSession = () => {
    authEpoch += 1;
    privateRequests.abort();
    privateRequests = new AbortController();
    csrfToken = '';
    sessionStorage.removeItem(csrfStorageKey);
    showLogin();
};
const beginSession = (data) => {
    authEpoch += 1;
    privateRequests.abort();
    privateRequests = new AbortController();
    csrfToken = data.csrf_token;
    currentRole = data.role;
    sessionStorage.setItem(csrfStorageKey, csrfToken);
};

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
const csvEscape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
const downloadCsv = (filename, headers, rows) => {
    const content = [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\r\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([`\ufeff${content}`], { type: 'text/csv;charset=utf-8' }));
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
};

const request = async (path, options = {}) => {
    const epoch = authEpoch;
    const privateCall = !['/api/admin/session', '/api/admin/login', '/api/admin/logout'].includes(path);
    const headers = new Headers(options.headers || {});
    headers.set('Accept', 'application/json');
    if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }
    if (csrfToken && options.method && options.method !== 'GET') {
        headers.set('X-CSRF-Token', csrfToken);
    }
    const response = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: 'include', signal: privateCall ? privateRequests.signal : options.signal });
    if (privateCall && !isCurrent(epoch)) { throw staleRequest(); }
    if (response.status === 401 && privateCall) {
        invalidateSession();
        setNotice('Sesi tidak aktif. Silakan masuk kembali.', 'danger');
    }
    const body = await response.json().catch(() => ({}));
    if (privateCall && response.status !== 401 && !isCurrent(epoch)) { throw staleRequest(); }
    if (!response.ok) {
        const error = new Error(body.error || `Request gagal (${response.status})`);
        error.status = response.status;
        throw error;
    }
    return body;
};

const showApp = () => {
    if (byId('users-table') && currentRole !== 'admin') {
        byId('app-panel').hidden = true;
        byId('login-panel').hidden = true;
        byId('logout-button').hidden = false;
        setNotice('Akses ditolak (403). Halaman ini hanya untuk admin.', 'danger');
        return;
    }
    byId('login-panel').hidden = true;
    byId('app-panel').hidden = false;
    byId('logout-button').hidden = false;
    document.querySelectorAll('[data-admin-only]').forEach((link) => { link.hidden = currentRole !== 'admin'; });
};
const showLogin = () => {
    byId('login-panel').hidden = false;
    byId('admin-password').value = '';
    if (byId('user-form')) {
        byId('user-form').reset();
        firstUserRequired = false;
        byId('user-role').querySelector('option[value="operator"]').disabled = false;
    }
    byId('app-panel').hidden = true;
    byId('logout-button').hidden = true;
    publishedWedding = null;
    currentRole = null;
    document.querySelectorAll('[data-admin-only]').forEach((link) => { link.hidden = true; });
    if (byId('invitation-form')) {
        byId('invitation-name').value = '';
        byId('invitation-phone').value = '';
        byId('invitation-preview').value = '';
        byId('invitation-generate').disabled = true;
        byId('invitation-result').hidden = true;
        byId('invitation-whatsapp').removeAttribute('href');
        byId('invitation-link').removeAttribute('href');
        inviteeRows = [];
        editingInviteeId = null;
        pendingImport = null;
        byId('invitee-table').replaceChildren();
        byId('invitee-form').reset();
        byId('invitee-csv').value = '';
        byId('invitee-import-preview').hidden = true;
        byId('invitee-cancel').hidden = true;
        byId('invitee-save').textContent = 'Simpan tamu';
    }
    rsvpRows = [];
    guestbookRows = [];
    if (byId('rsvp-table')) { byId('rsvp-table').replaceChildren(); }
    if (byId('guestbook-table')) { byId('guestbook-table').replaceChildren(); }
    if (byId('users-table')) { byId('users-table').replaceChildren(); }
    document.querySelectorAll('[id^="stat-"]').forEach((stat) => { stat.textContent = '—'; });
};
const loadPublishedWedding = async () => {
    const epoch = authEpoch;
    publishedWedding = null;
    byId('invitation-generate').disabled = true;
    byId('invitation-result').hidden = true;
    const params = new URLSearchParams({
        'filter[slug][_eq]': CMS_SLUG,
        'filter[status][_eq]': 'published',
        fields: 'groom_name,bride_name,wedding_date,timezone',
        limit: '1',
    });
    const response = await fetch(`${CMS_BASE}/items/weddings?${params}`, { headers: { Accept: 'application/json' }, signal: privateRequests.signal });
    if (!isCurrent(epoch)) { throw staleRequest(); }
    if (!response.ok) {throw new Error('Data pernikahan terbit tidak bisa dimuat.');}
    const wedding = (await response.json()).data?.[0];
    if (!isCurrent(epoch)) { throw staleRequest(); }
    if (!wedding?.groom_name || !wedding?.bride_name || !wedding?.wedding_date) {throw new Error('Data pernikahan terbit belum lengkap.');}
    publishedWedding = wedding;
    byId('invitation-generate').disabled = false;
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
    rsvpRows = rows;
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
    guestbookRows = rows;
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
const loadPrivate = async (path, render) => {
    const epoch = authEpoch;
    const result = await request(path);
    if (!isCurrent(epoch)) { throw staleRequest(); }
    render(result.data);
};
const loadStats = () => loadPrivate('/api/admin/stats', setStats);
const loadRsvps = () => loadPrivate('/api/admin/rsvps?limit=500', renderRsvps);
const loadGuestbook = () => loadPrivate(`/api/admin/guestbook?status=${encodeURIComponent(byId('guestbook-status').value)}`, renderGuestbook);
const resetInviteeForm = () => {
    editingInviteeId = null;
    byId('invitee-form').reset();
    byId('invitee-save').textContent = 'Simpan tamu';
    byId('invitee-cancel').hidden = true;
};
const renderInvitees = (rows) => {
    inviteeRows = rows;
    const table = byId('invitee-table');
    table.replaceChildren();
    if (!rows.length) {
        const tr = document.createElement('tr');
        const empty = cell('Belum ada tamu tersimpan.', 'text-secondary');
        empty.colSpan = 4;
        tr.append(empty);
        table.append(tr);
        return;
    }
    rows.forEach((row) => {
        const tr = document.createElement('tr');
        const actions = document.createElement('td');
        const name = cell(row.name);
        const status = inviteeStatus(row);
        const badge = document.createElement('span');
        badge.className = `badge ${status.className} d-inline-block mt-1`;
        badge.textContent = status.label;
        name.append(document.createElement('br'), badge);
        const statusCell = document.createElement('td');
        statusCell.append(actionButton(row.sent_at ? 'Batalkan tanda' : 'Tandai sudah dikirim', 'outline-success', async () => {
            try {
                await request(`/api/admin/invitees/${encodeURIComponent(row.id)}`, { method: 'PATCH', body: JSON.stringify({ sent: !row.sent_at }) });
                await loadInvitees();
                setNotice('Status manual diperbarui; WhatsApp tidak memverifikasi pengiriman.', 'success');
            } catch (error) { setNotice(error.message, 'danger'); }
        }));
        const compose = actionButton('Siapkan WA', 'success', () => {
            byId('invitation-name').value = row.name;
            byId('invitation-phone').value = row.phone;
            clearInvitationPreview();
            try { renderInvitationPreview(); }
            catch (error) { setNotice(error.message, 'danger'); }
            byId('invitation-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
            byId('invitation-whatsapp').focus();
        });
        compose.disabled = !publishedWedding;
        actions.append(compose);
        actions.append(actionButton('Edit', 'outline-secondary', () => {
            editingInviteeId = row.id;
            byId('invitee-name').value = row.name;
            byId('invitee-phone').value = row.phone;
            byId('invitee-save').textContent = 'Simpan perubahan';
            byId('invitee-cancel').hidden = false;
            byId('invitee-name').focus();
        }));
        actions.append(actionButton('Hapus', 'outline-danger', async () => {
            if (!window.confirm(`Hapus data tamu “${row.name}” secara permanen?`)) { return; }
            try {
                await request(`/api/admin/invitees/${encodeURIComponent(row.id)}`, { method: 'DELETE' });
                if (editingInviteeId === row.id) { resetInviteeForm(); }
                await loadInvitees();
                setNotice('Data tamu dihapus.', 'success');
            } catch (error) { setNotice(error.message, 'danger'); }
        }));
        tr.append(name, cell(row.phone), statusCell, actions);
        table.append(tr);
    });
};
const loadInvitees = () => loadPrivate('/api/admin/invitees', renderInvitees);
const loadUsers = () => loadPrivate('/api/admin/users', renderUsers);
let firstUserRequired = false;
const renderUsers = (rows) => {
    firstUserRequired = rows.length === 0;
    const table = byId('users-table');
    table.replaceChildren();
    if (!rows.length) {
        byId('user-role').value = 'admin';
        byId('user-role').querySelector('option[value="operator"]').disabled = true;
        const tr = document.createElement('tr');
        const empty = cell('Belum ada akun. Buat akun admin pertama.', 'text-secondary');
        empty.colSpan = 5;
        tr.append(empty);
        table.append(tr);
        return;
    }
    byId('user-role').querySelector('option[value="operator"]').disabled = false;
    rows.forEach((row) => {
        const tr = document.createElement('tr');
        const role = document.createElement('select');
        role.className = 'form-select form-select-sm';
        role.setAttribute('aria-label', `Peran ${row.username}`);
        for (const value of ['operator', 'admin']) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            role.append(option);
        }
        role.value = row.role;
        role.addEventListener('change', () => {
            if (!window.confirm(`Ubah peran ${row.username} menjadi ${role.value}?`)) { role.value = row.role; return; }
            updateUser(row.id, { role: role.value });
        });
        const roleCell = document.createElement('td');
        roleCell.append(role);
        const statusCell = document.createElement('td');
        statusCell.textContent = row.active ? 'Aktif' : 'Nonaktif';
        const actions = document.createElement('td');
        actions.append(actionButton(row.active ? 'Nonaktifkan' : 'Aktifkan', 'outline-secondary', () => {
            if (!window.confirm(`${row.active ? 'Nonaktifkan' : 'Aktifkan'} akun ${row.username}?`)) { return; }
            updateUser(row.id, { active: !row.active });
        }));
        const reset = actionButton('Reset password', 'outline-success', () => {
            reset.hidden = true;
            passwordInput.hidden = false;
            savePassword.hidden = false;
            passwordInput.focus();
        });
        const passwordInput = document.createElement('input');
        passwordInput.type = 'password';
        passwordInput.className = 'form-control form-control-sm mb-1';
        passwordInput.autocomplete = 'new-password';
        passwordInput.setAttribute('aria-label', `Password baru ${row.username}`);
        passwordInput.minLength = 16;
        passwordInput.maxLength = 1024;
        passwordInput.hidden = true;
        const savePassword = actionButton('Simpan password', 'success', async () => {
            const password = passwordInput.value;
            if (password.length < 16 || password.length > 1024) { setNotice('Password harus 16–1024 karakter.', 'danger'); return; }
            passwordInput.value = '';
            await updateUser(row.id, { password });
        });
        savePassword.hidden = true;
        actions.append(reset, passwordInput, savePassword);
        tr.append(cell(row.username), roleCell, statusCell, cell(row.created_at ? formatDate(row.created_at) : '—'), actions);
        table.append(tr);
    });
};
const updateUser = async (id, changes) => {
    try {
        await request(`/api/admin/users/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(changes) });
        await loadUsers();
        setNotice('Akun diperbarui.', 'success');
    } catch (error) { setNotice(error.status === 403 ? 'Akses ditolak (403).' : error.message, 'danger'); await loadUsers().catch(() => {}); }
};
const loadDashboard = async () => {
    if (byId('users-table') && currentRole !== 'admin') { return; }
    const epoch = authEpoch;
    clearNotice();
    const loaders = [];
    if (byId('stat-total')) { loaders.push(loadStats()); }
    if (byId('rsvp-table')) { loaders.push(loadRsvps()); }
    if (byId('guestbook-table')) { loaders.push(loadGuestbook()); }
    if (byId('invitee-table')) { loaders.push(loadPublishedWedding(), loadInvitees()); }
    if (byId('users-table') && currentRole === 'admin') { loaders.push(loadUsers()); }
    const results = await Promise.allSettled(loaders);
    if (!isCurrent(epoch)) { return; }
    if (publishedWedding && inviteeRows.length && byId('invitee-table')) { renderInvitees(inviteeRows); }
    if (results.some((result) => result.status === 'rejected')) {
        const denied = results.some((result) => result.reason?.status === 403);
        setNotice(denied ? 'Akses ditolak (403). Hubungi admin jika Anda memerlukan izin.' : 'Sebagian data gagal dimuat. Coba Refresh.', 'warning');
    }
};
const moderate = async (id, status) => {
    try {
        await request(`/api/admin/guestbook/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ status }) });
        setNotice(`Ucapan berhasil diubah menjadi ${status}.`, 'success');
        await loadGuestbook();
    } catch (error) { setNotice(error.message, 'danger'); }
};
const restoreSession = async (explicitLogin = false) => {
    invalidateSession();
    if (!explicitLogin && localStorage.getItem(sessionSignalKey)?.startsWith('logout-start:')) { return; }
    const epoch = authEpoch;
    try {
        const response = await request('/api/admin/session');
        if (!isCurrent(epoch)) { return; }
        if (response.data?.authenticated !== true || !response.data.csrf_token) { throw new Error('Sesi tidak aktif.'); }
        beginSession(response.data);
        showApp();
        await loadDashboard();
    } catch {
        if (isCurrent(epoch)) { invalidateSession(); }
    }
};
window.addEventListener('pageshow', (event) => { if (event.persisted) { restoreSession(); } });
window.addEventListener('storage', (event) => {
    if (event.key !== sessionSignalKey) { return; }
    if (event.newValue?.startsWith('logout-start:')) { invalidateSession(); return; }
    if (event.newValue?.startsWith('login:')) { restoreSession(true); }
});

byId('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = byId('login-button');
    button.disabled = true;
    const epoch = authEpoch;
    try {
        const response = await request('/api/admin/login', { method: 'POST', body: JSON.stringify({ username: byId('admin-username').value, password: byId('admin-password').value }) });
        if (!isCurrent(epoch)) { return; }
        if (!response.data?.csrf_token) { throw new Error('Sesi tidak valid.'); }
        beginSession(response.data);
        localStorage.setItem(sessionSignalKey, `login:${Date.now()}`);
        byId('admin-password').value = '';
        showApp();
        await loadDashboard();
    } catch (error) { if (isCurrent(epoch)) { setNotice(error.message, 'danger'); } }
    finally { button.disabled = false; }
});
byId('logout-button').addEventListener('click', async () => {
    const logout = request('/api/admin/logout', { method: 'POST' });
    invalidateSession();
    const epoch = authEpoch;
    localStorage.setItem(sessionSignalKey, `logout-start:${Date.now()}`);
    try {
        await logout;
        if (isCurrent(epoch)) { setNotice('Anda sudah keluar.', 'success'); }
    } catch {
        if (isCurrent(epoch)) { setNotice('Sesi lokal dibersihkan, tetapi keluar dari server gagal. Tutup browser atau coba masuk dan keluar kembali.', 'danger'); }
    }
});
byId('refresh-button')?.addEventListener('click', () => loadDashboard().catch((error) => setNotice(error.message, 'danger')));
const clearInvitationPreview = () => {
    byId('invitation-result').hidden = true;
    byId('invitation-whatsapp').removeAttribute('href');
    byId('invitation-link').removeAttribute('href');
};
const renderInvitationPreview = () => {
    const result = buildWhatsAppInvitation({
        name: byId('invitation-name').value,
        phone: byId('invitation-phone').value,
        template: byId('invitation-template').value,
        wedding: publishedWedding,
    });
    byId('invitation-preview').value = result.message;
    byId('invitation-link').href = result.invitationUrl;
    byId('invitation-link').textContent = result.invitationUrl;
    byId('invitation-whatsapp').href = result.whatsappUrl;
    byId('invitation-result').hidden = false;
};
if (byId('invitation-template')) {
    for (const id of ['invitation-name', 'invitation-phone', 'invitation-template']) {
        byId(id).addEventListener('input', clearInvitationPreview);
    }
byId('invitation-template').value = defaultInvitationTemplate;
byId('invitee-cancel').addEventListener('click', resetInviteeForm);
byId('invitee-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = byId('invitee-name').value.trim();
    const phone = normalizeIndonesianPhone(byId('invitee-phone').value);
    if (name.length < 2 || name.length > 80 || /[\r\n]/.test(name) || !phone) {
        setNotice('Nama atau nomor WA tidak valid.', 'danger');
        return;
    }
    const button = byId('invitee-save');
    button.disabled = true;
    try {
        const path = editingInviteeId ? `/api/admin/invitees/${encodeURIComponent(editingInviteeId)}` : '/api/admin/invitees';
        await request(path, { method: editingInviteeId ? 'PATCH' : 'POST', body: JSON.stringify({ name, phone }) });
        resetInviteeForm();
        setNotice('Data tamu tersimpan.', 'success');
        try { await loadInvitees(); }
        catch { setNotice('Tamu tersimpan, tetapi daftar belum dapat dimuat. Tekan Refresh sebelum menyimpan lagi.', 'warning'); }
    } catch (error) { setNotice(inviteeSaveError(error.status, error.message), 'danger'); }
    finally { button.disabled = false; }
});
const clearImport = () => {
    pendingImport = null;
    byId('invitee-import-preview').hidden = true;
};
byId('invitee-import-cancel').addEventListener('click', clearImport);
byId('invitee-csv').addEventListener('change', clearImport);
byId('invitee-import').addEventListener('click', async () => {
    clearImport();
    const file = byId('invitee-csv').files?.[0];
    if (!file || file.size > 1_000_000) { setNotice('Pilih file CSV maksimal 1 MB.', 'danger'); return; }
    try {
        const rows = parseGuestCsv(await file.text());
        const seen = new Set(inviteeRows.map((row) => row.phone));
        let duplicates = 0;
        const valid = [];
        for (const [index, row] of rows.entries()) {
            const phone = normalizeIndonesianPhone(row.phone);
            if (!phone || row.name.length < 2 || row.name.length > 80 || /[\r\n]/.test(row.name)) {
                throw new Error(`Nama/nomor tidak valid pada baris ${index + 2}. Tidak ada data diimpor.`);
            }
            if (seen.has(phone)) { duplicates += 1; continue; }
            seen.add(phone);
            valid.push({ name: row.name, phone });
        }
        if (!rows.length) { throw new Error('CSV tidak berisi tamu.'); }
        pendingImport = valid;
        byId('invitee-import-summary').textContent = `${valid.length} tamu baru, ${duplicates} nomor duplikat dilewati. Periksa file sebelum konfirmasi.`;
        byId('invitee-import-preview').hidden = false;
        byId('invitee-import-confirm').disabled = valid.length === 0;
    } catch (error) { setNotice(error.message, 'danger'); }
});
byId('invitee-import-confirm').addEventListener('click', async () => {
    if (!pendingImport?.length) { return; }
    const button = byId('invitee-import-confirm');
    button.disabled = true;
    try {
        const result = await request('/api/admin/invitees/import', { method: 'POST', body: JSON.stringify({ rows: pendingImport }) });
        clearImport();
        byId('invitee-csv').value = '';
        await loadInvitees();
        setNotice(`Impor selesai: ${result.data.created} ditambahkan, ${result.data.duplicates} duplikat saat impor dilewati.`, 'success');
    } catch (error) { setNotice(error.message, 'danger'); }
    finally { button.disabled = false; }
});
byId('invitation-form').addEventListener('submit', (event) => {
    event.preventDefault();
    clearInvitationPreview();
    try { renderInvitationPreview(); }
    catch (error) { setNotice(error.message, 'danger'); }
});
}
byId('guestbook-status')?.addEventListener('change', () => loadGuestbook().catch((error) => setNotice(error.message, 'danger')));
byId('export-rsvp')?.addEventListener('click', () => downloadCsv('betastoria-rsvp.csv', ['Nama', 'Jumlah tamu', 'Status', 'Pesan', 'Waktu'], rsvpRows.map((row) => [row.name, row.guest_count, statusLabel[row.attendance] || row.attendance, row.message, row.created_at])));
byId('export-guestbook')?.addEventListener('click', () => downloadCsv('betastoria-guestbook.csv', ['Nama', 'Pesan', 'Like', 'Status', 'Waktu'], guestbookRows.map((row) => [row.name, row.message, row.like_count, row.status, row.created_at])));
if (byId('user-form')) {
    byId('user-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const username = byId('user-username').value.trim();
        const password = byId('user-password').value;
        const role = byId('user-role').value;
        if (firstUserRequired && role !== 'admin') { setNotice('Akun pertama harus berperan admin.', 'danger'); return; }
        if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(username.toLowerCase()) || password.length < 16 || password.length > 1024) { setNotice('Username 3–64 karakter dan password 16–1024 karakter diperlukan.', 'danger'); return; }
        const button = byId('user-form').querySelector('button[type="submit"]');
        button.disabled = true;
        try {
            await request('/api/admin/users', { method: 'POST', body: JSON.stringify({ username, password, role }) });
            byId('user-form').reset();
            await loadUsers();
            setNotice('Akun dibuat.', 'success');
        } catch (error) { setNotice(error.status === 403 ? 'Akses ditolak (403).' : error.message, 'danger'); }
        finally { button.disabled = false; }
    });
}
restoreSession();

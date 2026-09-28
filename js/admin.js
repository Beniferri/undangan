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
        const error = new Error(body.error || `Request gagal (${response.status})`);
        error.status = response.status;
        throw error;
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
    publishedWedding = null;
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
};
const loadPublishedWedding = async () => {
    publishedWedding = null;
    byId('invitation-generate').disabled = true;
    byId('invitation-result').hidden = true;
    const params = new URLSearchParams({
        'filter[slug][_eq]': CMS_SLUG,
        'filter[status][_eq]': 'published',
        fields: 'groom_name,bride_name,wedding_date,timezone',
        limit: '1',
    });
    const response = await fetch(`${CMS_BASE}/items/weddings?${params}`, { headers: { Accept: 'application/json' } });
    if (!response.ok) {throw new Error('Data pernikahan terbit tidak bisa dimuat.');}
    const wedding = (await response.json()).data?.[0];
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
const loadStats = async () => setStats((await request('/api/admin/stats')).data);
const loadRsvps = async () => renderRsvps((await request('/api/admin/rsvps?limit=500')).data);
const loadGuestbook = async () => renderGuestbook((await request(`/api/admin/guestbook?status=${encodeURIComponent(byId('guestbook-status').value)}`)).data);
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
const loadInvitees = async () => renderInvitees((await request('/api/admin/invitees')).data);
const loadDashboard = async () => {
    clearNotice();
    const results = await Promise.allSettled([loadStats(), loadRsvps(), loadGuestbook(), loadPublishedWedding(), loadInvitees()]);
    if (publishedWedding && inviteeRows.length) { renderInvitees(inviteeRows); }
    if (results.some((result) => result.status === 'rejected')) {
        setNotice('Sebagian data dashboard atau metadata undangan gagal dimuat. Coba Refresh.', 'warning');
    }
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
const clearInvitationPreview = () => {
    byId('invitation-result').hidden = true;
    byId('invitation-whatsapp').removeAttribute('href');
    byId('invitation-link').removeAttribute('href');
};
for (const id of ['invitation-name', 'invitation-phone', 'invitation-template']) {
    byId(id).addEventListener('input', clearInvitationPreview);
}
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
byId('invitation-form').addEventListener('submit', (event) => {
    event.preventDefault();
    clearInvitationPreview();
    try { renderInvitationPreview(); }
    catch (error) { setNotice(error.message, 'danger'); }
});
byId('guestbook-status').addEventListener('change', () => loadGuestbook().catch((error) => setNotice(error.message, 'danger')));
byId('export-rsvp').addEventListener('click', () => downloadCsv('betastoria-rsvp.csv', ['Nama', 'Jumlah tamu', 'Status', 'Pesan', 'Waktu'], rsvpRows.map((row) => [row.name, row.guest_count, statusLabel[row.attendance] || row.attendance, row.message, row.created_at])));
byId('export-guestbook').addEventListener('click', () => downloadCsv('betastoria-guestbook.csv', ['Nama', 'Pesan', 'Like', 'Status', 'Waktu'], guestbookRows.map((row) => [row.name, row.message, row.like_count, row.status, row.created_at])));
restoreSession();

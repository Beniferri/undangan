import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parseGuestCsv } from '../js/app/admin/guest-csv.js';
import { inviteeSaveError, inviteeStatus } from '../js/app/admin/roster-ui.js';

const first = { name: 'Ayu', phone: '628123456789', sent_at: null };
const second = { name: 'Budi', phone: '628987654321', sent_at: '2026-09-28T10:00:00Z' };

test('two roster rows show independent manual status and actionable save errors', () => {
    const rows = [first, second];
    assert.equal(rows.length, 2);
    assert.deepEqual(rows.map(inviteeStatus), [
        { label: 'Belum ditandai', className: 'text-bg-secondary' },
        { label: 'Sudah dikirim (manual)', className: 'text-bg-success' },
    ]);
    assert.equal(inviteeSaveError(409, 'Phone already exists.'), 'Nomor WA sudah ada di daftar tamu. Gunakan nomor lain atau Edit kontak yang sudah ada.');
    assert.equal(inviteeSaveError(422, 'Invalid invitee name or Indonesian mobile phone.'), 'Nama atau nomor WA tidak valid. Periksa kembali format nomor Indonesia.');
    assert.equal(inviteeSaveError(403, 'Invalid CSRF token.'), 'Sesi admin tidak valid. Muat ulang dashboard lalu login kembali.');
    assert.equal(inviteeSaveError(500, 'Internal server error'), 'Internal server error');
});


const html = readFileSync(new URL('../dashboard.html', import.meta.url), 'utf8');
const js = readFileSync(new URL('../js/admin.js', import.meta.url), 'utf8');

test('dashboard favicon uses the wedding icon instead of the old placeholder', () => {
    assert.match(html, /rel="icon"[^>]+href="\.\/assets\/images\/dashboard-favicon\.png"/);
    const icon = readFileSync(new URL('../assets/images/dashboard-favicon.png', import.meta.url));
    assert.equal(icon.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
});

test('dashboard navigation targets real admin sections and loads the fresh design', () => {
    assert.match(html, /css\/admin\.css\?v=glass-dashboard-1/);
    assert.match(html, /<nav class="dashboard-nav" aria-label="Bagian dashboard">/);
    assert.match(html, /class="dashboard-nav-hint">Geser menu/);
    for (const id of ['ringkasan', 'daftar-tamu', 'kirim-undangan', 'data-rsvp', 'moderasi-ucapan']) {
        assert.match(html, new RegExp(`href="#${id}"`));
        assert.match(html, new RegExp(`id="${id}"`));
    }
    assert.match(html, /id="app-panel" hidden>[\s\S]*?<nav class="dashboard-nav"/);
});

test('dashboard login submits username and password without admin token', () => {
    assert.match(html, /id="admin-username"[^>]*autocomplete="username"/);
    assert.match(html, /id="admin-password"[^>]*autocomplete="current-password"/);
    assert.doesNotMatch(html, /id="admin-token"|token admin/i);
    assert.match(js, /username: byId\('admin-username'\)\.value/);
    assert.match(js, /password: byId\('admin-password'\)\.value/);
    assert.doesNotMatch(js, /token: byId\('admin-token'\)/);
});

test('logout only clears local session after API confirms success', () => {
    const handler = js.slice(js.indexOf("byId('logout-button').addEventListener"), js.indexOf("byId('refresh-button').addEventListener"));
    assert.match(handler, /try \{[\s\S]*await request\('\/api\/admin\/logout'/);
    assert.match(handler, /catch \{[\s\S]*Gagal keluar dari server/);
    assert.match(handler, /return;[\s\S]*csrfToken = ''/);
    assert.doesNotMatch(handler, /catch \{ \/\* session is cleared locally below \*\/ \}/);
});

test('parses BOM, quoted commas/newlines and CRLF CSV with name and phone headers', () => {
    const rows = parseGuestCsv('\ufeffnama,nomor\r\n"Ibu, Rahma",081234567890\r\n"Bapak\nHasan",6281234567891\r\n');
    assert.deepEqual(rows, [{ name: 'Ibu, Rahma', phone: '081234567890' }, { name: 'Bapak\nHasan', phone: '6281234567891' }]);
});

test('rejects malformed CSV, missing columns and oversize files', () => {
    assert.throws(() => parseGuestCsv('nama,nomor\n"tidak selesai,081234567890'), /CSV/i);
    assert.throws(() => parseGuestCsv('nama,email\nTamu,foo'), /kolom/i);
    assert.throws(() => parseGuestCsv('nama,nama,nomor\nA,B,081234567890'), /kolom/i);
    assert.throws(() => parseGuestCsv('nama,nomor\nA,081234567890,extra'), /baris/i);
    assert.throws(() => parseGuestCsv('nama,nomor\n' + 'x'.repeat(1_000_001)), /besar/i);
});

test('guest roster controls are behind login and reuse existing composer', () => {
    const panel = html.slice(html.indexOf('id="app-panel"'), html.indexOf('</main>'));
    for (const id of ['invitee-form', 'invitee-name', 'invitee-phone', 'invitee-csv', 'invitee-import', 'invitee-table', 'invitee-cancel']) {
        assert.match(panel, new RegExp(`id="${id}"`));
    }
    assert.match(js, /\/api\/admin\/invitees/);
    assert.match(js, /buildWhatsAppInvitation/);
    assert.match(html, /dist\/admin\.js\?v=password-login-1/);
    assert.match(html, /setiap tamu perlu nomor WA yang berbeda/);
    assert.match(js, /inviteeSaveError\(error\.status, error\.message\)/);
    assert.doesNotMatch(js, /inviteeRows\.some\(\(row\) => row\.phone === phone/);
    assert.match(js, /name\.append\(document\.createElement\('br'\), badge\)/);
    assert.match(js, /statusCell\.append\(actionButton\(row\.sent_at/);
});

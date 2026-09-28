import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parseGuestCsv } from '../js/app/admin/guest-csv.js';

const html = readFileSync(new URL('../dashboard.html', import.meta.url), 'utf8');
const js = readFileSync(new URL('../js/admin.js', import.meta.url), 'utf8');

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
    assert.match(html, /dist\/admin\.js\?v=guest-roster-1/);
});

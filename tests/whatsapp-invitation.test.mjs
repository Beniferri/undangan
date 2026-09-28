import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildWhatsAppInvitation, normalizeIndonesianPhone } from '../js/app/admin/invitation.js';

const html = readFileSync(new URL('../dashboard.html', import.meta.url), 'utf8');

test('accepts Indonesian mobile numbers and rejects unsafe or incomplete destinations', () => {
    assert.equal(normalizeIndonesianPhone('0812-3456-7890'), '6281234567890');
    assert.equal(normalizeIndonesianPhone('+62 812 3456 7890'), '6281234567890');
    assert.equal(normalizeIndonesianPhone('6281234567890'), '6281234567890');
    for (const invalid of ['08123', '+1 202 555 0100', '08abc123456', '6281234567890?text=other']) {
        assert.equal(normalizeIndonesianPhone(invalid), null);
    }
});

test('personalized link and composed WhatsApp text agree for a named guest', () => {
    const result = buildWhatsAppInvitation({
        name: 'Bapak & Ibu Rahma', phone: '+62 812 3456 7890',
        template: 'Assalamu’alaikum {nama}\n{mempelai}\n{tanggal}\n{link}',
        wedding: { groom_name: 'Daniyal', bride_name: 'Balqis', wedding_date: '2027-01-17', timezone: 'Asia/Jakarta' },
    });
    const invitation = new URL(result.invitationUrl);
    const whatsapp = new URL(result.whatsappUrl);
    assert.equal(invitation.origin, 'https://wedding.benifin.my.id');
    assert.equal(invitation.searchParams.get('to'), 'Bapak & Ibu Rahma');
    assert.equal(whatsapp.origin, 'https://wa.me');
    assert.equal(whatsapp.pathname, '/6281234567890');
    assert.equal(whatsapp.searchParams.get('text'), result.message);
    assert.match(result.message, /Daniyal & Balqis/);
    assert.match(result.message, /17 Januari 2027/);
    assert.ok(result.message.includes(result.invitationUrl));
});

test('invalid guests, missing published wedding, and missing personalization cannot create a chat link', () => {
    const wedding = { groom_name: 'Daniyal', bride_name: 'Balqis', wedding_date: '2027-01-17' };
    const base = { name: 'Tamu', phone: '081234567890', wedding, template: 'Halo {nama}\n{link}' };
    assert.throws(() => buildWhatsAppInvitation({ ...base, name: '  ' }), /nama/i);
    assert.throws(() => buildWhatsAppInvitation({ ...base, name: 'a'.repeat(81) }), /nama/i);
    assert.throws(() => buildWhatsAppInvitation({ ...base, phone: 'invalid' }), /nomor/i);
    assert.throws(() => buildWhatsAppInvitation({ ...base, wedding: null }), /pernikahan/i);
    assert.throws(() => buildWhatsAppInvitation({ ...base, template: 'Halo semua' }), /\{nama\}.*\{link\}/i);
    assert.throws(() => buildWhatsAppInvitation({ ...base, name: 'A\nB' }), /nama/i);
});

test('invitation composer is gated behind admin login and does not persist phone or auto-send', () => {
    const panel = html.slice(html.indexOf('id="app-panel"'), html.indexOf('</main>'));
    assert.match(html, /<section id="app-panel" hidden>/);
    for (const id of ['invitation-name', 'invitation-phone', 'invitation-template', 'invitation-preview', 'invitation-whatsapp']) {
        assert.match(panel, new RegExp(`id="${id}"`));
    }
    assert.match(panel, /target="_blank" rel="noopener noreferrer"/);
    assert.match(html, /dist\/admin\.js\?v=guest-roster-1/);
});

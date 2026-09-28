import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const html = read('index.html');
const gift = html.slice(html.indexOf('<!-- Gift -->'), html.indexOf('<!-- RSVP Form -->'));
const guest = read('js/app/guest/guest.js');

test('gift expands within its own section instead of opening a dialog', () => {
    assert.match(gift, /id="gift-toggle"[^>]*aria-expanded="false"[^>]*aria-controls="gift-options"[^>]*hidden/);
    assert.match(gift, /id="gift-options"[^>]*hidden/);
    assert.match(gift, /id="gift-close"[^>]*>CLOSE<\/button>/);
    assert.match(gift, /Wedding Gift/);
    assert.doesNotMatch(html, /<dialog[^>]*id="gift-dialog"/);
    assert.doesNotMatch(guest, /dialog\.showModal\(\)|dialog\.close\(\)/);
    assert.match(guest, /toggle\.setAttribute\('aria-expanded', 'true'\)/);
    assert.match(guest, /toggle\.setAttribute\('aria-expanded', 'false'\)/);
});

test('inline list contains only CMS-backed payment/address rows plus an informational note', () => {
    for (const key of ['groom-account-number', 'bride-account-number', 'home-address']) {
        assert.match(gift, new RegExp(`data-cms="gift-${key}"`));
        assert.match(gift, new RegExp(`data-copy-from="gift-${key}"`));
    }
    assert.equal((gift.match(/data-gift-card=/g) || []).length, 3);
    assert.match(gift, /class="gift-item gift-note-card"/);
    assert.match(guest, /ownerName === recipientName/);
    assert.match(guest, /card\.hidden = !available/);
    assert.doesNotMatch(gift, /Samuel|Evelyn|123456789|987654321|08123456789|Arcadia/);
});

test('panel is glassy, fluid width, divided rows and reduced-motion aware', () => {
    const css = existsSync(new URL('../css/gift-inline.css', import.meta.url)) ? read('css/gift-inline.css') : '';
    assert.match(css, /\.gift-options\s*\{[^}]*backdrop-filter:\s*blur\(/s);
    assert.match(css, /\.gift-item\s*\{[^}]*border-bottom:/s);
    assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)/);
    assert.match(html, /css\/gift-inline\.css\?v=gift-inline-1/);
    assert.match(html, /dist\/guest\.js\?v=gift-inline-1/);
});

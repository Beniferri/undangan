import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const html = source('index.html');
const gift = html.slice(html.indexOf('<!-- Gift -->'), html.indexOf('<!-- RSVP Form -->')) + html.slice(html.indexOf('<!-- Wedding Gift dialog'), html.indexOf('<!-- Modal Image -->'));
const css = existsSync(new URL('../css/gift-modal.css', import.meta.url)) ? source('css/gift-modal.css') : '';
const js = source('js/app/guest/guest.js');

test('valid gift action opens a labeled dialog with three CMS cards and an honest fourth non-copy card', () => {
    assert.match(gift, /id="gift-toggle"[^>]*aria-haspopup="dialog"[^>]*hidden>\s*SEND GIFT/);
    assert.match(gift, /<dialog[^>]*id="gift-dialog"[^>]*aria-labelledby="gift-dialog-title"/);
    assert.match(gift, /id="gift-dialog-title"[^>]*>Wedding Gift<\/h2>/);
    assert.match(gift, /id="gift-close"[^>]*aria-label="Tutup Wedding Gift"/);
    for (const key of ['groom-account-number', 'bride-account-number', 'home-address']) {
        assert.match(gift, new RegExp(`data-cms="gift-${key}"`));
        assert.match(gift, new RegExp(`data-copy-from="gift-${key}"`));
    }
    assert.equal((gift.match(/data-gift-card=/g) || []).length, 3);
    assert.match(gift, /class="gift-modal-card gift-note-card"/);
    assert.doesNotMatch(gift, /data-gift-view|role="tablist"|role="tabpanel"/);
    assert.match(js, /dialog\.showModal\(\)/);
    assert.match(js, /dialog\.close\(\)/);
});

test('modal is blur-backed, bounded on short screens, and motion-aware', () => {
    assert.match(css, /#gift-dialog::backdrop\s*\{[^}]*backdrop-filter:\s*blur\(/s);
    assert.match(css, /#gift-dialog\s*\{[^}]*max-width:\s*28rem;[^}]*max-height:\s*calc\(100dvh - 2rem\)/s);
    assert.match(css, /#gift-dialog\[open\][^}]*animation:/s);
    assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)/);
    assert.match(css, /\.gift-modal-card\s*\{[^}]*background:\s*#2b2b2b;[^}]*color:\s*#fff/s);
});

test('unavailable gift values are hidden before dialog can open', () => {
    assert.match(gift, /id="gift" hidden/);
    assert.match(gift, /data-gift-card="groom" hidden/);
    assert.match(gift, /data-gift-card="bride" hidden/);
    assert.match(gift, /data-gift-card="home" hidden/);
    assert.match(js, /ownerName === recipientName/);
    assert.match(js, /card\.hidden = !available/);
    assert.match(js, /toggle\.hidden = !hasAvailableGift/);
    assert.match(js, /Promise\.resolve\(window\.cmsReady\)\.then\(refreshGiftAvailability\)/);
});

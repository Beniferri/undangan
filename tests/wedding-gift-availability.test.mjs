import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const html = source('index.html');
const gift = html.slice(html.indexOf('<!-- Gift -->'), html.indexOf('<!-- RSVP Form -->'));
const js = source('js/app/guest/guest.js');

test('gift opens inline, never in a dialog overlay', () => {
    assert.match(gift, /id="gift-toggle"[^>]*aria-expanded="false"[^>]*aria-controls="gift-options"[^>]*hidden/);
    assert.match(gift, /id="gift-options"[^>]*hidden/);
    assert.match(gift, /id="gift-close"/);
    assert.doesNotMatch(html, /id="gift-dialog"/);
    assert.doesNotMatch(js, /dialog\.showModal\(\)/);
});

test('only CMS-verified gift choices are revealed, with no invented payment details', () => {
    assert.match(gift, /id="gift" hidden/);
    for (const key of ['groom', 'bride', 'home']) {
        assert.match(gift, new RegExp(`data-gift-card="${key}" hidden`));
    }
    assert.match(js, /ownerName === recipientName/);
    assert.match(js, /card\.hidden = !available/);
    assert.match(js, /toggle\.hidden = !hasAvailableGift/);
    assert.match(js, /Promise\.resolve\(window\.cmsReady\)\.then\(refreshGiftAvailability\)/);
});

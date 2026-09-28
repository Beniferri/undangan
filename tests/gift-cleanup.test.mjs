import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const gift = html.slice(html.indexOf('<!-- Gift -->'), html.indexOf('<!-- RSVP Form -->'));
const css = readFileSync(new URL('../css/gift-inline.css', import.meta.url), 'utf8');
const cms = readFileSync(new URL('../js/cms.js', import.meta.url), 'utf8');

test('gift lists only payment and address rows with no decorative icons or closing prayer card', () => {
    assert.equal((gift.match(/data-gift-card=/g) || []).length, 3);
    assert.doesNotMatch(gift, /gift-note-card|Doa Terbaik|gift-item-icon|fa-(building-columns|gift|heart)/);
    assert.doesNotMatch(css, /\.gift-item-icon\s*\{/);
    assert.match(gift, /data-cms="gift-home-address"/);
});

test('home delivery shows only a real address field, never a recipient name as an address', () => {
    assert.match(cms, /item\.address/);
    assert.match(cms, /setCmsText\(numberSelector, item\.address\)/);
    assert.doesNotMatch(cms, /setCmsText\('gift-home-address', item\.account_name\)/);
});

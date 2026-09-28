import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const cms = read('js/cms.js');
const html = read('index.html');
const gift = html.slice(html.indexOf('<!-- Gift -->'), html.indexOf('<!-- RSVP Form -->'));

test('home address uses the Rumah gift label even without a gift_type field', () => {
    assert.match(cms, /item\.label\?\.trim\(\)\.toLowerCase\(\) === 'rumah'/);
    assert.match(cms, /homeGift.*find/);
    assert.match(cms, /item\.address/);
    assert.match(cms, /item\.account_name \|\| item\.name/);
    assert.match(gift, /Alamat Rumah/);
    assert.match(gift, /data-gift-card="home" hidden/);
});

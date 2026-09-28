import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const html = read('index.html');
const cms = read('js/cms.js');
const gift = html.slice(html.indexOf('<!-- Gift -->'), html.indexOf('<!-- RSVP Form -->'));

test('each payment row shows the bank label from its verified CMS gift', () => {
    for (const who of ['groom', 'bride']) {
        assert.match(gift, new RegExp(`data-cms="gift-${who}-bank"`));
        assert.match(cms, new RegExp(`'gift-${who}-bank'`));
        assert.match(cms, /setCmsText\(bankSelector, item\.label\)/);
    }
    assert.doesNotMatch(gift, /Rekening Mempelai (Pria|Wanita)/);
    assert.match(gift, /data-cms="gift-groom-account-name"/);
    assert.match(gift, /data-cms="gift-bride-account-number"/);
});

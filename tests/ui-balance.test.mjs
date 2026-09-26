import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const guest = readFileSync(new URL('../css/guest.css', import.meta.url), 'utf8');
const editorial = readFileSync(new URL('../css/editorial-refresh.css', import.meta.url), 'utf8');
const cms = readFileSync(new URL('../js/cms.js', import.meta.url), 'utf8');

test('both hero headings have three explicit CMS-ready lines and retain the calendar text', () => {
    const headings = [...html.matchAll(/<h2 class="[^"]*couple-names" data-cms="couple-names">([^<]*(?:<span[^>]*>[^<]*<\/span>){3})<\/h2>/g)];
    assert.equal(headings.length, 2);
    for (const [, heading] of headings) {
        assert.match(heading, /^<span data-cms="couple-groom-name">[^<]+<\/span><span class="couple-amp">&amp;<\/span><span data-cms="couple-bride-name">[^<]+<\/span>$/);
    }
    assert.match(guest, /\.couple-names > span\s*\{[^}]*display:\s*block/);
    assert.match(cms, /setCmsText\('couple-groom-name', wedding\.groom_name\)/);
    assert.match(cms, /setCmsText\('couple-bride-name', wedding\.bride_name\)/);
    assert.doesNotMatch(cms, /setCmsText\('couple-names', couple\)/);
    assert.match(html, /data-calendar-button/);
});

test('date badges have theme contrast on hero and desktop sidebar', () => {
    assert.equal((html.match(/class="[^"]*wedding-date" data-cms="wedding-date"/g) || []).length, 2);
    assert.match(guest, /body\.islamic-modern\[data-bs-theme="dark"\][\s\S]*?--date-bg:\s*#ead8b7;[\s\S]*?--date-text:\s*#10251f/);
    assert.match(guest, /body\.islamic-modern\[data-bs-theme="light"\][\s\S]*?--date-bg:\s*#183d35;[\s\S]*?--date-text:\s*#fffdf8/);
    assert.match(editorial, /body\.islamic-modern\[data-bs-theme="light"\] \.editorial-hero \.wedding-date/);
    assert.match(editorial, /body\.islamic-modern\[data-bs-theme="dark"\] \.editorial-hero \.wedding-date/);
});

test('gift heading cannot be replaced by a bank label but account CMS remains available', () => {
    const gift = html.slice(html.indexOf('id="gift"'), html.indexOf('<!-- RSVP Form -->'));
    assert.match(gift, /<h2 class="font-esthetic gift-title">Tanda Kasih<\/h2>/);
    assert.doesNotMatch(gift, /Bank Syariah Indonesia|\bBSI\b|data-cms="gift-label"/i);
    assert.match(gift, /data-cms="gift-groom-account-number"/);
    assert.match(gift, /data-copy-from="gift-groom-account-number"/);
    assert.match(cms, /addressSelector \? item\.name : item\.account_name/);
    assert.doesNotMatch(cms, /setCmsText\('gift-label'/);
});

test('footer credit is last and rendered as subtle small print', () => {
    const footer = html.slice(html.indexOf('id="footer"'), html.indexOf('</section>', html.indexOf('id="footer"')));
    assert.ok(footer.indexOf('footer-credit') > footer.indexOf('font-arabic'));
    assert.match(guest, /\.editorial-footer \.footer-credit\s*\{[^}]*font-size:\s*0\.75rem;[^}]*opacity:\s*0\.65/s);
});

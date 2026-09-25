import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
test('cover locks both scroll roots until opened', () => {
    assert.match(html.match(/<html[^>]*>/)[0], /class="invitation-locked"/);
});

test('bottom navigation has exactly the six requested destinations and line icons', () => {
    const nav = html.match(/<nav\b[^>]*id="navbar-menu"[\s\S]*?<\/nav>/)[0];
    assert.deepEqual([...nav.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]), ['home', 'groom', 'story', 'events', 'rsvp', 'gift']);
    assert.equal((nav.match(/<svg /g) || []).length, 6);
});
test('cinematic cover preserves hydration and offers an immediate open action', () => {
    const cover = html.slice(html.indexOf('<!-- Opening Cover -->'), html.indexOf('<!-- Loading Page -->'));
    assert.match(cover, /QS\. Ar-Rum: 21/);
    assert.match(cover, /lang="ar" dir="rtl"/);
    assert.match(cover, /id="opening-video"/);
    assert.match(cover, /data-cms="couple-short-names"/);
    assert.match(cover, /class="opening-guest-value"/);
    assert.match(cover, /Buka Undangan/);
    assert.doesNotMatch(cover, /<button[^>]*disabled/);
    assert.match(html, /class="invitation-tools"/);
    assert.doesNotMatch(html, /bottom: 10vh; right: 2vh/);
});

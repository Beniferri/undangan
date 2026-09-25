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
test('cinematic cover preserves hydration and matches requested guest-facing copy', () => {
    const cover = html.slice(html.indexOf('<!-- Opening Cover -->'), html.indexOf('<!-- Loading Page -->'));
    assert.match(cover, /data-cms="couple-short-names"/);
    assert.match(cover, /data-cms="wedding-date"/);
    assert.match(cover, />Dear,<\/p>/);
    assert.match(cover, /We apologize if there is any misspelling of name or title\./);
    assert.match(cover, /fa-envelope/);
    assert.match(cover, />OPEN INVITATION</);
    assert.match(cover, /onclick="undangan\.guest\.open\(this\)"/);
});

test('audio control is a dedicated floating widget revealed after opening', () => {
    const css = readFileSync(new URL('../css/cinematic.css', import.meta.url), 'utf8');
    assert.match(html, /class="cinematic-music-control"/);
    assert.match(html, /id="button-music"/);
    assert.match(css, /\.cinematic-music-control/);
    assert.match(css, /position:\s*fixed/);
    assert.match(css, /\.is-playing/);
    assert.match(css, /animation:\s*cinematic-music-spin/);
});

test('cover exit and hero entrance use a 1.2 second cinematic transition', () => {
    const css = readFileSync(new URL('../css/cinematic.css', import.meta.url), 'utf8');
    assert.match(css, /\.opening-cover\s*\{[\s\S]*?transition:[^;]*1\.2s/);
    assert.match(css, /\.opening-cover\.is-closing[\s\S]*?translateY\(-100%\)/);
    assert.match(css, /\.invitation-opened \.editorial-hero[\s\S]*?animation:[^;]*1\.2s/);
});

test('wedding events keep intro, akad, and reception within one section', () => {
    const events = html.match(/<section[^>]*id="events"[^>]*>[\s\S]*?<\/section>/)[0];
    assert.match(events, /aria-labelledby="events-title"/);
    assert.match(events, /<article[^>]*aria-label="Akad Nikah"/);
    assert.match(events, /<article[^>]*aria-label="Resepsi Pernikahan"/);
    assert.equal((events.match(/class="event-snap-panel"/g) || []).length, 2);
    assert.ok(html.includes('cinematic.css?v=cinematic-cover-audio-1'));
});

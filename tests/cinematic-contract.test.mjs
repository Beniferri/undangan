import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
test('cover locks both scroll roots until opened', () => {
    assert.match(html.match(/<html[^>]*>/)[0], /class="invitation-locked"/);
});

test('static navbar is replaced by an accessible seven-link menu overlay', () => {
    assert.doesNotMatch(html, /id="navbar-menu"/);
    const menu = html.match(/<div\b[^>]*id="invitation-menu"[\s\S]*?<\/div>\s*<button[^>]*id="invitation-menu-trigger"/)[0];
    assert.match(menu, /role="dialog"/);
    assert.match(menu, /aria-modal="true"/);
    assert.match(menu, /id="invitation-menu-close"/);
    assert.deepEqual([...menu.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]), ['home', 'groom', 'story', 'events', 'rsvp', 'gallery', 'gift']);
    for (const label of ['Home', 'Groom &amp; Bride', 'Love Story', 'Event Details', 'RSVP &amp; Wishes', 'Gallery', 'Wedding Gift']) {
        assert.match(menu, new RegExp(`>${label}<`));
    }
    assert.match(menu, /id="button-theme"/);
    assert.match(menu, /id="invitation-menu-trigger"/);
});

test('menu overlay styling is isolated, fullscreen, hidden by default, and motion-aware', () => {
    const css = readFileSync(new URL('../css/cinematic.css', import.meta.url), 'utf8');
    assert.match(css, /\.invitation-menu-overlay[\s\S]*position:\s*fixed/);
    assert.match(css, /\.invitation-menu-overlay[\s\S]*inset:\s*0/);
    assert.match(css, /\.invitation-menu-overlay[\s\S]*visibility:\s*hidden/);
    assert.match(css, /\.invitation-menu-overlay\.is-open[\s\S]*visibility:\s*visible/);
    assert.match(css, /\.invitation-menu-trigger[\s\S]*position:\s*fixed/);
    assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test('menu module supports open, close, escape, focus restoration, and link navigation', () => {
    const source = readFileSync(new URL('../js/app/guest/menu.js', import.meta.url), 'utf8');
    assert.match(source, /export const initInvitationMenu/);
    assert.match(source, /aria-hidden/);
    assert.match(source, /Escape/);
    assert.match(source, /focus\(/);
    assert.match(source, /setTimeout\(animate, 16\)/);
    assert.match(source, /scrollTo/);
    assert.match(source, /invitation-menu-open/);
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
    assert.ok(html.includes('cinematic.css?v=hidden-menu-3'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const file = new URL('../js/app/guest/opening.js', import.meta.url);
const module = existsSync(file) ? await import(`data:text/javascript;base64,${readFileSync(file).toString('base64')}`) : {};

function fixture(reduced = false) {
    const doc = new EventTarget();
    const motion = new EventTarget();
    motion.matches = reduced;
    const source = { dataset: { openingSrc: '/approved.mp4' } };
    const film = new EventTarget();
    film.querySelector = () => source;
    film.play = async () => { film.plays++; };
    film.pause = () => { film.pauses++; };
    film.load = () => {};
    film.plays = 0;
    film.pauses = 0;
    doc.getElementById = () => film;
    doc.hidden = false;
    const win = { matchMedia: () => motion, setTimeout: (fn) => { win.finish = fn; }, clearTimeout: () => {} };
    return { doc, win, film, source, motion };
}

test('reduced motion never loads or plays decorative video', () => {
    assert.equal(typeof module.initOpening, 'function');
    const f = fixture(true);
    module.initOpening(f.doc, f.win);
    assert.equal(f.source.src, undefined);
    assert.equal(f.film.plays, 0);
});
test('opening stops decorative playback and ignores later readiness', async () => {
    assert.equal(typeof module.initOpening, 'function');
    const f = fixture();
    module.initOpening(f.doc, f.win);
    assert.equal(f.source.src, '/approved.mp4');
    f.film.dispatchEvent(new Event('canplay'));
    await Promise.resolve();
    assert.equal(f.film.plays, 1);
    f.doc.dispatchEvent(new Event('undangan.open'));
    f.film.dispatchEvent(new Event('canplay'));
    assert.equal(f.film.plays, 1);
    assert.ok(f.film.pauses > 0);
});
test('decorative motion ends within five seconds and playback failures are safe', async () => {
    assert.equal(typeof module.initOpening, 'function');
    const f = fixture();
    f.film.play = async () => { throw new Error('blocked'); };
    module.initOpening(f.doc, f.win);
    f.film.dispatchEvent(new Event('canplay'));
    await Promise.resolve();
    f.win.finish();
    assert.ok(f.film.pauses > 0);
});

test('visibility changes cannot restart decorative video after it stops', async () => {
    assert.equal(typeof module.initOpening, 'function');
    const f = fixture();
    module.initOpening(f.doc, f.win);
    f.doc.dispatchEvent(new Event('undangan.open'));
    f.doc.dispatchEvent(new Event('visibilitychange'));
    f.film.dispatchEvent(new Event('canplay'));
    await Promise.resolve();
    assert.equal(f.film.plays, 0);
});

test('cover fallback is decorative and not mislabeled as a CMS asset', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    assert.match(html, /class="opening-image"[^>]*data-src="\.\/assets\/images\/opening-mosque\.webp"[^>]*alt="" aria-hidden="true"/);
    assert.doesNotMatch(html, /class="opening-image"[^>]*data-cms=/);
});

test('opening cover has no monogram or closing greeting and keeps separated CMS-ready names', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const cover = html.slice(html.indexOf('<!-- Opening Cover -->'), html.indexOf('<!-- Hidden Menu Overlay -->'));
    assert.doesNotMatch(cover, /opening-monogram|Wassalamualaikum Warahmatullahi Wabarakatuh/);
    assert.match(cover, /id="opening-title"[^>]*>[\s\S]*?data-cms="opening-groom-name">Daniyal<\/span>[\s\S]*?class="opening-cover-amp">&amp;<\/span>[\s\S]*?data-cms="opening-bride-name">Balqis<\/span>[\s\S]*?<\/h1>/);
    assert.match(cover, /<p class="opening-cover-kicker">THE WEDDING OF<\/p>\s*<div class="opening-cover-rule"[^>]*><\/div>\s*<h1[^>]*id="opening-title"[\s\S]*?<\/h1>\s*<div class="opening-cover-rule"[^>]*><\/div>\s*<p class="opening-cover-date" data-cms="wedding-date">17 Januari 2027<\/p>/);
    const cms = readFileSync(new URL('../js/cms.js', import.meta.url), 'utf8');
    assert.match(cms, /setCmsText\('opening-groom-name',/);
    assert.match(cms, /setCmsText\('opening-bride-name',/);
});

test('cover keeps prominent mobile names above bottom-aligned guest actions and CTA', () => {
    const css = readFileSync(new URL('../css/cinematic.css', import.meta.url), 'utf8');
    assert.match(css, /\.opening-cover-kicker,\s*body\.islamic-modern \.opening-cover-date\s*\{[^}]*font-size:\s*0\.7rem/s);
    assert.match(css, /\.opening-cover-content\s*\{[^}]*min-height:\s*100dvh;[^}]*justify-content:\s*flex-start/s);
    assert.match(css, /\.opening-cover-actions\s*\{[^}]*margin-top:\s*auto;[^}]*margin-bottom:\s*0/s);
    assert.match(css, /\.opening-guest-card\s*\{[^}]*width:\s*min\(100%, 21rem\)/s);
    assert.match(css, /@media screen and \(max-width: 576px\)\s*\{\s*body\.islamic-modern \.opening-cover-names\s*\{[^}]*font-size:\s*clamp\(4rem, 22vw, 5\.4rem\)/s);
    assert.match(css, /@media screen and \(max-height: 700px\) and \(max-width: 576px\)[\s\S]*?\.opening-cover-names\s*\{[^}]*font-size:\s*clamp\(3\.7rem, 18\.5vw, 4\.5rem\)/s);
    assert.match(readFileSync(new URL('../index.html', import.meta.url), 'utf8'), /cinematic\.css\?v=opening-bottom-names-1/);
    assert.match(css, /\.opening-cover-name,\s*body\.islamic-modern \.opening-cover-amp\s*\{[^}]*display:\s*block/s);
    assert.match(css, /\.opening-cover-names\s*\{[^}]*max-width:\s*100%[^}]*overflow-wrap:\s*anywhere/s);
    assert.doesNotMatch(css, /\.opening-monogram|\.monogram-amp/);
});

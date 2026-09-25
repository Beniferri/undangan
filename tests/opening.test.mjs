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

test('cover fallback and monogram are not mislabeled as CMS assets or couple photography', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    assert.match(html, /class="opening-image"[^>]*data-src="\.\/assets\/images\/opening-mosque\.webp"[^>]*alt="" aria-hidden="true"/);
    assert.doesNotMatch(html, /class="opening-image"[^>]*data-cms=/);
    assert.match(html, /alt="Monogram ilustratif E dan B"/);
});

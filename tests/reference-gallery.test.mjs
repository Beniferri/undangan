import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const stylesheet = new URL('../css/gallery-reference.css', import.meta.url);
const css = existsSync(stylesheet) ? readFileSync(stylesheet, 'utf8') : '';
const cms = readFileSync(new URL('../js/cms.js', import.meta.url), 'utf8');

const gallery = html.slice(html.indexOf('id="gallery"'), html.indexOf('<!-- Gift -->'));

test('gallery has two horizontal photo rows and an editorial title below', () => {
    assert.equal((gallery.match(/class="gallery-scroll"/g) || []).length, 2);
    assert.ok(gallery.indexOf('id="gallery-row-one"') < gallery.indexOf('id="gallery-row-two"'));
    assert.ok(gallery.indexOf('id="gallery-row-two"') < gallery.indexOf('>Galeri</h2>'));
    assert.doesNotMatch(gallery, /carousel|data-bs-slide/);
    assert.match(css, /\.gallery-scroll\s*\{[^}]*display:\s*flex;[^}]*overflow-x:\s*auto;/s);
    assert.match(css, /\.gallery-scroll\s*\{[^}]*overscroll-behavior-x:\s*contain;/s);
    assert.doesNotMatch(css, /touch-action:\s*pan-x\s*;/);
});

test('all six CMS photo slots stay lazy except the first and can open the existing modal by keyboard', () => {
    for (let n = 1; n <= 6; n++) {
        assert.match(gallery, new RegExp(`data-cms-gallery="${n}"[^>]*loading="${n === 1 ? 'eager' : 'lazy'}"`));
    }
    assert.equal((gallery.match(/class="gallery-item"/g) || []).length, 6);
    assert.equal((gallery.match(/type="button" class="gallery-item" onclick=/g) || []).length, 1);
    assert.equal((gallery.match(/type="button" class="gallery-item" hidden/g) || []).length, 5);
    assert.match(gallery, /id="gallery-row-two"[^>]*hidden/);
    assert.match(cms, /item\.hidden = gallery\.length === 0 \? index > 0 : index >= Math\.min\(gallery\.length, 6\)/);
    assert.match(cms, /secondGalleryRow\.hidden = gallery\.length < 3/);
    assert.match(css, /#gallery-row-two\[data-single="true"\] \.gallery-item/);
    assert.match(cms, /secondGalleryRow\.prepend\(document\.querySelector\('\[data-cms-gallery="3"\]'\)/);
    assert.equal((gallery.match(/onclick="undangan\.guest\.modal\(this\.querySelector\('img'\)\)"/g) || []).length, 6);
    assert.match(cms, /image\.closest\('\.gallery-item'\)/);
    assert.match(cms, /gallery-row-two/);
    assert.match(cms, /image\.loading = index === 0 \? 'eager' : 'lazy'/);
    assert.match(cms, /image\.dataset\.src = image\.src/);
});

test('old gallery carousel styles are removed', () => {
    for (const name of ['fullpage.css', 'editorial-refresh.css']) {
        const legacy = readFileSync(new URL(`../css/${name}`, import.meta.url), 'utf8');
        assert.doesNotMatch(legacy, /\.editorial-gallery \.carousel|\.gallery-panel \.carousel-(?:item|inner)/);
    }
});

test('new stylesheet is loaded last with a fresh cache key', () => {
    for (const sheet of ['editorial-refresh', 'gallery-reference']) {
        assert.ok(html.includes(`css/${sheet}.css?v=gallery-rows-1`));
    }
    assert.ok(html.includes('css/fullpage.css?v=home-rhythm-1'));
    assert.ok(html.indexOf('css/gallery-reference.css?v=gallery-rows-1') > html.indexOf('css/rsvp-simple.css'));
});

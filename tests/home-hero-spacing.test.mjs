import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/fullpage.css', import.meta.url), 'utf8');
const home = html.slice(html.indexOf('<!-- Home -->'), html.indexOf('<!-- Groom -->'));

test('home keeps its CMS content and scroll cue while giving each group breathing room', () => {
    for (const hook of ['cover-image', 'profile-image', 'couple-groom-name', 'couple-bride-name', 'wedding-date']) {
        assert.match(home, new RegExp(`data-cms="${hook}"`));
    }
    assert.match(home, /class="cover-scroll-cue" href="#groom"/);
    assert.match(css, /\.editorial-hero \[data-cms="profile-image"\]\s*\{[^}]*margin-block:\s*1rem !important/s);
    assert.match(css, /\.editorial-hero \[data-cms="couple-names"\]\s*\{[^}]*margin-block:\s*1rem !important/s);
    assert.match(css, /\.editorial-hero \[data-cms="wedding-date"\]\s*\{[^}]*margin-block:\s*0\.75rem !important/s);
    assert.match(html, /fullpage\.css\?v=home-rhythm-1/);
});

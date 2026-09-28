import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('../css/gift-inline.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const js = readFileSync(new URL('../js/app/guest/guest.js', import.meta.url), 'utf8');

test('gift panel widens before its clipped content expands and rows fade in', () => {
    assert.match(css, /\.gift-options\s*\{[^}]*grid-template-rows:\s*0fr/s);
    assert.match(css, /\.gift-shell\.is-open \.gift-options\s*\{[^}]*grid-template-rows:\s*1fr/s);
    assert.match(css, /\.gift-content\s*\{[^}]*overflow:\s*hidden/s);
    assert.match(css, /\.gift-shell\.is-open \.gift-item\s*\{[^}]*opacity:\s*1/s);
    assert.match(html, /class="gift-content"/);
    assert.match(html, /css\/gift-inline\.css\?v=gift-close-1/);
});

test('collapsed gift content is inert rather than removed from layout for animation', () => {
    assert.match(html, /id="gift-options"[^>]*inert/);
    assert.match(js, /options\.removeAttribute\('inert'\)/);
    assert.match(js, /options\.setAttribute\('inert', ''\)/);
    assert.doesNotMatch(js, /options\.hidden = (true|false)/);
    assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

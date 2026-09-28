import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('../css/gift-inline.css', import.meta.url), 'utf8');

test('SEND GIFT stays out of flow while panel collapses', () => {
    assert.match(css, /\.gift-shell\s*\{[^}]*position:\s*relative/s);
    assert.match(css, /\.gift-shell\s*\{[^}]*min-height:\s*2\.75rem/s);
    assert.match(css, /\.gift-shell \.gift-reveal-button\s*\{[^}]*position:\s*absolute/s);
    assert.doesNotMatch(css, /\.gift-shell\.is-open \.gift-reveal-button\s*\{[^}]*position:\s*absolute/s);
    assert.match(css, /\.gift-shell\s*\{[^}]*transition:\s*width 500ms ease-in-out 850ms/s);
    assert.match(css, /\.gift-shell\.is-open\s*\{[^}]*transition:\s*width 500ms ease-in-out,/s);
});

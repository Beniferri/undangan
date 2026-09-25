import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const cinematic = readFileSync(new URL('../css/cinematic.css', import.meta.url), 'utf8');
const editorial = readFileSync(new URL('../css/editorial-refresh.css', import.meta.url), 'utf8');

test('map fallbacks include the full confirmed venue address', () => {
    const links = [...html.matchAll(/href="([^"]+)"[^>]*data-cms-event-map="([12])"/g)];
    assert.equal(links.length, 2);
    for (const [, href] of links) {
        assert.match(href, /^https:\/\/www\.google\.com\/maps\/search\//);
        assert.match(href, /Jl\.\+Gito\+Gati/i);
        assert.match(href, /55512/i);
    }
});

test('map label is readable while keeping a 44px touch target', () => {
    assert.match(cinematic, /\.editorial-events \.event-map-button\s*\{[^}]*min-height:\s*2\.75rem[^}]*font-size:\s*0\.875rem/s);
    assert.match(cinematic, /@media screen and \(max-width: 576px\)[\s\S]*?\.editorial-events \.event-map-button\s*\{[^}]*min-height:\s*2\.75rem[^}]*font-size:\s*0\.875rem/s);
});

test('dress-code copy is direct and does not invent additional requirements', () => {
    assert.match(html, /Untuk acara pernikahan, silakan mengenakan busana batik dan alas kaki yang nyaman\./);
    assert.equal((html.match(/busana batik dan alas kaki yang nyaman/gi) || []).length, 1);
    assert.doesNotMatch(html, /dress code berikut|beskap wajib|warna tertentu/i);
});

test('desktop hero clipping is scoped to the invitation content', () => {
    assert.match(cinematic, /body\.islamic-modern main\s*\{[^}]*overflow-x:\s*clip/s);
    assert.doesNotMatch(cinematic, /body\s*\{[^}]*overflow-x:\s*clip/s);
});

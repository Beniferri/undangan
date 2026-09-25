import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('invitation keeps one calendar action near the wedding date', () => {
    assert.equal((html.match(/data-calendar-button/g) || []).length, 1);
    assert.match(html, /Simpan ke Google Calendar/);
});

test('event heading uses Indonesian copy', () => {
    assert.match(html, /id="events-title">Acara Pernikahan</);
    assert.doesNotMatch(html, /id="events-title">Wedding Events</);
});

test('gift card avoids repeating the footer thank-you message', () => {
    assert.doesNotMatch(html, /gift-thanks/);
    assert.match(html, /footer-thanks/);
});

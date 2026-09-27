import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('one calendar action sits below the countdown, not on the first page', () => {
    const home = html.slice(html.indexOf('id="home"'), html.indexOf('<!-- Groom -->'));
    const countdown = html.slice(html.indexOf('id="countdown"'), html.indexOf('<!-- Dresscode -->'));
    assert.doesNotMatch(home, /data-calendar-button/);
    assert.equal((html.match(/data-calendar-button/g) || []).length, 1);
    assert.match(countdown, /id="second"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<button class="countdown-calendar-button" type="button" data-calendar-button>/);
    assert.match(countdown, /Simpan ke Google Calendar/);
});

test('event heading uses Indonesian copy', () => {
    assert.match(html, /id="events-title">Acara Pernikahan</);
    assert.doesNotMatch(html, /id="events-title">Wedding Events</);
});

test('gift card avoids repeating the footer thank-you message', () => {
    assert.doesNotMatch(html, /gift-thanks/);
    assert.match(html, /footer-thanks/);
});

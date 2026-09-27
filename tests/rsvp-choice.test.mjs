import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { initAttendance } from '../js/app/guest/attendance.js';

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const html = source('index.html');

test('attendance is a single radio choice and count is conditionally hidden', () => {
    const section = html.match(/<section[^>]*id="rsvp"[\s\S]*?<\/section>/)?.[0];
    assert.ok(section);
    assert.match(section, /type="radio"[^>]*name="attendance"[^>]*value="1"/);
    assert.match(section, /type="radio"[^>]*name="attendance"[^>]*value="2"/);
    assert.match(section, /id="guest-count-field"[^>]*hidden/);
    assert.doesNotMatch(section, /<select[^>]*id="form-presence"/);
});

test('attendance changes reveal guest count only for hadir, including restored choices', () => {
    const listeners = new Map();
    const present = { value: '1', checked: false, addEventListener: (type, fn) => listeners.set('present', fn) };
    const absent = { value: '2', checked: false, addEventListener: (type, fn) => listeners.set('absent', fn) };
    const field = { hidden: true };
    const doc = {
        querySelectorAll: () => [present, absent],
        querySelector: () => [present, absent].find((option) => option.checked),
        getElementById: () => field,
    };
    initAttendance(doc);
    assert.equal(field.hidden, true);
    present.checked = true;
    listeners.get('present')();
    assert.equal(field.hidden, false);
    present.checked = false;
    absent.checked = true;
    listeners.get('absent')();
    assert.equal(field.hidden, true);
});

test('RSVP payload does not send a stale count when absent', () => {
    assert.match(html, /guest_count:guestCount/);
    assert.match(html, /presence === '1' \? Number\(document\.getElementById\('form-count'\)\.value\) : 1/);
    assert.match(html, /querySelector\('input\[name="attendance"\]:checked'\)/);
});

test('public forms no longer offer GIF creation while old wishes can still display', () => {
    assert.doesNotMatch(html, /gif-form-default|comment\.gif\.open|fa-photo-film/);
    assert.doesNotMatch(source('js/app/components/card.js'), /comment\.gif\.open|gif-form-\$\{id\}/);
    assert.doesNotMatch(source('js/app/components/comment.js'), /gif\.isOpen\(|\n        gif,\n/);
    assert.match(source('js/app/components/card.js'), /gif\.get\(c\.gif_url\)/);
});

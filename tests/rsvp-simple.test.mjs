import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('simplified RSVP preserves the existing submission contract', () => {
    const html = read('index.html');
    const section = html.match(/<section[^>]*id="rsvp"[\s\S]*?<\/section>/)?.[0];
    assert.ok(section);
    assert.match(section, /rsvp-simple/);
    for (const id of ['form-name', 'attendance-present', 'attendance-absent', 'form-count', 'form-comment', 'comment-form-default']) {
        assert.match(section, new RegExp(`id="${id}"`));
    }
    assert.match(section, /undangan\.comment\.send\(this\)/);
    assert.doesNotMatch(section, /undangan\.comment\.gif\.open/);
    assert.doesNotMatch(section, /id="information"|alert-info|border rounded-5 shadow/);
    assert.match(html, /css\/rsvp-simple\.css\?v=rsvp-choice-1/);
    assert.match(html, /dist\/guest\.js\?v=gallery-rows-1/);
    const guest = read('js/app/guest/guest.js');
    assert.doesNotMatch(guest, /closeInformation|information\.get\('info'\)/);
    assert.match(guest, /initAttendance\(\)/);
    const css = read('css/rsvp-simple.css');
    assert.match(css, /\.rsvp-simple \.rsvp-surface\s*\{[^}]*border:\s*0;[^}]*box-shadow:\s*none;/s);
    assert.match(css, /\.rsvp-simple \.form-control,[\s\S]*?\.rsvp-simple \.form-select\s*\{[^}]*min-height:\s*2\.75rem;/s);
    assert.match(css, /body\.islamic-modern\[data-bs-theme="dark"\] \.rsvp-simple \.form-control/);
    assert.doesNotMatch(css, /height:\s*100(?:d|s|v)vh/);
});

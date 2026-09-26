import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/guest.css', import.meta.url), 'utf8');

test('RSVP presence choices use requested attendance wording', () => {
    const presence = html.match(/<select[^>]*id="form-presence"[^>]*>[\s\S]*?<\/select>/)[0];
    assert.match(presence, /Insyaallah hadir/);
    assert.doesNotMatch(presence, />[^<]*Datang</);
});

test('requested design tokens and type families are available locally', () => {
    assert.match(css, /--color-primary:\s*#14432A/i);
    assert.match(css, /@font-face[\s\S]*Marcellus/);
    assert.match(css, /@font-face[\s\S]*Jost/);
    assert.match(css, /@font-face[\s\S]*Amiri/);
    assert.match(css, /@font-face[\s\S]*Cormorant Garamond/);
});

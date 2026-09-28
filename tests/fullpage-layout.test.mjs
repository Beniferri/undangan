import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/fullpage.css', import.meta.url), 'utf8');

test('compact layout loads after the base theme and keeps sections naturally expandable', () => {
    assert.match(html, /cinematic\.css\?v=menu-type-1[\s\S]*fullpage\.css\?v=rsvp-simple-1/);
    assert.match(css, /\.editorial-section:not\(\.editorial-hero\)\s*\{[^}]*min-height:\s*100dvh;/s);
    assert.doesNotMatch(css, /(?:^|[;{])\s*height:\s*100(?:d|s|v)vh\s*;/m);
    assert.doesNotMatch(css, /\.editorial-section:not\(\.editorial-hero\)\s*\{[^}]*overflow:\s*hidden/s);
    assert.match(css, /\.editorial-rsvp-form #form-comment\s*\{[^}]*min-height:\s*4\.5rem/s);
    assert.match(css, /\.editorial-events \.event-map-button\s*\{[^}]*min-height:\s*2\.75rem/s);
    assert.match(css, /\.editorial-story \.story-panel \.overflow-y-scroll\s*\{[^}]*overscroll-behavior-y:\s*contain/s);
});

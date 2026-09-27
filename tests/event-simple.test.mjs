import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('event list retains CMS fields and separate map links without decorative cards', () => {
    const html = read('index.html');
    const section = html.match(/<section[^>]*id="events"[\s\S]*?<\/section>/)?.[0];
    assert.ok(section);
    assert.match(section, /class="[^"]*event-simple/);
    for (const index of [1, 2]) {
        for (const field of ['name', 'date', 'time', 'venue']) {
            assert.match(section, new RegExp(`data-cms="event-${index}-${field}"`));
        }
        assert.match(section, new RegExp(`data-cms-event-map="${index}"`));
    }
    assert.doesNotMatch(section, /event-(?:bg|intro)-pattern|event-order|editorial-lead/);
    assert.match(html, /css\/event-simple\.css\?v=event-simple-1/);
    const css = read('css/event-simple.css');
    assert.match(css, /\.event-simple \.event-snap-panel \+ \.event-snap-panel/);
    assert.match(css, /\.event-simple \.event-map-button:focus-visible/);
    assert.doesNotMatch(css, /height:\s*100(?:d|s|v)vh/);
});

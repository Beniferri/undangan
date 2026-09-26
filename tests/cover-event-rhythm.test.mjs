import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const cinematic = readFileSync(new URL('../css/cinematic.css', import.meta.url), 'utf8');
const editorial = readFileSync(new URL('../css/editorial-refresh.css', import.meta.url), 'utf8');
const guest = readFileSync(new URL('../css/guest.css', import.meta.url), 'utf8');

test('cover actions stay grouped and CMS guest hooks survive', () => {
    const cover = html.slice(html.indexOf('<!-- Opening Cover -->'), html.indexOf('<!-- Hidden Menu Overlay -->'));
    assert.match(cover, /class="opening-cover-actions"[\s\S]*?id="guest-name"[\s\S]*?class="btn opening-cover-cta"/);
    assert.match(cinematic, /\.opening-cover-actions\s*\{[^}]*margin-top:\s*auto;[^}]*margin-bottom:\s*0/s);
    assert.match(cinematic, /--cinema-gold:\s*#f1dfb9/);
});

test('event markers are removed while schedule data and hierarchy remain', () => {
    const events = html.slice(html.indexOf('<!-- Event Details -->'), html.indexOf('<!-- Countdown -->'));
    assert.doesNotMatch(events, /event-timeline-marker/);
    assert.doesNotMatch(guest + cinematic, /event-timeline-marker/);
    for (const n of [1, 2]) {
        assert.match(events, new RegExp(`data-cms="event-${n}-name"`));
        assert.match(events, new RegExp(`data-cms-event-map="${n}"`));
    }
    assert.match(cinematic, /\.editorial-events \.event-card h3\s*\{[^}]*font-size:\s*clamp\(2rem, 8vw, 2\.5rem\)/s);
    assert.match(cinematic, /\.editorial-events \.event-order\s*\{[^}]*font-size:\s*0\.875rem/s);
});

test('story RSVP and wishes share section spacing without clipped RSVP height', () => {
    assert.match(editorial, /\.editorial-section:is\(\.editorial-story, \.editorial-rsvp-form, \.editorial-wishes\)\s*\{[^}]*height:\s*auto;[^}]*padding-block:\s*clamp\(4\.5rem, 8vh, 6rem\)/s);
    assert.match(editorial, /\.editorial-wishes \.wishes-panel\s*\{[^}]*width:\s*min\(100%, 43rem\)/s);
});

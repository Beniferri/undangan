import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = (name) => readFileSync(new URL(`../css/${name}`, import.meta.url), 'utf8');

test('event details remain readable and map actions meet minimum touch size on mobile', () => {
    const styles = css('cinematic.css');

    assert.match(styles, /\.event-snap-panel \.event-time,[\s\S]*?\.event-snap-panel \.event-venue\s*\{[^}]*font-size:\s*max\(0\.875rem, 1em\)/s);
    assert.match(styles, /\.event-snap-panel \.event-map-button\s*\{[^}]*min-height:\s*2\.75rem/s);
});

test('calendar CTA meets minimum touch size and gold gift labels have readable contrast', () => {
    const styles = `${css('editorial-refresh.css')}\n${css('guest.css')}`;

    assert.match(styles, /\[data-calendar-button\]\s*\{[^}]*min-height:\s*2\.75rem/s);
    assert.match(styles, /\.gift-detail-label\s*\{[^}]*color:\s*#76500f[^}]*font-size:\s*0\.75rem/s);
});

test('root sizing avoids desktop 100vw overflow and reduced motion disables smooth scrolling', () => {
    const styles = css('common.css');

    assert.doesNotMatch(styles, /html\s*\{[^}]*width:\s*100vw/i);
    assert.match(styles, /@media \(prefers-reduced-motion:\s*reduce\)\s*\{\s*html\s*\{\s*scroll-behavior:\s*auto/s);
    assert.match(css('editorial-refresh.css'), /\.editorial-hero\s*\{\s*overflow-x:\s*clip/s);
});

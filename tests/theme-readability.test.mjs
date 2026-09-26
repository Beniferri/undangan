import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/editorial-refresh.css', import.meta.url), 'utf8');
const theme = readFileSync(new URL('../js/common/theme.js', import.meta.url), 'utf8');

test('theme fixes use selectors on the theme-bearing body and a refreshed CSS URL', () => {
    assert.match(html, /editorial-refresh\.css\?v=theme-readability-1/);
    assert.match(html, /dist\/guest\.js\?v=theme-readability-1/);
    assert.doesNotMatch(theme, /\.style\.setProperty\(['"]color['"], '#ead8b7'/);
    assert.match(css, /body\.islamic-modern\[data-bs-theme="dark"\] \.gift-detail-label\s*\{[^}]*color:\s*#ead8b7/s);
    assert.match(css, /body\.islamic-modern\[data-bs-theme="dark"\] \.editorial-section\.editorial-footer\s*\{[^}]*background-image:\s*none\s*!important/s);
    assert.match(css, /body\.islamic-modern\[data-bs-theme="light"\] \.editorial-section\.editorial-footer\s*\{[^}]*color:\s*#183d35\s*!important/s);
    assert.match(css, /body\.islamic-modern\[data-bs-theme="dark"\] \.editorial-section\.editorial-footer\s*\{[^}]*background-color:\s*#10251f\s*!important/s);
    for (const selector of [
        '.editorial-rsvp-form > .container > .border',
        '.gift-panel',
        '.editorial-events .event-map-button',
    ]) {
        assert.ok(css.includes(`body.islamic-modern[data-bs-theme="dark"] ${selector}`), `dark selector missing: ${selector}`);
    }
});

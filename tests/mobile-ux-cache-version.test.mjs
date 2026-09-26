import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('mobile UX CSS fixes use a fresh cache key', () => {
    for (const stylesheet of ['guest.css', 'editorial-refresh.css']) {
        assert.match(html, new RegExp(`\\./css/${stylesheet}\\?v=mobile-ux-2`));
    }
    assert.match(html, /\.\/css\/cinematic\.css\?v=ui-refresh-1/);
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('mobile UX CSS fixes use a fresh cache key', () => {
    assert.match(html, /\.\/css\/guest\.css\?v=ui-balance-1/);
    assert.match(html, /\.\/css\/editorial-refresh\.css\?v=ui-balance-1/);
    assert.match(html, /\.\/css\/cinematic\.css\?v=ui-balance-1/);
});

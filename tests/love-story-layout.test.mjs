import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const story = html.slice(html.indexOf('<!-- Kisah Kami -->'), html.indexOf('<!-- Acara -->'));

test('love story restores the previous video, reveal action and bounded timeline layout', () => {
    assert.match(story, /id="video-love-stroy"[\s\S]*?data-src="\.\/assets\/video\/265501_tiny\.mp4"/);
    assert.match(story, />Baca Kisah Kami<\/button>/);
    assert.match(story, /overflow-y-scroll overflow-x-hidden p-2 with-scrollbar" style="height: 15rem;/);
    assert.match(story, /data-cms="story-1-title"/);
    assert.match(story, /data-cms="story-2-title"/);
    assert.match(story, /data-cms="story-3-title"/);
});

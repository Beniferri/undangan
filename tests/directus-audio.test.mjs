import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const cms = read('js/cms.js');
const guest = read('js/app/guest/guest.js');
const html = read('index.html');

test('published audio_url hydrates the audio source without erasing static fallback', () => {
    assert.match(cms, /wedding\.audio_url/);
    assert.match(cms, /dataset\.audio =/);
    assert.match(html, /data-audio="\.\/assets\/music\/pure-love-304010\.mp3"/);
    assert.match(html, /data-audio-fallback="\.\/assets\/music\/pure-love-304010\.mp3"/);
    assert.match(guest, /aud\.load\(\)/);
    assert.match(read('js/app/guest/audio.js'), /await Promise\.resolve\(window\.cmsReady\)/);
    assert.match(html, /dist\/cms\.js\?v=gift-bank-1/);
    assert.match(html, /dist\/guest\.js\?v=music-directus-1/);
});

test('published audio URL allows local audio or Directus file assets, not arbitrary schemes', () => {
    assert.match(cms, /const safeAudioUrl =/);
    assert.match(cms, /https:/);
    assert.match(cms, /directus\.benifin\.my\.id/);
});

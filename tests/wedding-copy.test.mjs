import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const cms = readFileSync(new URL('../js/cms.js', import.meta.url), 'utf8');

test('Qur’an excerpt is labeled and keeps its source', () => {
    assert.match(html, /Dia menjadikan di antaramu rasa cinta dan kasih sayang/);
    assert.match(html, /QS\. Ar-Rum: 21 · petikan ayat/);
    assert.match(html, /QS\. Adh-Dhariyat: 49/);
});

test('story keeps its three CMS hooks and concise fallback copy', () => {
    for (let i = 1; i <= 3; i++) {
        assert.match(html, new RegExp(`data-cms="story-${i}-title"`));
        assert.match(html, new RegExp(`data-cms="story-${i}-body"`));
    }
    assert.match(html, /Tahun 2022, sebuah perkenalan sederhana/);
    assert.match(html, /restu kedua keluarga pada tahun 2026/);
    assert.doesNotMatch(html, /💌 Pertemuan|💞 Proses Mengenal|💍 Menuju Hari Bahagia/);
});

test('copy and CMS metadata fallback do not revive an old couple', () => {
    assert.match(html, /Kehadiran dan doa Anda sudah sangat berarti/);
    assert.match(html, /<a href="#gift">Tanda Kasih<\/a>/);
    assert.match(cms, /Dengan memohon rahmat Allah, \$\{wedding\.groom_name\} dan \$\{wedding\.bride_name\}/);
    assert.match(cms, /setStructuredData\(wedding, events, seoDescription\)/);

    const jsonLd = { textContent: '' };
    const source = cms.slice(cms.indexOf('const setStructuredData ='), cms.indexOf('const formatDate ='));
    vm.runInNewContext(`${source}\nsetStructuredData(wedding, [], description);`, {
        document: { querySelector: () => jsonLd },
        weddingImageUrl: () => '',
        window: { location: { href: 'https://example.org/' } },
        wedding: { groom_name: 'Daniyal', bride_name: 'Balqis', wedding_date: '2027-01-17', seo_description: 'Pasangan lama' },
        description: 'Undangan Daniyal dan Balqis',
    });
    assert.equal(JSON.parse(jsonLd.textContent).description, 'Undangan Daniyal dan Balqis');
});

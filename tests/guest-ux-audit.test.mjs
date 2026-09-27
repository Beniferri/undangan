import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const html = source('index.html');

test('each event card gives its own date and a directions action', () => {
    for (const n of [1, 2]) {
        assert.match(html, new RegExp(`data-cms="event-${n}-date"[^>]*>Minggu, 17 Januari 2027<`));
    }
    assert.equal((html.match(/data-cms-event-map="[12]"[^>]*>Google Maps<\/a>/g) || []).length, 2);
    const cms = source('js/cms.js');
    assert.match(cms, /setCmsText\(`event-\$\{index \+ 1\}-date`, formatDate\(event\.event_date, wedding\.timezone, true\)\)/);
    assert.match(cms, /dateElement\.parentElement\.hidden = !event\.event_date/);
    assert.doesNotMatch(cms, /\[1, 2\]\.forEach\(\(index\) => setCmsText\(`event-\$\{index\}-date`, formatDate\(wedding\.wedding_date/);
});

test('calendar reads hydrated event dates for its range and event descriptions', () => {
    const js = source('js/app/guest/guest.js');
    assert.match(js, /dataset\.eventDate/);
    assert.match(js, /parseDate\(firstDate, timezone\)/);
    assert.match(js, /parseDate\(secondDate, timezone\)/);
    assert.match(js, /firstDateLabel/);
    assert.match(js, /secondDateLabel/);
});

test('RSVP communicates its combined action and uses Indonesian validation', () => {
    assert.match(html, /Kirim Konfirmasi &amp; Ucapan/);
    assert.match(html, /Pilih kehadiran, lalu tulis doa Anda/);
    assert.match(html, /Pilih konfirmasi kehadiran terlebih dahulu/);
    assert.doesNotMatch(source('js/app/components/comment.js'), /Please select your attendance status/);
});

test('gift choices are reconciled after CMS hydration and mismatched owners are never exposed', () => {
    const js = source('js/app/guest/guest.js');
    assert.match(js, /Promise\.resolve\(window\.cmsReady\)\.then\(refreshGiftAvailability\)/);
    assert.ok(/const refreshGiftAvailability = \(\) =>/.test(js));
    assert.match(js, /ownerName === recipientName/);
    assert.match(js, /button\.hidden = !available/);
    assert.match(js, /toggle\.hidden = !hasAvailableGift/);
    assert.match(html, /id="gift-toggle"[^>]* hidden>/);
});

test('CMS never hydrates a mismatched gift owner into the page', () => {
    const cms = source('js/cms.js');
    assert.match(cms, /owner\.trim\(\) !== recipient\.trim\(\)/);
    assert.match(cms, /setGift\(groomGift, 'gift-groom-account-name', 'gift-groom-account-number', wedding\.groom_name\)/);
    assert.match(cms, /setGift\(brideGift, 'gift-bride-account-name', 'gift-bride-account-number', wedding\.bride_name\)/);
});

test('mobile controls have readable type and at least 44px hit area without clipping RSVP', () => {
    const css = `${source('css/guest.css')}\n${source('css/cinematic.css')}\n${source('css/editorial-refresh.css')}`;
    assert.match(css, /\.gift-detail-copy\s*\{[^}]*min-width:\s*2\.75rem;[^}]*min-height:\s*2\.75rem/s);
    assert.match(css, /\.cinematic-music-control \.btn\s*\{[^}]*min-width:\s*2\.75rem;[^}]*min-height:\s*2\.75rem/s);
    assert.match(css, /\.editorial-rsvp-form \.form-control,[\s\S]*?\.editorial-rsvp-form \.form-select\s*\{[^}]*font-size:\s*1rem/s);
    assert.match(css, /\.editorial-rsvp-form\s*\{[^}]*min-height:\s*100svh;[^}]*overflow:\s*visible/s);
});

test('gallery prioritizes the visible slide while retaining lazy secondary slides', () => {
    const cms = source('js/cms.js');
    assert.match(cms, /image\.loading = index === 0 \? 'eager' : 'lazy'/);
    assert.match(html, /data-cms-gallery="1"[^>]*loading="eager"/);
    for (const n of [2, 3, 4, 5, 6]) {
        assert.match(html, new RegExp(`data-cms-gallery="${n}"[^>]*loading="lazy"`));
    }
    assert.ok(cms.indexOf("image.loading = index === 0 ? 'eager' : 'lazy'") < cms.indexOf("image.src = item.directus_file_id"));
    const loader = source('js/app/guest/image.js');
    assert.match(loader, /el\.hasAttribute\('data-cms-gallery'\)/);
    assert.match(loader, /getByGallery\(el\)/);
    assert.match(loader, /progress\.invalid\('image'\)/);
    assert.match(loader, /progress\.complete\('image', true\)/);
});

test('navigation and copy feedback use local language', () => {
    assert.match(html, /aria-label="Navigasi undangan"/);
    assert.match(html, /aria-label="Tutup pemberitahuan"/);
});

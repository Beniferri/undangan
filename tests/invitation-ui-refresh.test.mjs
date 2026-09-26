import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const cinematic = readFileSync(new URL('../css/cinematic.css', import.meta.url), 'utf8');
const editorial = readFileSync(new URL('../css/editorial-refresh.css', import.meta.url), 'utf8');

test('opening cover no longer includes a Quran quotation excerpt', () => {
    const cover = html.slice(html.indexOf('<!-- Opening Cover -->'), html.indexOf('<!-- Loading Page -->'));
    assert.doesNotMatch(cover, /opening-verse|QS\.|وَجَعَلَ|rasa kasih dan sayang/i);
});

test('menu trigger is a minimal top-right control and existing menu remains available', () => {
    assert.match(html, /id="invitation-menu-trigger"/);
    assert.match(cinematic, /\.invitation-menu-trigger\s*\{[^}]*top:\s*max\([^;]+[^}]*right:\s*max\(/s);
    assert.doesNotMatch(cinematic, /\.invitation-menu-trigger\s*\{[^}]*bottom:/s);
    assert.match(html, /id="invitation-menu"/);
    assert.match(html, /<svg viewBox="0 0 24 24" aria-hidden="true">\s*<path d="M3 8h18M8 16h13"\/>/);
    const trigger = cinematic.match(/body\.islamic-modern \.invitation-menu-trigger\s*\{([^}]*)\}/)?.[1] || '';
    for (const declaration of [/width:\s*2\.75rem/, /height:\s*2\.75rem/, /border:\s*0/, /border-radius:\s*0/, /background:\s*transparent/, /box-shadow:\s*none/, /backdrop-filter:\s*none/]) {
        assert.match(trigger, declaration);
    }
    assert.match(cinematic, /\.invitation-menu-trigger:hover,[\s\S]*?\.invitation-menu-trigger:focus-visible\s*\{[^}]*background:\s*transparent/);
    assert.match(cinematic, /\.invitation-menu-trigger svg\s*\{[^}]*filter:\s*drop-shadow\(/s);
});

test('music control is smaller and fixed at bottom-left', () => {
    assert.match(cinematic, /\.cinematic-music-control\s*\{[^}]*left:\s*max\([^;]+[^}]*bottom:\s*max\(/s);
    assert.doesNotMatch(cinematic, /\.cinematic-music-control\s*\{[^}]*right:/s);
    assert.match(cinematic, /\.cinematic-music-control \.btn\s*\{[^}]*width:\s*2\.5rem[^}]*height:\s*2\.5rem/s);
});

test('theme toggle is a compact fixed bottom-right control', () => {
    assert.match(html, /id="button-theme"/);
    assert.match(cinematic, /\.invitation-theme-control\s*\{[^}]*right:\s*max\([^;]+[^}]*bottom:\s*max\(/s);
    assert.match(cinematic, /\.invitation-theme-control\s*\{[^}]*width:\s*2\.5rem[^}]*height:\s*2\.5rem/s);
});

test('dress section includes accessible color swatches', () => {
    const dress = html.slice(html.indexOf('id="dresscode"'), html.indexOf('<!-- Galeri -->'));
    assert.match(dress, /dress-palette/);
    assert.equal((dress.match(/class="dress-swatch dress-swatch-/g) || []).length, 4);
    assert.match(dress, /role="group" aria-label="Contoh warna batik"/);
    for (const color of ['Zamrud', 'Sage', 'Champagne', 'Ivory']) {
        assert.match(dress, new RegExp(`role="img" aria-label="${color}"`));
    }
    assert.match(dress, /Pilihan warna sebagai inspirasi, bukan ketentuan\./);
    assert.match(editorial, /\.editorial-dresscode \.dress-swatch/);
});

test('gift contains no bank brand wording and CMS gift account data remains', () => {
    const gift = html.slice(html.indexOf('id="gift"'), html.indexOf('<!-- RSVP Form -->'));
    assert.doesNotMatch(gift, /Bank Syariah Indonesia|\bBSI\b/i);
    assert.match(gift, /gift-groom-account-number/);
    assert.match(gift, /gift-bride-account-number/);
    assert.match(gift, /gift-home-address/);
});

test('Arabic sign-off and updated credit sit at the bottom of the footer', () => {
    const footer = html.slice(html.indexOf('id="footer"'), html.indexOf('</section>', html.indexOf('id="footer"')));
    assert.match(footer, /font-arabic/);
    assert.match(footer, /Beta Storia Wedding Invitation/);
    assert.ok(footer.indexOf('Beta Storia Wedding Invitation') > footer.indexOf('footer-thanks'));
    assert.ok(footer.indexOf('Beta Storia Wedding Invitation') > footer.indexOf('font-arabic'));
    assert.doesNotMatch(html, /Beta Storia Wedding Planner/);
});

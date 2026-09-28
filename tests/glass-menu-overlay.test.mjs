import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/cinematic.css', import.meta.url), 'utf8');
const menu = readFileSync(new URL('../js/app/guest/menu.js', import.meta.url), 'utf8');

test('menu close button stays at the top right of the expanding card', () => {
    const panel = html.slice(html.indexOf('id="invitation-menu"'), html.indexOf('id="button-theme"'));
    assert.match(panel, /class="invitation-menu-header"[\s\S]*?id="invitation-menu-close"/);
    assert.match(panel, /fa-xmark/);
    assert.match(css, /\.invitation-menu-close\s*\{[^}]*position:\s*absolute[^}]*top:\s*2px[^}]*right:\s*11px/s);
});

test('menu expands from the top right into a glass panel without a page scrim', () => {
    const panel = css.match(/body\.islamic-modern \.invitation-menu-surface\s*\{([^}]*)\}/)?.[1] || '';
    const opened = css.match(/body\.islamic-modern \.invitation-menu-overlay\.is-open \.invitation-menu-surface\s*\{([^}]*)\}/)?.[1] || '';
    assert.match(css, /\.invitation-menu-overlay\s*\{[^}]*position:\s*fixed[^}]*inset:\s*0/s);
    assert.match(panel, /top:\s*max\(12px, env\(safe-area-inset-top\)\)/);
    assert.match(panel, /right:\s*max\(12px, env\(safe-area-inset-right\)\)/);
    assert.match(panel, /width:\s*68px;[^}]*height:\s*50px/);
    assert.match(opened, /width:\s*min\(400px, calc\(100vw - 24px\)\)/);
    assert.match(opened, /height:\s*min\(640px, calc\(100dvh - 24px\)\)/);
    assert.match(css, /@media screen and \(max-width: 576px\)\s*\{[\s\S]*?\.invitation-menu-overlay\.is-open \.invitation-menu-surface\s*\{[^}]*width:\s*min\(400px, calc\(100vw - 39px\)\);[^}]*height:\s*min\(500px, calc\(100dvh - 24px\)\);[^}]*padding:\s*60px 20px 12px 10px;/);
    assert.match(opened, /background:\s*rgba\(0, 0, 0, 0\.48\)/);
    assert.match(opened, /backdrop-filter:\s*blur\(18px\)/);
    assert.match(panel, /transition:\s*width 0\.65s ease-in-out/);
});

test('navigation labels use the reference typography rhythm without changing the site font', () => {
    const nav = css.match(/body\.islamic-modern \.invitation-menu-nav\s*\{([^}]*)\}/)?.[1] || '';
    const link = css.match(/body\.islamic-modern \.invitation-menu-nav a\s*\{([^}]*)\}/)?.[1] || '';
    assert.match(nav, /gap:\s*12px;/);
    assert.match(link, /padding:\s*12px 24px;/);
    assert.match(link, /font:\s*400 32px\/1 Marcellus, Georgia, serif;/);
    assert.match(css, /@media screen and \(max-width: 576px\)[\s\S]*?\.invitation-menu-nav\s*\{[^}]*gap:\s*0;[^}]*\}[\s\S]*?\.invitation-menu-nav a\s*\{[^}]*font-size:\s*28px;/);
    assert.match(css, /@media screen and \(max-width: 360px\)[\s\S]*?\.invitation-menu-nav a\s*\{[^}]*padding-inline:\s*12px;/);
});

test('menu links fade in from blur with staggered timing and reduced-motion support', () => {
    const link = css.match(/body\.islamic-modern \.invitation-menu-nav a\s*\{([^}]*)\}/)?.[1] || '';
    assert.match(link, /opacity:\s*0;[^}]*filter:\s*blur\(10px\)/);
    assert.match(css, /\.is-open \.invitation-menu-nav a:nth-child\(7\) \{ transition-delay: 1\.25s; \}/);
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.invitation-menu-overlay\.is-open,[\s\S]*?transition:\s*none/);
});

test('menu trap ignores the hidden gift link when choosing its last focus target', () => {
    assert.match(menu, /const visibleLinks = Array\.from\(links\)\.filter\(\(link\) => !link\.hidden\)/);
    assert.match(menu, /const last = visibleLinks\[visibleLinks\.length - 1\] \|\| first/);
    assert.match(menu, /if \(link\.hidden \|\| target\?\.hidden\)/);
});

test('menu items are clean text without side icons, while retaining hover and active color', () => {
    assert.match(css, /\.invitation-menu-nav a:hover[\s\S]*?transform:\s*translateX\(5px\)/);
    assert.match(css, /\.invitation-menu-nav a\.is-active\s*\{[^}]*color:/);
    assert.doesNotMatch(css, /\.invitation-menu-nav a(?:\.is-active)?::(?:before|after)\s*\{/);
    const nav = html.match(/<nav class="invitation-menu-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1] || '';
    assert.doesNotMatch(nav, /<(?:i|svg|img)\b/);
    assert.match(menu, /classList\.toggle\('is-active'/);
    assert.match(menu, /getBoundingClientRect\(\)\.top <= threshold/);
    assert.match(menu, /addEventListener\('scroll', updateActive, \{ passive: true \}\)/);
    assert.match(html, /href="#home" class="is-active" aria-current="page">Beranda<\/a>/);
    assert.match(menu, /aria-current/);
    assert.match(menu, /backgroundControls\.forEach\(\(control\) => control\.setAttribute\('inert'/);
    assert.match(menu, /backgroundControls\.forEach\(\(control\) => control\.removeAttribute\('inert'/);
    assert.match(menu, /event\.key === 'Tab'/);
    assert.match(html, /dist\/guest\.js\?v=music-directus-1/);
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/cinematic.css', import.meta.url), 'utf8');
const menu = readFileSync(new URL('../js/app/guest/menu.js', import.meta.url), 'utf8');

test('menu close button is in the panel header at the top right', () => {
    const panel = html.slice(html.indexOf('id="invitation-menu"'), html.indexOf('id="button-theme"'));
    assert.match(panel, /class="invitation-menu-header"[\s\S]*?id="invitation-menu-close"/);
    assert.match(panel, /fa-xmark/);
    assert.match(css, /\.invitation-menu-header\s*\{[^}]*justify-content:\s*space-between/s);
});

test('menu overlay is a floating dark glass side panel with a soft border', () => {
    assert.match(css, /\.invitation-menu-overlay\s*\{[^}]*position:\s*fixed[^}]*inset:\s*0/s);
    assert.match(css, /\.invitation-menu-overlay\s*\{[^}]*background:\s*rgba\(8, 9, 12, 0\.24\)[^}]*backdrop-filter:\s*blur\(12px\)/s);
    assert.match(css, /\.invitation-menu-surface\s*\{[^}]*box-sizing:\s*border-box[^}]*margin-left:\s*auto[^}]*border:\s*1px solid[^}]*border-radius:/s);
    assert.match(css, /\.invitation-menu-surface\s*\{[^}]*background:\s*rgba\(24, 25, 29, 0\.68\)/s);
});

test('menu is a compact card with breathing room and bounded height', () => {
    const overlayRule = css.match(/body\.islamic-modern \.invitation-menu-overlay\s*\{([^}]*)\}/)?.[1] || '';
    const cardRule = css.match(/body\.islamic-modern \.invitation-menu-surface\s*\{([^}]*)\}/)?.[1] || '';
    assert.match(overlayRule, /align-items:\s*center/);
    assert.match(cardRule, /width:\s*min\(100%, 23rem\)/);
    assert.match(cardRule, /max-height:\s*calc\(100dvh - 2rem\)/);
    assert.match(cardRule, /overflow-y:\s*auto/);
    assert.doesNotMatch(cardRule, /min-height:/);
    const linkRule = css.match(/body\.islamic-modern \.invitation-menu-nav a\s*\{([^}]*)\}/)?.[1] || '';
    assert.match(linkRule, /font:\s*500 clamp\(1\.35rem, 3\.5vw, 1\.85rem\)/);
});

test('menu panel slides and fades in from the right with reduced-motion support', () => {
    assert.match(css, /\.invitation-menu-overlay\s*\{[^}]*opacity:\s*0[^}]*transition:[^;]*opacity[^;]*0\.35s/s);
    assert.match(css, /\.invitation-menu-surface\s*\{[^}]*transform:\s*translateX\(1\.5rem\)[^}]*transition:[^;]*0\.35s cubic-bezier\(0\.4, 0, 0\.2, 1\)/s);
    assert.match(css, /\.invitation-menu-overlay\.is-open \.invitation-menu-surface\s*\{[^}]*transform:\s*translateX\(0\)/s);
    assert.match(css, /\.invitation-menu-overlay\.is-open\s*\{[^}]*visibility:\s*visible[^}]*transition:[^;]*visibility 0s/s);
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.invitation-menu-overlay\.is-open,[\s\S]*?transition:\s*none/);
});

test('menu items are clean text without side icons, while retaining hover and active color', () => {
    assert.match(css, /\.invitation-menu-nav a:hover[\s\S]*?transform:\s*translateX\(4px\)/);
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
    assert.match(html, /dist\/guest\.js\?v=ui-balance-1/);
});

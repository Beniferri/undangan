import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../js/app/guest/guest.js', import.meta.url), 'utf8');
const boot = source.slice(source.indexOf('    const booting = async'), source.indexOf('    const pageLoaded ='));
for (const welcome of [null, { className: 'is-closing' }]) {
    test(`late boot never resurrects an already-opened cover (${welcome ? 'closing' : 'removed'})`, async () => {
        let fadeCalls = 0;
        const noop = () => {};
        const fn = runInNewContext(boot + '\nbooting;', {
            animateSvg: noop, countDownDate: noop, showGuestName: noop,
            modalImageClick: noop, normalizeArabicFont: noop, buildGoogleCalendar: noop,
            information: { has: () => false, get: () => false },
            document: { body: { classList: { contains: () => true } }, getElementById: (id) => id === 'welcome' ? welcome : null },
            util: { changeOpacity: async (el) => { assert.ok(el, 'cannot fade a removed cover'); fadeCalls++; } },
        });
        await fn();
        assert.equal(fadeCalls, 0);
    });
}

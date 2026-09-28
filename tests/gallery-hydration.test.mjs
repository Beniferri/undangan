import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const cms = readFileSync(new URL('../js/cms.js', import.meta.url), 'utf8');
const start = cms.indexOf("    document.querySelectorAll('[data-cms-gallery]').forEach");
const end = cms.indexOf('    const giftType =', start);
assert.ok(start >= 0 && end > start, 'gallery hydration block exists');
const hydrate = cms.slice(start, end);

const render = (count) => {
    const rows = [{ id: 'gallery-row-one', hidden: false }, { id: 'gallery-row-two', hidden: true, dataset: {} }];
    const slots = Array.from({ length: 6 }, (_, index) => {
        const row = rows[index < 3 ? 0 : 1];
        const button = { hidden: index > 0 };
        return {
            loading: index ? 'lazy' : 'eager',
            dataset: {},
            alt: `Foto galeri pernikahan ${index + 1}`,
            closest: (selector) => selector === '.gallery-item' ? button : row,
            button,
        };
    });
    rows[0].children = slots.slice(0, 3).map((slot) => slot.button);
    rows[1].children = slots.slice(3).map((slot) => slot.button);
    rows[1].prepend = (image) => {
        for (const row of rows) {
            row.children = row.children.filter((item) => item !== image);
        }
        rows[1].children.unshift(image);
    };
    const hint = { hidden: true };
    const document = {
        querySelectorAll: () => slots,
        querySelector: (selector) => {
            if (selector === '.gallery-hint') return hint;
            if (selector === '#gallery-row-two') return rows[1];
            return slots[Number(selector.match(/\d+/)?.[0]) - 1];
        },
    };
    const gallery = Array.from({ length: count }, (_, index) => ({ image_url: `https://images.example.test/${index}.webp`, caption: `Momen ${index}` }));
    runInNewContext(`(() => { ${hydrate} })()`, { document, gallery, directusAssetUrl: () => '' });
    return { rows, slots, hint };
};

for (const [count, visible, secondRow] of [[0, 1, false], [1, 1, false], [2, 2, false], [3, 3, true], [4, 4, true], [6, 6, true], [8, 6, true]]) {
    test(`gallery hydration reveals ${visible} valid slots from ${count} CMS photos`, () => {
        const { rows, slots, hint } = render(count);
        assert.equal(slots.filter((slot) => !slot.button.hidden).length, visible);
        assert.equal(rows[1].hidden, !secondRow);
        assert.equal(rows[1].dataset.single, count === 3 ? 'true' : 'false');
        assert.equal(rows[1].children.filter((button) => !button.hidden).length,
            count === 3 ? 1 : Math.max(0, visible - 3));
        assert.equal(hint.hidden, visible <= 1);
        assert.equal(slots[0].loading, 'eager');
        for (let index = 1; index < slots.length; index++) {
            assert.equal(slots[index].loading, 'lazy');
        }
        if (count) {
            assert.equal(slots[0].dataset.src, slots[0].src);
            assert.equal(slots[0].title, 'Momen 0');
        }
    });
}

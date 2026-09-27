import test from 'node:test';
import assert from 'node:assert/strict';
import { initSectionScroll } from '../js/app/guest/section-scroll.js';

const setup = () => {
    const originalElement = globalThis.Element;
    globalThis.Element = class {};
    const handlers = new Map();
    const win = {
        scrollY: 0,
        innerHeight: 100,
        performance: { now: () => win.clock },
        clock: 0,
        matchMedia: () => ({ matches: true }),
        scrollTo: (_x, y) => { win.scrollY = y; },
        clearTimeout: () => {},
        setTimeout: () => 1,
    };
    const nodes = [
        [0, 100], [100, 100], [200, 100], [300, 300], [600, 100],
    ].map(([top, height]) => ({
        hidden: false,
        matches: () => true,
        getBoundingClientRect: () => ({ top: top - win.scrollY, height }),
    }));
    const doc = {
        documentElement: { classList: { add: () => {} }, scrollHeight: 700 },
        body: { classList: { contains: (name) => name === 'invitation-opened' } },
        querySelector: () => ({ children: nodes }),
        addEventListener: (type, callback) => { handlers.set(type, callback); },
    };
    initSectionScroll(doc, win);
    const wheel = (deltaY, target = null) => {
        win.clock += 300;
        let prevented = false;
        handlers.get('wheel')({ deltaY, target, ctrlKey: false, preventDefault: () => { prevented = true; } });
        return prevented;
    };
    const key = (value) => {
        let prevented = false;
        handlers.get('keydown')({ key: value, target: null, repeat: false, shiftKey: false,
            altKey: false, ctrlKey: false, metaKey: false, preventDefault: () => { prevented = true; } });
        return prevented;
    };
    const touch = (type, x, y) => handlers.get(type)({
        target: null,
        touches: [{ clientX: x, clientY: y }],
        preventDefault: () => {},
    });
    return { win, nodes, doc, wheel, key, touch, cleanup: () => { globalThis.Element = originalElement; } };
};

test('one wheel gesture never skips a section, and long sections remain readable', () => {
    const fixture = setup();
    try {
        const { win, wheel, nodes } = fixture;
        assert.equal(wheel(2500), true);
        assert.equal(win.scrollY, 100);
        assert.equal(wheel(2500), true);
        assert.equal(win.scrollY, 200);
        wheel(2500);
        assert.equal(win.scrollY, 300);
        wheel(2500);
        assert.equal(win.scrollY, 400);
        wheel(2500);
        assert.equal(win.scrollY, 500);
        wheel(2500);
        assert.equal(win.scrollY, 600);
        wheel(-2500);
        assert.equal(win.scrollY, 500);
        nodes[4].hidden = true;
        wheel(2500);
        assert.equal(win.scrollY, 500);
    } finally {
        fixture.cleanup();
    }
});

test('nested story scroll remains independent of section gestures', () => {
    const fixture = setup();
    try {
        class StoryTarget extends Element {
            closest(selector) { return selector.includes('.overflow-y-scroll') ? this : null; }
        }
        const target = new StoryTarget();
        assert.equal(fixture.wheel(2500, target), false);
        assert.equal(fixture.win.scrollY, 0);
        assert.equal(fixture.key('ArrowDown'), true);
        assert.equal(fixture.win.scrollY, 100);
    } finally {
        fixture.cleanup();
    }
});

test('keyboard section navigation does not skip and leaves unrelated keys alone', () => {
    const fixture = setup();
    try {
        assert.equal(fixture.key('ArrowDown'), true);
        assert.equal(fixture.win.scrollY, 100);
        assert.equal(fixture.key('PageDown'), true);
        assert.equal(fixture.win.scrollY, 200);
        assert.equal(fixture.key('Enter'), false);
        assert.equal(fixture.win.scrollY, 200);
    } finally {
        fixture.cleanup();
    }
});

test('one touch swipe moves one section; extra moves in the same swipe do not skip', () => {
    const fixture = setup();
    try {
        const { win, touch } = fixture;
        touch('touchstart', 50, 90);
        touch('touchmove', 50, 10);
        touch('touchmove', 50, -120);
        assert.equal(win.scrollY, 100);
        touch('touchend', 50, -120);
        touch('touchstart', 50, 90);
        touch('touchmove', 50, 10);
        assert.equal(win.scrollY, 200);
    } finally {
        fixture.cleanup();
    }
});

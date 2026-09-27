// Move at most one editorial section per wheel or touch gesture. Long sections
// remain readable; a new gesture is required after reaching their far edge.
export const initSectionScroll = (doc = document, win = window) => {
    const main = doc.querySelector('#root main');
    if (!main) {
        return;
    }
    doc.documentElement.classList.add('section-scroll-enabled');

    const reducedMotion = win.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sections = () => Array.from(main.children).filter((section) =>
        section.matches('.editorial-section, .editorial-person') && !section.hidden);
    const topOf = (section) => section.getBoundingClientRect().top + win.scrollY;
    const maxScroll = () => Math.max(0, doc.documentElement.scrollHeight - win.innerHeight);
    const currentIndex = (items, position = win.scrollY) => {
        let index = 0;
        items.forEach((section, candidate) => {
            if (topOf(section) <= position + 8) {
                index = candidate;
            }
        });
        return index;
    };
    const available = () => doc.body.classList.contains('invitation-opened')
        && !doc.body.classList.contains('invitation-menu-open');
    const interactive = (target) => target instanceof Element
        && Boolean(target.closest('select, [contenteditable], .invitation-menu, .overflow-y-scroll'));
    const textareaCanScroll = (target, direction) => {
        const textarea = target instanceof Element ? target.closest('textarea') : null;
        if (!textarea || textarea.scrollHeight <= textarea.clientHeight + 1) {
            return false;
        }
        return direction > 0
            ? textarea.scrollTop + textarea.clientHeight < textarea.scrollHeight - 1
            : textarea.scrollTop > 1;
    };
    const touchControl = (target) => interactive(target)
        || (target instanceof Element && Boolean(target.closest('input')));

    let moving = false;
    let lastWheel = 0;
    let wheelBlocked = false;
    let wheelRelease;
    const navigate = (destination) => {
        if (destination === undefined || moving) {
            return;
        }
        moving = true;
        destination = Math.max(0, Math.min(destination, maxScroll()));
        if (reducedMotion) {
            win.scrollTo(0, destination);
            moving = false;
            return;
        }
        const start = win.scrollY;
        const startTime = win.performance.now();
        const animate = () => {
            const progress = Math.min((win.performance.now() - startTime) / 650, 1);
            win.scrollTo(0, start + (destination - start) * (1 - Math.pow(1 - progress, 3)));
            if (progress < 1) {
                win.requestAnimationFrame(animate);
            } else {
                moving = false;
            }
        };
        win.requestAnimationFrame(animate);
    };
    const advance = (direction) => {
        const items = sections();
        if (!items.length) {
            return;
        }
        const index = currentIndex(items);
        const top = topOf(items[index]);
        const bottom = Math.min(top + items[index].getBoundingClientRect().height - win.innerHeight, maxScroll());
        // A tall section must first be read to its bottom (or top on the way back).
        if (direction > 0 && win.scrollY < bottom - 8) {
            navigate(Math.min(bottom, win.scrollY + win.innerHeight));
        } else if (direction < 0 && win.scrollY > top + 8) {
            navigate(Math.max(top, win.scrollY - win.innerHeight));
        } else if (items[index + direction]) {
            const adjacent = items[index + direction];
            const adjacentTop = topOf(adjacent);
            const adjacentBottom = Math.min(adjacentTop + adjacent.getBoundingClientRect().height - win.innerHeight, maxScroll());
            navigate(direction < 0 ? Math.max(adjacentTop, adjacentBottom) : adjacentTop);
        }
    };

    doc.addEventListener('wheel', (event) => {
        if (!available() || event.ctrlKey || interactive(event.target) || !event.deltaY
            || textareaCanScroll(event.target, event.deltaY)) {
            return;
        }
        event.preventDefault();
        const now = win.performance.now();
        if (now - lastWheel > 230 && !moving) {
            wheelBlocked = false;
        }
        lastWheel = now;
        win.clearTimeout(wheelRelease);
        wheelRelease = win.setTimeout(() => { wheelBlocked = false; }, 230);
        if (wheelBlocked || moving) {
            return;
        }
        wheelBlocked = true;
        advance(Math.sign(event.deltaY));
    }, { passive: false });

    doc.addEventListener('keydown', (event) => {
        if (!available() || interactive(event.target) || (event.target instanceof Element
            && event.target.closest('textarea')) || (event.target instanceof Element
            && event.target.closest('button, a, input, [role="button"]'))
            || event.altKey || event.ctrlKey || event.metaKey || event.repeat) {
            return;
        }
        let direction = 0;
        if (['ArrowDown', 'PageDown'].includes(event.key) || (event.key === ' ' && !event.shiftKey)) {
            direction = 1;
        } else if (['ArrowUp', 'PageUp'].includes(event.key) || (event.key === ' ' && event.shiftKey)) {
            direction = -1;
        }
        if (direction) {
            event.preventDefault();
            if (!moving) {
                advance(direction);
            }
        }
    });

    let touch = null;
    doc.addEventListener('touchstart', (event) => {
        if (!available() || event.touches.length !== 1 || touchControl(event.target)) {
            touch = null;
            return;
        }
        const items = sections();
        touch = { y: event.touches[0].clientY, x: event.touches[0].clientX,
            position: win.scrollY, index: currentIndex(items), used: false };
    }, { passive: true });
    doc.addEventListener('touchmove', (event) => {
        if (!touch || !available() || event.touches.length !== 1) {
            return;
        }
        const delta = touch.y - event.touches[0].clientY;
        if (textareaCanScroll(event.target, delta)) {
            return;
        }
        if (Math.abs(delta) < Math.abs(touch.x - event.touches[0].clientX)) {
            return; // Preserve horizontal gallery gestures.
        }
        event.preventDefault();
        if (touch.used || moving || Math.abs(delta) < 12) {
            return;
        }
        const items = sections();
        const section = items[touch.index];
        if (!section || section.hidden) {
            return;
        }
        const top = topOf(section);
        const bottom = Math.min(top + section.getBoundingClientRect().height - win.innerHeight, maxScroll());
        const inside = Math.max(top, Math.min(bottom, touch.position + delta));
        if (delta > 0 && touch.position >= bottom - 8 && delta > 35) {
            touch.used = true;
            if (items[touch.index + 1]) {
                navigate(topOf(items[touch.index + 1]));
            }
        } else if (delta < 0 && touch.position <= top + 8 && delta < -35) {
            touch.used = true;
            const previous = items[touch.index - 1];
            if (previous) {
                navigate(Math.max(topOf(previous), topOf(previous) + previous.getBoundingClientRect().height - win.innerHeight));
            }
        } else {
            win.scrollTo(0, inside);
        }
    }, { passive: false });
    doc.addEventListener('touchend', () => { touch = null; }, { passive: true });
    doc.addEventListener('touchcancel', () => { touch = null; }, { passive: true });
};

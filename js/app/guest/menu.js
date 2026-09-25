export const initInvitationMenu = (doc = document, win = window) => {
    const menu = doc.getElementById('invitation-menu');
    const trigger = doc.getElementById('invitation-menu-trigger');
    const closeButton = doc.getElementById('invitation-menu-close');
    const page = doc.getElementById('root');
    const links = menu?.querySelectorAll('a[href^="#"]') || [];
    const reducedMotion = win.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!menu || !trigger || !closeButton) {
        return;
    }

    const open = () => {
        menu.classList.add('is-open');
        menu.setAttribute('aria-hidden', 'false');
        trigger.setAttribute('aria-expanded', 'true');
        doc.documentElement.classList.add('invitation-menu-open');
        doc.body.classList.add('invitation-menu-open');
        page?.setAttribute('inert', '');
        closeButton.focus({ preventScroll: true });
    };

    const close = (restoreFocus = true) => {
        menu.classList.remove('is-open');
        menu.setAttribute('aria-hidden', 'true');
        trigger.setAttribute('aria-expanded', 'false');
        doc.documentElement.classList.remove('invitation-menu-open');
        doc.body.classList.remove('invitation-menu-open');
        page?.removeAttribute('inert');
        if (restoreFocus) {
            trigger.focus({ preventScroll: true });
        }
    };

    trigger.addEventListener('click', open);
    closeButton.addEventListener('click', () => close());
    menu.addEventListener('click', (event) => {
        if (event.target === menu) {
            close();
        }
    });
    doc.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && menu.classList.contains('is-open')) {
            close();
        }
    });
    links.forEach((link) => {
        link.addEventListener('click', (event) => {
            const target = doc.querySelector(link.getAttribute('href'));
            if (!target) {
                return;
            }
            event.preventDefault();
            close(false);
            target.setAttribute('tabindex', '-1');
            win.setTimeout(() => {
                target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
                win.setTimeout(() => target.focus({ preventScroll: true }), reducedMotion ? 0 : 450);
            }, 0);
        });
    });
};

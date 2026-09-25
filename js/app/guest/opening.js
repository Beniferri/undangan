/** A short, optional slow zoom of the approved live-site cover image.
 * It is a still-image animation, not authentic footage of the wedding venue.
 */
export const initOpening = (doc = document, win = window) => {
    const film = doc.getElementById('opening-video');
    const motion = win.matchMedia('(prefers-reduced-motion: reduce)');
    if (!film || motion.matches) {
        return;
    }

    let finished = false;
    let stopped = false;
    const play = () => {
        if (!finished && !stopped && !doc.hidden && !motion.matches) {
            film.play().catch(() => { /* Poster remains the safe fallback. */ });
        }
    };
    const onVisibility = () => {
        if (doc.hidden) {
            film.pause();
        } else {
            play();
        }
    };
    const stop = () => {
        finished = true;
        stopped = true;
        film.pause();
        film.removeEventListener('canplay', play);
        doc.removeEventListener('visibilitychange', onVisibility);
        motion.removeEventListener('change', stop);
    };
    const source = film.querySelector('source');
    film.addEventListener('canplay', play);
    film.addEventListener('error', stop, { once: true });
    doc.addEventListener('visibilitychange', onVisibility);
    doc.addEventListener('undangan.open', stop, { once: true });
    motion.addEventListener('change', stop, { once: true });
    // No ongoing motion, forced viewing, or dependency on media readiness.
    win.setTimeout(stop, 4500);
    if (source) {
        source.src = source.dataset.openingSrc;
        film.load();
    }
};

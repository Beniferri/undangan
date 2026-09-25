import { progress } from './progress.js';
import { util } from '../../common/util.js';
import { cache } from '../../connection/cache.js';

export const audio = (() => {

    const statePlay = '<i class="fa-solid fa-circle-pause" aria-hidden="true"></i><span>Musik</span>';
    const statePause = '<i class="fa-solid fa-circle-play" aria-hidden="true"></i><span>Musik</span>';

    /**
     * @param {boolean} [playOnOpen=true]
     * @returns {Promise<void>}
     */
    const load = async (playOnOpen = true) => {

        const url = document.body.getAttribute('data-audio');
        if (!url) {
            progress.complete('audio', true);
            return;
        }

        /**
         * Whether the user opened the invitation before audio finished loading.
         * @type {boolean}
         */
        let openedBeforeReady = false;

        // Install the opening listener BEFORE the async cache fetch so we never
        // miss the user gesture even on slow connections.
        document.addEventListener('undangan.open', () => {
            openedBeforeReady = true;
        }, { once: true });

        /**
         * @type {HTMLAudioElement|null}
         */
        let audioEl = null;

        try {
            audioEl = new Audio(await cache('audio').withForceCache().get(url, progress.getAbort()));
            audioEl.loop = true;
            audioEl.muted = false;
            audioEl.autoplay = false;
            audioEl.controls = false;

            progress.complete('audio');
        } catch {
            progress.invalid('audio');
            // Keep a direct-source player so a failed cache never strands the control.
            audioEl = new Audio(url);
            audioEl.loop = true;
        }

        const music = document.getElementById('button-music');
        if (!music) {
            return;
        }

        let isPlay = false;

        /**
         * @returns {Promise<void>}
         */
        const play = async () => {
            if (!navigator.onLine || !music) {
                return;
            }

            music.disabled = true;
            try {
                await audioEl.play();
                isPlay = true;
                music.disabled = false;
                music.innerHTML = statePlay;
                music.setAttribute('aria-label', 'Jeda musik');
            } catch (err) {
                isPlay = false;
                music.disabled = false;
                music.innerHTML = statePause;
                music.setAttribute('aria-label', 'Putar musik');
                // NotAllowedError = autoplay blocked; surface music button so user can tap manually.
                // Any other error: show a non-blocking warning.
                if (err?.name !== 'NotAllowedError') {
                    util.notify('Musik belum dapat diputar. Silakan coba tombol musik.').warning();
                }
            }
        };

        /**
         * @returns {void}
         */
        const pause = () => {
            isPlay = false;
            audioEl.pause();
            music.innerHTML = statePause;
            music.setAttribute('aria-label', 'Putar musik');
        };

        // Show button first, then try to play.
        const startOnOpen = () => {
            music.classList.remove('d-none');
            if (playOnOpen) {
                play();
            }
        };

        if (openedBeforeReady) {
            // User already clicked Open while audio was loading — play immediately now.
            startOnOpen();
        } else {
            // Wait for the real opening event (user gesture).
            document.addEventListener('undangan.open', startOnOpen, { once: true });
        }

        window.addEventListener('offline', pause);
        music.addEventListener('click', () => isPlay ? pause() : play());
    };

    /**
     * @returns {object}
     */
    const init = () => {
        progress.add();

        return {
            load,
        };
    };

    return {
        init,
    };
})();
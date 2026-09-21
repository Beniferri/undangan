import { video } from './video.js';
import { image } from './image.js';
import { audio } from './audio.js';
import { progress } from './progress.js';
import { util } from '../../common/util.js';
import { bs } from '../../libs/bootstrap.js';
import { loader } from '../../libs/loader.js';
import { theme } from '../../common/theme.js';
import { lang } from '../../common/language.js';
import { storage } from '../../common/storage.js';
import { session } from '../../common/session.js';
import { offline } from '../../common/offline.js';
import { comment } from '../components/comment.js';
import * as confetti from '../../libs/confetti.js';
import { pool } from '../../connection/request.js';

export const guest = (() => {

    /**
     * @type {ReturnType<typeof storage>|null}
     */
    let information = null;

    /**
     * @returns {void}
     */
    const countDownDate = () => {
        const count = (new Date(document.body.getAttribute('data-time').replace(' ', 'T'))).getTime();

        /**
         * @param {number} num 
         * @returns {string}
         */
        const pad = (num) => num < 10 ? `0${num}` : `${num}`;

        const day = document.getElementById('day');
        const hour = document.getElementById('hour');
        const minute = document.getElementById('minute');
        const second = document.getElementById('second');

        const updateCountdown = () => {
            const distance = Math.abs(count - Date.now());

            day.textContent = pad(Math.floor(distance / (1000 * 60 * 60 * 24)));
            hour.textContent = pad(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
            minute.textContent = pad(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)));
            second.textContent = pad(Math.floor((distance % (1000 * 60)) / 1000));

            util.timeOut(updateCountdown, 1000 - (Date.now() % 1000));
        };

        util.timeOut(updateCountdown);
    };

    /**
     * @returns {void}
     */
    const showGuestName = () => {
        /**
         * Make sure "to=" is the last query string.
         * Ex. wedding.benifin.my.id/?id=some-uuid-here&to=name
         */
        const raw = window.location.search.split('to=');
        let name = null;

        if (raw.length > 1 && raw[1].length >= 1) {
            name = window.decodeURIComponent(raw[1]);
        }

        if (name) {
            const guestName = document.getElementById('guest-name');
            const div = document.createElement('div');
            div.classList.add('m-2');

            const template = `<small class="mt-0 mb-1 mx-0 p-0">${util.escapeHtml(guestName?.getAttribute('data-message'))}</small><p class="m-0 p-0" style="font-size: 1.25rem">${util.escapeHtml(name)}</p>`;
            util.safeInnerHTML(div, template);

            guestName?.appendChild(div);
        }

        const form = document.getElementById('form-name');
        if (form) {
            form.value = information.get('name') ?? name;
        }
    };

    /**
     * @returns {Promise<void>}
     */
    const slide = async () => {
        const interval = 6000;
        const slides = document.querySelectorAll('.slide-desktop');

        if (!slides || slides.length === 0) {
            return;
        }

        const desktopEl = document.getElementById('root')?.querySelector('.d-sm-block');
        if (!desktopEl) {
            return;
        }

        desktopEl.dispatchEvent(new Event('undangan.slide.stop'));

        if (window.getComputedStyle(desktopEl).display === 'none') {
            return;
        }

        if (slides.length === 1) {
            await util.changeOpacity(slides[0], true);
            return;
        }

        let index = 0;
        for (const [i, s] of slides.entries()) {
            if (i === index) {
                s.classList.add('slide-desktop-active');
                await util.changeOpacity(s, true);
                break;
            }
        }

        let run = true;
        const nextSlide = async () => {
            await util.changeOpacity(slides[index], false);
            slides[index].classList.remove('slide-desktop-active');

            index = (index + 1) % slides.length;

            if (run) {
                slides[index].classList.add('slide-desktop-active');
                await util.changeOpacity(slides[index], true);
            }

            return run;
        };

        desktopEl.addEventListener('undangan.slide.stop', () => {
            run = false;
        });

        const loop = async () => {
            if (await nextSlide()) {
                util.timeOut(loop, interval);
            }
        };

        util.timeOut(loop, interval);
    };

    /**
     * @param {HTMLButtonElement} button
     * @returns {void}
     */
    const open = (button) => {
        button.disabled = true;
        document.body.scrollIntoView({ behavior: 'instant' });
        document.getElementById('root').classList.remove('opacity-0');

        if (theme.isAutoMode()) {
            document.getElementById('button-theme').classList.remove('d-none');
        }

        slide();
        theme.spyTop();

        confetti.basicAnimation();
        util.timeOut(confetti.openAnimation, 1500);

        document.dispatchEvent(new Event('undangan.open'));
        util.changeOpacity(document.getElementById('welcome'), false).then((el) => el.remove());
    };

    /**
     * @param {HTMLImageElement} img
     * @returns {void}
     */
    const modal = (img) => {
        document.getElementById('button-modal-click').setAttribute('href', img.src);
        document.getElementById('button-modal-download').setAttribute('data-src', img.src);

        const i = document.getElementById('show-modal-image');
        i.src = img.src;
        i.width = img.width;
        i.height = img.height;
        bs.modal('modal-image').show();
    };

    /**
     * @returns {void}
     */
    const modalImageClick = () => {
        document.getElementById('show-modal-image').addEventListener('click', (e) => {
            const abs = e.currentTarget.parentNode.querySelector('.position-absolute');

            abs.classList.contains('d-none')
                ? abs.classList.replace('d-none', 'd-flex')
                : abs.classList.replace('d-flex', 'd-none');
        });
    };

    /**
     * @param {HTMLDivElement} div 
     * @returns {void}
     */
    const showStory = (div) => {
        if (navigator.vibrate) {
            navigator.vibrate(500);
        }

        confetti.tapTapAnimation(div, 100);
        util.changeOpacity(div, false).then((e) => e.remove());
    };

    /**
     * @returns {void}
     */
    const closeInformation = () => information.set('info', true);

    /**
     * @returns {void}
     */
    const normalizeArabicFont = () => {
        document.querySelectorAll('.font-arabic').forEach((el) => {
            el.innerHTML = String(el.innerHTML).normalize('NFC');
        });
    };

    /**
     * @returns {void}
     */
    const animateSvg = () => {
        document.querySelectorAll('svg').forEach((el) => {
            if (el.hasAttribute('data-class')) {
                util.timeOut(() => el.classList.add(el.getAttribute('data-class')), parseInt(el.getAttribute('data-time')));
            }
        });
    };

    /**
     * @returns {void}
     */
    const buildGoogleCalendar = () => {
        const parseDate = (value) => {
            const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (match) {
                return [Number(match[1]), Number(match[2]), Number(match[3])];
            }
            const now = new Date();
            return [now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate()];
        };
        const parseTime = (value) => {
            const match = String(value || '').match(/(\d{1,2})[.:](\d{2})/);
            return match ? [Number(match[1]), Number(match[2])] : null;
        };
        const formatCalendarDate = (timestamp) => {
            const date = new Date(timestamp);
            const pad = (value) => String(value).padStart(2, '0');
            return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00`;
        };
        const createUrl = () => {
            const couple = document.querySelector('[data-cms="couple-names"]')?.textContent.trim() || 'Mempelai';
            const firstName = document.querySelector('[data-cms="event-1-name"]')?.textContent.trim() || 'Akad';
            const secondName = document.querySelector('[data-cms="event-2-name"]')?.textContent.trim() || 'Resepsi';
            const firstTime = document.querySelector('[data-cms="event-1-time"]')?.textContent.trim() || '';
            const secondTime = document.querySelector('[data-cms="event-2-time"]')?.textContent.trim() || '';
            const location = document.querySelector('[data-cms="event-1-venue"]')?.innerText.replace(/\s+/g, ' ').trim() || '';
            const rawDate = document.body.dataset.time?.trim() || '';
            const timezone = document.body.dataset.timezone?.trim() || 'Asia/Jakarta';
            const [year, month, day] = parseDate(rawDate);
            const sourceTime = parseTime(rawDate) || [9, 0];
            const [startHour, startMinute] = parseTime(firstTime) || sourceTime;
            const secondClock = parseTime(secondTime);
            const calendarStart = Date.UTC(year, month - 1, day, startHour, startMinute);
            let calendarEnd = secondClock
                ? Date.UTC(year, month - 1, day, secondClock[0] + 3, secondClock[1])
                : calendarStart + (4 * 60 * 60 * 1000);
            if (calendarEnd <= calendarStart) {
                calendarEnd += 24 * 60 * 60 * 1000;
            }
            const url = new URL('https://calendar.google.com/calendar/render');
            url.search = new URLSearchParams({
                action: 'TEMPLATE',
                text: `Pernikahan ${couple}`,
                dates: `${formatCalendarDate(calendarStart)}/${formatCalendarDate(calendarEnd)}`,
                details: `${firstName}: ${firstTime}\n${secondName}: ${secondTime}\n\nKami menantikan kehadiran dan doa restu Anda.`,
                location,
                ctz: timezone,
            }).toString();
            return url;
        };

        document.querySelectorAll('[data-calendar-button]').forEach((button) => {
            button.addEventListener('click', () => window.open(createUrl(), '_blank', 'noopener,noreferrer'));
        });
    };

    /**
     * @returns {object}
     */
    const loaderLibs = () => {
        progress.add();

        /**
         * @param {{aos: boolean, confetti: boolean}} opt
         * @returns {void}
         */
        const load = (opt) => {
            loader(opt)
                .then(() => progress.complete('libs'))
                .catch(() => progress.invalid('libs'));
        };

        return {
            load,
        };
    };

    /**
     * @returns {Promise<void>}
     */
    const booting = async () => {
        animateSvg();
        countDownDate();
        showGuestName();
        modalImageClick();
        normalizeArabicFont();
        buildGoogleCalendar();

        if (information.has('presence')) {
            document.getElementById('form-presence').value = information.get('presence') ? '1' : '2';
        }

        if (information.get('info')) {
            document.getElementById('information')?.remove();
        }

        // wait until welcome screen is show.
        await util.changeOpacity(document.getElementById('welcome'), true);

        // remove loading screen and show welcome screen.
        const loading = document.getElementById('loading');
        if (loading) {
            await util.changeOpacity(loading, false).then((el) => el.remove());
        }
    };

    /**
     * @returns {void}
     */
    const pageLoaded = () => {
        lang.init();
        offline.init();
        comment.init();
        progress.init();

        information = storage('information');

        const vid = video.init();
        const img = image.init();
        const aud = audio.init();
        const lib = loaderLibs();
        const token = document.body.getAttribute('data-key');
        const params = new URLSearchParams(window.location.search);

        window.addEventListener('resize', util.debounce(slide));
        let booted = false;
        const startInvitation = () => {
            if (booted) {
                return;
            }
            booted = true;
            booting();
        };
        document.addEventListener('undangan.progress.done', startInvitation);
        window.setTimeout(startInvitation, 900);
        document.addEventListener('hide.bs.modal', () => document.activeElement?.blur());
        document.getElementById('button-modal-download').addEventListener('click', (e) => {
            img.download(e.currentTarget.getAttribute('data-src'));
        });

        if (!token || token.length <= 0) {
            Promise.resolve(window.cmsReady).then(() => vid.load());
            img.load();
            aud.load();
            lib.load({ confetti: document.body.getAttribute('data-confetti') === 'true' });
        }

        if (token && token.length > 0) {
            // add 2 progress for config and comment.
            // before img.load();
            progress.add();
            progress.add();

            // if don't have data-src.
            if (!img.hasDataSrc()) {
                img.load();
            }

            session.guest(params.get('k') ?? token).then(({ data }) => {
                document.dispatchEvent(new Event('undangan.session'));
                progress.complete('config');

                if (img.hasDataSrc()) {
                    img.load();
                }

                Promise.resolve(window.cmsReady).then(() => vid.load());
                aud.load();
                lib.load({ confetti: data.is_confetti_animation });

                comment.show()
                    .then(() => progress.complete('comment'))
                    .catch(() => progress.invalid('comment'));

            }).catch(() => progress.invalid('config'));
        }
    };

    const showCopyFeedback = (message) => {
        document.querySelector('.copy-feedback-toast')?.remove();
        const toast = document.createElement('div');
        toast.className = 'copy-feedback-toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        toast.textContent = message;
        document.body.appendChild(toast);
        toast.classList.add('is-visible');
        util.timeOut(() => {
            toast.classList.remove('is-visible');
            util.timeOut(() => toast.remove(), 250);
        }, 1800);
    };

    const initGift = () => {
        const toggle = document.getElementById('gift-toggle');
        const options = document.getElementById('gift-options');
        if (!toggle || !options) {
            return;
        }

        toggle.addEventListener('click', () => {
            const isHidden = options.hidden;
            options.hidden = !isHidden;
            toggle.setAttribute('aria-expanded', `${isHidden}`);
            toggle.classList.toggle('is-open', isHidden);
        });

        options.querySelectorAll('[data-gift-view]').forEach((button) => {
            button.addEventListener('click', () => {
                const view = button.dataset.giftView;
                options.querySelectorAll('[data-gift-view]').forEach((item) => {
                    const active = item === button;
                    item.classList.toggle('is-active', active);
                    item.setAttribute('aria-selected', `${active}`);
                });
                options.querySelectorAll('[data-gift-panel]').forEach((panel) => {
                    const active = panel.dataset.giftPanel === view;
                    panel.hidden = !active;
                    panel.classList.toggle('is-active', active);
                });
            });
        });

        options.querySelectorAll('[data-copy-from]').forEach((button) => {
            button.addEventListener('click', async () => {
                const source = document.querySelector(`[data-cms="${button.dataset.copyFrom}"]`);
                const value = source?.textContent.trim() ?? '';
                if (!value || /belum tersedia/i.test(value)) {
                    util.notify('Data belum tersedia').warning();
                    return;
                }
                button.dataset.copy = value;
                const copied = await util.copy(button);
                if (copied) {
                    showCopyFeedback(button.dataset.copyFeedback || 'Berhasil disalin!');
                }
            });
        });
    };

    /**
     * Keep the editorial reading order explicit when legacy markup changes.
     * RSVP belongs before gift and the closing credit.
     * @returns {void}
     */
    const arrangeEditorialFlow = () => {
        const gift = document.getElementById('gift');
        const rsvp = document.getElementById('rsvp');
        const wishes = document.getElementById('comment');
        if (gift && rsvp) {
            gift.before(rsvp);
        }
        if (gift && wishes) {
            gift.before(wishes);
        }
    };

    /**
     * @returns {object}
     */
    const init = () => {
        theme.init();
        session.init();

        if (session.isAdmin()) {
            storage('user').clear();
            storage('owns').clear();
            storage('likes').clear();
            storage('session').clear();
            storage('comment').clear();
        }

        const revealWelcome = async () => {
            const welcome = document.getElementById('welcome');
            if (welcome) {
                await util.changeOpacity(welcome, true);
            }
            document.getElementById('loading')?.remove();
        };
        window.addEventListener('DOMContentLoaded', () => window.setTimeout(revealWelcome, 1000), { once: true });

        window.addEventListener('DOMContentLoaded', () => {
            initGift();
            arrangeEditorialFlow();
            pool.init(pageLoaded, [
                'image',
                'video',
                'audio',
                'libs',
                'gif',
            ]);
        });

        return {
            util,
            theme,
            comment,
            guest: {
                open,
                modal,
                showStory,
                closeInformation,
            },
        };
    };

    return {
        init,
    };
})();
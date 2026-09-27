import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const guest = readFileSync(new URL('../js/app/guest/guest.js', import.meta.url), 'utf8');
const calendarSource = guest.slice(guest.indexOf('    const buildGoogleCalendar ='), guest.indexOf('    /**\n     * @returns {object}\n     */\n    const loaderLibs ='));

const calendarUrl = ({ firstDate, secondDate, firstTime = 'Pukul 10.00 WIB', secondTime = 'Pukul 13.00 WIB' }) => {
    let click;
    let result;
    const values = {
        'couple-groom-name': 'Mempelai Pria', 'couple-bride-name': 'Mempelai Wanita',
        'event-1-name': 'Akad', 'event-2-name': 'Resepsi',
        'event-1-time': firstTime, 'event-2-time': secondTime,
        'event-1-venue': 'Masjid, alamat pertama', 'event-2-venue': 'Gedung, alamat kedua',
        'event-1-date': 'Tanggal akad', 'event-2-date': 'Tanggal resepsi',
    };
    const document = {
        body: { dataset: { time: '2027-01-17T09:00:00', timezone: 'Asia/Jakarta' } },
        querySelector(selector) {
            const key = selector.match(/data-cms="([^"]+)"/)?.[1];
            if (!key) return null;
            return { textContent: values[key], innerText: values[key], dataset: { eventDate: key === 'event-1-date' ? firstDate : secondDate }, parentElement: { hidden: false } };
        },
        querySelectorAll: () => [{ addEventListener: (_, cb) => { click = cb; } }],
    };
    vm.runInNewContext(`${calendarSource}\nbuildGoogleCalendar();`, {
        document, URL, URLSearchParams, Date, String, Number, Intl,
        window: { open: (url) => { result = url; } },
    });
    click();
    return new URL(result);
};

test('calendar starts on first event and ends on second even across month boundaries', () => {
    const url = calendarUrl({ firstDate: '2027-01-31T10:00:00', secondDate: '2027-02-01T13:00:00' });
    assert.equal(url.searchParams.get('dates'), '20270131T100000/20270201T160000');
    assert.match(url.searchParams.get('details'), /Akad: Tanggal akad, Pukul 10\.00 WIB/);
    assert.match(url.searchParams.get('details'), /Resepsi: Tanggal resepsi, Pukul 13\.00 WIB/);
    assert.equal(url.searchParams.get('ctz'), 'Asia/Jakarta');
});

test('calendar uses wedding-local day for offset-bearing timestamps', () => {
    const url = calendarUrl({ firstDate: '2027-01-16T17:30:00-07:00', secondDate: '2027-01-17T06:00:00-07:00' });
    assert.equal(url.searchParams.get('dates'), '20270117T100000/20270117T160000');
});

test('calendar normalizes an end before start to a four-hour minimum', () => {
    const url = calendarUrl({ firstDate: '2027-01-31T23:30:00', secondDate: '2027-01-31T23:30:00', firstTime: '23.30', secondTime: '20.00' });
    assert.equal(url.searchParams.get('dates'), '20270131T233000/20270201T033000');
});

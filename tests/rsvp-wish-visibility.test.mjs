import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const flush = async () => { for (let i = 0; i < 12; i += 1) await new Promise((resolve) => setImmediate(resolve)); };
const response = (data, status = 200, error = 'Request gagal') => ({ ok: status < 400, status, json: async () => ({ data, error: status >= 400 ? error : undefined }) });
const rsvps = [{ id: 42, name: 'Tamu', guest_count: 2, attendance: 'hadir', message: 'Pesan pribadi', message_visible: true, created_at: '2026-09-29T00:00:00Z' }];
function setup(handler, page = 'admin-rsvp.html') {
    const dom = new JSDOM(read(page), { url: `https://local.test/${page}`, runScripts: 'outside-only' });
    const calls = [];
    const fetch = (url, options) => {
        const path = new URL(url).pathname;
        calls.push({ path, options });
        return handler(path, options);
    };
    const source = read('js/admin.js').replace(/^import .*;\n/gm, '');
    Object.assign(dom.getInternalVMContext(), { fetch, Headers, console });
    vm.runInContext(source, dom.getInternalVMContext());
    const id = (name) => dom.window.document.getElementById(name);
    return { dom, id, calls };
}
const authenticated = () => response({ authenticated: true, role: 'operator', username: 'operator', csrf_token: 'fixture-csrf' });

test('RSVP row keeps its private message and attendance while hiding a public wish', async () => {
    const app = setup((path, options) => {
        if (path.endsWith('/rsvps') && (!options.method || options.method === 'GET')) return response(rsvps);
        if (path.endsWith('/wish-visibility')) return response({});
        return authenticated();
    });
    await flush();
    const row = app.id('rsvp-table').querySelector('tr');
    assert.match(row.textContent, /Hadir/);
    assert.match(row.textContent, /Pesan pribadi/);
    assert.match(row.textContent, /Tampil/);
    const hide = [...row.querySelectorAll('button')].find((button) => button.textContent === 'Sembunyikan');
    assert.ok(hide, 'RSVP must provide a hide button');
    hide.click();
    await flush();
    const patch = app.calls.find(({ path, options }) => path.endsWith('/rsvps/42/wish-visibility') && options.method === 'PATCH');
    assert.ok(patch);
    assert.deepEqual(JSON.parse(patch.options.body), { visible: false });
    assert.equal(patch.options.headers.get('X-CSRF-Token'), 'fixture-csrf');
    assert.match(app.id('rsvp-table').textContent, /Pesan pribadi/);
    assert.match(app.id('rsvp-table').textContent, /Disembunyikan/);
});

test('hidden wish can be shown again without deleting the RSVP', async () => {
    const rows = [{ ...rsvps[0], message_visible: false }];
    const app = setup((path, options) => {
        if (path.endsWith('/rsvps') && (!options.method || options.method === 'GET')) return response(rows);
        if (path.endsWith('/wish-visibility')) { rows[0].message_visible = true; return response({}); }
        return authenticated();
    });
    await flush();
    assert.match(app.id('rsvp-table').textContent, /Disembunyikan/);
    const show = [...app.id('rsvp-table').querySelectorAll('button')].find((button) => button.textContent === 'Tampilkan');
    assert.ok(show);
    show.click();
    await flush();
    assert.deepEqual(JSON.parse(app.calls.find(({ path }) => path.endsWith('/wish-visibility')).options.body), { visible: true });
    assert.match(app.id('rsvp-table').textContent, /Tampil/);
    assert.match(app.id('rsvp-table').textContent, /Pesan pribadi/);
});

test('failed visibility update preserves the old state and reports an error', async () => {
    const app = setup((path) => path.endsWith('/rsvps') ? response(rsvps) : path.endsWith('/wish-visibility') ? response(null, 403, 'Akses ditolak') : authenticated());
    await flush();
    app.id('rsvp-table').querySelector('button').click();
    await flush();
    assert.match(app.id('rsvp-table').textContent, /Tampil/);
    assert.match(app.id('rsvp-table').textContent, /Pesan pribadi/);
    assert.match(app.id('notice').textContent, /Akses ditolak/);
    assert.equal(app.id('rsvp-table').querySelector('button').disabled, false);
});

test('RSVP page works without unrelated roster, users, or former guestbook DOM hooks', async () => {
    const app = setup((path) => path.endsWith('/rsvps') ? response(rsvps) : authenticated());
    await flush();
    assert.equal(app.id('app-panel').hidden, false);
    assert.equal(app.id('guestbook-table'), null);
    assert.equal(app.calls.some(({ path }) => path.includes('/guestbook')), false);
});

test('new public RSVP immediately shows its wish while historical wishes still load', async () => {
    const html = read('index.html');
    const dom = new JSDOM(html, { url: 'https://local.test/', runScripts: 'outside-only' });
    const { window } = dom;
    let posted;
    const fetch = async (url, options) => {
        if (url.endsWith('/api/rsvp')) { posted = JSON.parse(options.body); return response({ id: 9, notion_synced: true }); }
        if (url.endsWith('/api/guestbook')) return response([{ id: 8, name: 'Tamu lama', message: 'Ucapan lama', like_count: 0 }]);
        throw new Error('Unexpected request');
    };
    window.undangan = { comment: {} };
    Object.assign(dom.getInternalVMContext(), { fetch, alert: () => { throw new Error('Unexpected validation error'); } });
    const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)?.[1];
    assert.ok(inline);
    vm.runInContext(inline, dom.getInternalVMContext());
    window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
    await flush();
    const id = (name) => window.document.getElementById(name);
    assert.match(id('comments').textContent, /Ucapan lama/);
    id('form-name').value = 'Tamu baru';
    id('form-comment').value = 'Ucapan baru';
    id('attendance-present').checked = true;
    id('form-count').value = '1';
    const button = window.document.createElement('button');
    await window.undangan.comment.send(button);
    assert.deepEqual(posted, { name: 'Tamu baru', guest_count: 1, attendance: 'hadir', message: 'Ucapan baru' });
    assert.match(id('comments').firstElementChild.textContent, /Ucapan baru/);
    assert.match(id('comments').textContent, /Ucapan lama/);
});

test('new public wishes remain immediately visible in source contract', () => {
    const html = read('index.html');
    assert.match(html, /comments\.prepend\(card\)/);
    assert.match(html, /data-comment-id/);
});

test('removed moderation page, navigation, stats and distributed entry are absent', () => {
    assert.equal(existsSync(new URL('../admin-ucapan.html', import.meta.url)), false);
    for (const page of ['dashboard.html', 'admin-tamu.html', 'admin-rsvp.html', 'admin-pengguna.html']) {
        assert.doesNotMatch(read(page), /admin-ucapan\.html/);
    }
    assert.doesNotMatch(read('dashboard.html'), /stat-pending|stat-approved|stat-likes/);
    assert.doesNotMatch(read('js/admin.js'), /loadGuestbook|renderGuestbook|moderate =|guestbookRows|stat-pending/);
    assert.doesNotMatch(read('package.json'), /admin-ucapan\.html/);
    assert.match(read('package.json'), /fs\.emptyDir\('public'\)/);
});

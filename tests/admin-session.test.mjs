import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const html = readFileSync(new URL('../dashboard.html', import.meta.url), 'utf8');
const usersHtml = readFileSync(new URL('../admin-pengguna.html', import.meta.url), 'utf8');
const rosterHtml = readFileSync(new URL('../admin-tamu.html', import.meta.url), 'utf8');
const source = readFileSync(new URL('../js/admin.js', import.meta.url), 'utf8').replace(/^import .*;\n/gm, '');
const flush = async () => { for (let i = 0; i < 12; i += 1) await new Promise((resolve) => setImmediate(resolve)); };
const deferred = () => { let resolve; const promise = new Promise((r) => { resolve = r; }); return { promise, resolve }; };
const response = (data, status = 200) => ({ ok: status < 400, status, json: async () => ({ data, error: status >= 400 ? 'Sesi tidak aktif.' : undefined }) });
function setup(handler, page = html) {
    const dom = new JSDOM(page, { url: 'https://local.test/dashboard.html', runScripts: 'outside-only' });
    const { window } = dom;
    const calls = [];
    window.fetch = (url, options) => {
        const path = new URL(url).pathname;
        calls.push(path);
        return handler(path, options);
    };
    const context = dom.getInternalVMContext();
    Object.assign(context, { fetch: window.fetch, Headers, console, defaultInvitationTemplate: 'Example template' });
    vm.runInContext(source, context);
    const id = (name) => window.document.getElementById(name);
    const login = async () => {
        id('admin-username').value = 'operator';
        id('admin-password').value = 'not-a-real-password';
        id('login-form').dispatchEvent(new window.Event('submit', { cancelable: true }));
        await flush();
    };
    return { window, id, calls, login };
}

const authenticated = (role = 'operator') => response({ authenticated: true, role, username: 'test-user', csrf_token: 'test-token' });

test('late roster and CMS responses cannot recreate contacts or draft links after logout', async () => {
    const pendingRoster = deferred();
    const pendingWedding = deferred();
    const app = setup((path) => {
        if (path.endsWith('/invitees')) { return pendingRoster.promise; }
        if (path.endsWith('/weddings')) { return pendingWedding.promise; }
        return authenticated();
    }, rosterHtml);
    await flush();
    app.id('logout-button').click();
    pendingRoster.resolve(response([{ id: 1, name: 'Test', phone: '628123456789' }]));
    pendingWedding.resolve(response([{ groom_name: 'A', bride_name: 'B', wedding_date: '2027-01-01' }]));
    await flush();
    assert.equal(app.id('invitee-table').textContent, '');
    assert.equal(app.id('invitation-generate').disabled, true);
    assert.equal(app.id('invitation-whatsapp').hasAttribute('href'), false);
});

test('account form, reset-password input and login password clear on logout', async () => {
    const app = setup((path) => path.endsWith('/users') ? response([{ id: 1, username: 'test-user', role: 'admin', active: true }]) : authenticated('admin'), usersHtml);
    await flush();
    app.id('user-username').value = 'draft-account';
    app.id('user-password').value = 'temporary-password';
    const reset = [...app.window.document.querySelectorAll('button')].find((button) => button.textContent === 'Reset password');
    reset.click();
    const input = app.window.document.querySelector('input[aria-label^="Password baru"]');
    input.value = 'temporary-reset-password';
    app.id('admin-password').value = 'temporary-login-password';
    app.id('logout-button').click();
    await flush();
    assert.equal(app.id('user-username').value, '');
    assert.equal(app.id('user-password').value, '');
    assert.equal(input.isConnected, false);
    assert.equal(app.id('admin-password').value, '');
});

test('empty users list requires admin as the first account', async () => {
    const app = setup((path) => path.endsWith('/users') ? response([]) : authenticated('admin'), usersHtml);
    await flush();
    assert.equal(app.id('user-role').value, 'admin');
    assert.equal(app.id('user-role').querySelector('option[value="operator"]').disabled, true);
});

test('a late 401 from a prior account does not sign out the new account', async () => {
    const pending = deferred();
    let statsCount = 0;
    const app = setup((path) => {
        if (path.endsWith('/stats')) { statsCount += 1; return statsCount === 1 ? pending.promise : response({ total: 7 }); }
        return authenticated();
    });
    await flush();
    app.id('logout-button').click();
    await flush();
    await app.login();
    pending.resolve(response(null, 401));
    await flush();
    assert.equal(app.id('app-panel').hidden, false);
    assert.equal(app.id('stat-total').textContent, '7');
});

test('a delayed session check cannot reveal content after logout', async () => {
    const pending = deferred();
    let count = 0;
    const app = setup((path) => {
        if (path.endsWith('/session')) { count += 1; return count === 1 ? authenticated() : pending.promise; }
        return response({ total: 42 });
    });
    await flush();
    app.window.dispatchEvent(new app.window.PageTransitionEvent('pageshow', { persisted: true }));
    app.id('logout-button').click(); // hidden button dispatches the same handler
    pending.resolve(authenticated());
    await flush();
    assert.equal(app.id('app-panel').hidden, true);
});

test('late account creation does not issue a follow-up users request after logout', async () => {
    const pending = deferred();
    const app = setup((path, options) => {
        if (path.endsWith('/users') && options.method === 'POST') { return pending.promise; }
        return path.endsWith('/users') ? response([]) : authenticated('admin');
    }, usersHtml);
    await flush();
    app.id('user-username').value = 'new-account';
    app.id('user-password').value = 'temporary-password-long';
    app.id('user-form').dispatchEvent(new app.window.Event('submit', { cancelable: true }));
    app.id('logout-button').click();
    pending.resolve(response({}));
    await flush();
    assert.equal(app.calls.filter((path) => path.endsWith('/users')).length, 2);
});

test('late account creation does not repopulate users or show success after logout', async () => {
    const pending = deferred();
    const app = setup((path, options) => {
        if (path.endsWith('/users') && options.method === 'POST') { return pending.promise; }
        return path.endsWith('/users') ? response([]) : authenticated('admin');
    }, usersHtml);
    await flush();
    app.id('user-username').value = 'new-account';
    app.id('user-password').value = 'temporary-password-long';
    app.id('user-form').dispatchEvent(new app.window.Event('submit', { cancelable: true }));
    app.id('logout-button').click();
    pending.resolve(response({}));
    await flush();
    assert.equal(app.id('users-table').textContent, '');
    assert.equal(app.id('notice').textContent, 'Anda sudah keluar.');
    assert.equal(app.calls.filter((path) => path.endsWith('/users')).length, 2);
});

test('first account submission cannot select operator even if form is changed', async () => {
    let postedRole;
    const app = setup((path, options) => {
        if (path.endsWith('/users') && options.method === 'POST') { postedRole = JSON.parse(options.body).role; return response({}); }
        return path.endsWith('/users') ? response([]) : authenticated('admin');
    }, usersHtml);
    await flush();
    app.id('user-username').value = 'first-account';
    app.id('user-password').value = 'temporary-password-long';
    app.id('user-role').value = 'operator';
    app.id('user-form').dispatchEvent(new app.window.Event('submit', { cancelable: true }));
    await flush();
    assert.equal(postedRole, undefined);
    assert.match(app.id('notice').textContent, /admin/);
});

test('late logout completion cannot sign out an account that logged in afterward', async () => {
    const pending = deferred();
    const app = setup((path) => path.endsWith('/logout') ? pending.promise : path.endsWith('/stats') ? response({ total: 7 }) : authenticated());
    await flush();
    app.id('logout-button').click();
    await app.login();
    pending.resolve(response(null));
    await flush();
    assert.equal(app.id('app-panel').hidden, false);
    assert.equal(app.id('stat-total').textContent, '7');
    assert.equal(app.id('notice').textContent, '');
});

test('401 hides private content before reading a delayed response body', async () => {
    const pending = deferred();
    const app = setup((path) => path.endsWith('/stats') ? Promise.resolve({ ok: false, status: 401, json: () => pending.promise }) : authenticated());
    await flush();
    assert.equal(app.id('app-panel').hidden, true);
    assert.equal(app.window.sessionStorage.length, 0);
    pending.resolve({ error: 'expired' });
    await flush();
});

test('private stats and session disappear on a data-request 401', async () => {
    let rejectStats = false;
    const app = setup((path) => path.endsWith('/session') || path.endsWith('/login') ? authenticated() : response(rejectStats ? null : { total: 42 }, rejectStats ? 401 : 200));
    await flush();
    assert.equal(app.id('stat-total').textContent, '42');
    rejectStats = true;
    app.id('refresh-button').click();
    await flush();
    assert.equal(app.id('app-panel').hidden, true);
    assert.equal(app.id('stat-total').textContent, '—');
    assert.equal(app.window.sessionStorage.length, 0);
});

test('failed logout does not trigger cross-tab revalidation of the still-active cookie', async () => {
    const app = setup((path) => path.endsWith('/logout') ? response(null, 500) : path.endsWith('/stats') ? response({ total: 42 }) : authenticated());
    await flush();
    app.id('logout-button').click();
    await flush();
    assert.match(app.window.localStorage.getItem('betastoria-admin-session'), /^logout-start:/);
});

test('logout failure still removes local private state', async () => {
    const app = setup((path) => path.endsWith('/logout') ? response(null, 401) : path.endsWith('/stats') ? response({ total: 42 }) : authenticated());
    await flush();
    app.id('logout-button').click();
    await flush();
    assert.equal(app.id('app-panel').hidden, true);
    assert.equal(app.id('stat-total').textContent, '—');
    assert.equal(app.window.sessionStorage.length, 0);
    assert.match(app.id('notice').textContent, /server|sesi/i);
});

test('a stale request cannot refill data after logout and a new account login', async () => {
    const pending = deferred();
    let statsCount = 0;
    const app = setup((path) => {
        if (path.endsWith('/stats')) { statsCount += 1; return statsCount === 1 ? pending.promise : response({ total: 7 }); }
        return authenticated();
    });
    await flush();
    app.id('logout-button').click();
    await flush();
    await app.login();
    assert.equal(app.id('stat-total').textContent, '7');
    pending.resolve(response({ total: 99 }));
    await flush();
    assert.equal(app.id('stat-total').textContent, '7');
});

test('bfcache return conceals private data until a fresh session check succeeds', async () => {
    const pending = deferred();
    let count = 0;
    const app = setup((path) => {
        if (path.endsWith('/session')) { count += 1; return count === 1 ? authenticated() : pending.promise; }
        return response({ total: 42 });
    });
    await flush();
    app.window.dispatchEvent(new app.window.PageTransitionEvent('pageshow', { persisted: true }));
    assert.equal(app.id('app-panel').hidden, true);
    assert.equal(app.id('stat-total').textContent, '—');
    pending.resolve(authenticated());
    await flush();
    assert.equal(app.id('app-panel').hidden, false);
});

test('cross-tab logout start hides private content without premature revalidation', async () => {
    const app = setup((path) => path.endsWith('/stats') ? response({ total: 42 }) : authenticated());
    await flush();
    const sessionsBefore = app.calls.filter((path) => path.endsWith('/session')).length;
    app.window.dispatchEvent(new app.window.StorageEvent('storage', { key: 'betastoria-admin-session', newValue: 'logout-start:1', storageArea: app.window.localStorage }));
    await flush();
    assert.equal(app.id('app-panel').hidden, true);
    assert.equal(app.calls.filter((path) => path.endsWith('/session')).length, sessionsBefore);
});

test('cross-tab logout conceals content and revalidates before reveal', async () => {
    const pending = deferred();
    let count = 0;
    const app = setup((path) => {
        if (path.endsWith('/session')) { count += 1; return count === 1 ? authenticated() : pending.promise; }
        return response({ total: 42 });
    });
    await flush();
    app.window.dispatchEvent(new app.window.StorageEvent('storage', { key: 'betastoria-admin-session', newValue: 'login:2', storageArea: app.window.localStorage }));
    assert.equal(app.id('app-panel').hidden, true);
    pending.resolve(response({ authenticated: false }, 401));
    await flush();
    assert.equal(app.id('app-panel').hidden, true);
    assert.equal(app.window.sessionStorage.length, 0);
});

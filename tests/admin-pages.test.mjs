import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const pages = ['dashboard.html', 'admin-tamu.html', 'admin-rsvp.html', 'admin-pengguna.html'];

test('all pages load the same JS and CSS cache keys', () => {
    for (const page of pages) {
        const html = read(page);
        assert.match(html, /css\/admin\.css\?v=admin-pages-1/);
        assert.match(html, /dist\/admin\.js\?v=rsvp-wish-visibility-1/);
    }
});

test('four independent pages share gated glass navigation and login', () => {
    for (const page of pages) {
        const html = read(page);
        assert.match(html, /<section id="app-panel" hidden>/);
        assert.match(html, /id="login-form"/);
        assert.match(html, /class="dashboard-nav"/);
        for (const destination of pages) assert.ok(html.includes(`href="./${destination}"`), `${page}: ${destination}`);
        assert.match(html, /dist\/admin\.js\?v=rsvp-wish-visibility-1/);
    }
});

test('roster and composer share one page while overview contains only stats', () => {
    const roster = read('admin-tamu.html');
    assert.match(roster, /id="invitee-table"/);
    assert.match(roster, /id="invitation-form"/);
    assert.match(read('dashboard.html'), /id="stat-total"/);
    assert.doesNotMatch(read('dashboard.html'), /id="invitee-table"|id="rsvp-table"|id="guestbook-table"/);
    assert.match(read('admin-rsvp.html'), /id="rsvp-table"/);
});

test('users page offers create and account management, not private guest contact hooks', () => {
    const html = read('admin-pengguna.html');
    for (const id of ['users-table', 'user-form', 'user-username', 'user-password', 'user-role']) assert.ok(html.includes(`id="${id}"`));
    assert.doesNotMatch(html, /id="invitee-table"|id="invitation-phone"/);
    const js = read('js/admin.js');
    assert.match(js, /\/api\/admin\/users/);
    assert.match(js, /beginSession\(response\.data\)/);
    assert.match(js, /error\.status === 403/);
});

test('operator cannot display the user-management panel or request users', () => {
    const js = read('js/admin.js');
    assert.match(js, /if \(byId\('users-table'\) && currentRole !== 'admin'\) \{[\s\S]*?return;[\s\S]*?\}/);
    assert.match(js, /const loadDashboard = async \(\) => \{\s*if \(byId\('users-table'\) && currentRole !== 'admin'\) \{ return; \}/);
    assert.match(js, /byId\('users-table'\) && currentRole !== 'admin'[\s\S]*app-panel'\)\.hidden = true/);
    assert.match(js, /byId\('users-table'\) && currentRole === 'admin'\) \{ loaders\.push\(loadUsers\(\)\)/);
});

test('roster row composer callbacks resolve preview functions outside page-specific listener block', () => {
    const js = read('js/admin.js');
    assert.ok(js.indexOf('const clearInvitationPreview = () =>') < js.indexOf("if (byId('invitation-template')) {"));
    assert.ok(js.indexOf('const renderInvitationPreview = () =>') < js.indexOf("if (byId('invitation-template')) {"));
});

test('user role and status changes require explicit confirmation', () => {
    const js = read('js/admin.js');
    assert.match(js, /window\.confirm\(`Ubah peran/);
    assert.match(js, /window\.confirm\(`\$\{row\.active \? 'Nonaktifkan' : 'Aktifkan'\}/);
});

test('create and reset password enforce the backend minimum of 16 characters', () => {
    const html = read('admin-pengguna.html');
    const js = read('js/admin.js');
    assert.doesNotMatch(js, /window\.prompt/);
    assert.match(js, /passwordInput\.type = 'password'/);
    assert.match(html, /id="user-password"[^>]*minlength="16"/);
    assert.match(js, /passwordInput\.minLength = 16/);
    assert.match(js, /password\.length < 16/g);
});

test('first account guidance and password bounds are visible in the account UI', () => {
    const html = read('admin-pengguna.html');
    const js = read('js/admin.js');
    assert.match(html, /Akun pertama.*admin/);
    assert.match(html, /id="user-password"[^>]*maxlength="1024"/);
    assert.match(js, /passwordInput\.maxLength = 1024/);
    assert.match(js, /if \(!rows\.length\) \{\s*byId\('user-role'\)\.value = 'admin'/);
});

test('login and RSVP copy reflect operator read-only permissions', () => {
    for (const page of pages) {
        assert.match(read(page), /Masuk ke dashboard/);
        assert.doesNotMatch(read(page), /Masuk sebagai admin|akun admin Anda/);
        assert.match(read(page), new RegExp(`href="\\./${page.replace('.', '\\.')}" aria-current="page"`));
    }
    assert.match(read('admin-pengguna.html'), /mengatur tampilan publik ucapan RSVP/);
});

test('all hidden controls remain hidden despite Bootstrap display rules', () => {
    assert.match(read('css/admin.css'), /\.dashboard-ui \[hidden\] \{ display: none !important; \}/);
});

test('public build includes all four HTML entry points', () => {
    assert.match(read('package.json'), /'admin-tamu\.html', 'admin-rsvp\.html', 'admin-pengguna\.html'/);
});

test('admin-only navigation link remains visually hidden for operators', () => {
    assert.match(read('css/admin.css'), /\.dashboard-ui \.dashboard-nav a\[hidden\] \{ display: none; \}/);
});

test('page-specific listeners never bind to absent controls', () => {
    const js = read('js/admin.js');
    assert.match(js, /byId\('export-rsvp'\)\?\.addEventListener/);
    assert.match(js, /if \(byId\('invitation-template'\)\)/);
});

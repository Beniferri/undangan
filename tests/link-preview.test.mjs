import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const meta = (property) => html.match(new RegExp(`<meta property="${property}" content="([^"]+)"`))?.[1];
const preview = 'https://wedding.benifin.my.id/assets/images/profile-preview.jpg';

test('static social metadata points crawlers to the profile image, not background', () => {
    assert.equal(meta('og:image'), preview);
    assert.equal(meta('og:image:secure_url'), preview);
    assert.equal(meta('og:image:type'), 'image/jpeg');
    assert.equal(meta('og:image:width'), '1200');
    assert.equal(meta('og:image:height'), '1200');
});

test('client metadata selects profile before the cover when no dedicated OG image exists', () => {
    const cms = readFileSync(new URL('../js/cms.js', import.meta.url), 'utf8');
    assert.match(cms, /const file = wedding\.og_image_id \|\| wedding\.profile_image_id \|\| wedding\.cover_image_id/);
    assert.match(cms, /directusAssetUrl\(file, '\?width=1200&height=1200&fit=cover&format=jpeg&quality=80'\)/);
});

test('local preview asset exists as a sufficiently large JPEG', () => {
    const image = readFileSync(new URL('../assets/images/profile-preview.jpg', import.meta.url));
    assert.equal(image[0], 0xff);
    assert.equal(image[1], 0xd8);
    assert.ok(statSync(new URL('../assets/images/profile-preview.jpg', import.meta.url)).size > 10_000);
});

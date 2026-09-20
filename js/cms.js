const CMS_BASE = 'https://directus.benifin.my.id';
const CMS_SLUG = 'beta-storia-2027';

const cmsFetch = async (path) => {
    const response = await fetch(`${CMS_BASE}${path}`, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
        throw new Error(`CMS request failed: ${response.status}`);
    }
    return response.json();
};
const setCmsText = (selector, value) => {
    if (value === null || value === undefined || value === '') {
        return;
    }
    document.querySelectorAll(`[data-cms="${selector}"]`).forEach((element) => { element.textContent = value; });
};
const setMeta = (name, value, property = false) => {
    if (!value) {
        return;
    }
    const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
    document.querySelectorAll(selector).forEach((element) => { element.setAttribute('content', value); });
};
const formatDate = (value, timezone) => new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long', timeZone: timezone || 'Asia/Jakarta',
}).format(new Date(value));
const applyWedding = ({ wedding, events = [], gallery = [], gifts = [], stories = [] }) => {
    const couple = `${wedding.groom_name} & ${wedding.bride_name}`;
    const dateLabel = formatDate(wedding.wedding_date, wedding.timezone);
    setCmsText('couple-names', couple);
    setCmsText('wedding-date', dateLabel);
    setCmsText('groom-name', wedding.groom_name);
    setCmsText('bride-name', wedding.bride_name);
    setCmsText('groom-parents', wedding.groom_parents);
    setCmsText('bride-parents', wedding.bride_parents);
    setCmsText('intro', wedding.intro);
    setCmsText('quote', wedding.quote);
    setCmsText('dress-code', wedding.dress_code);
    document.body.dataset.time = wedding.wedding_date;
    document.querySelectorAll('[data-cms="maps-url"]').forEach((element) => { element.href = wedding.maps_url || element.href; });
    document.querySelectorAll('[data-cms="cover-image"]').forEach((element) => { element.src = wedding.cover_image_url || element.src; });
    setMeta('title', `Undangan Pernikahan ${couple}`);
    setMeta('description', wedding.seo_description);
    setMeta('og:title', `Undangan Pernikahan ${couple}`, true);
    setMeta('og:description', wedding.seo_description, true);
    events.slice(0, 2).forEach((event, index) => {
        setCmsText(`event-${index + 1}-name`, event.name);
        setCmsText(`event-${index + 1}-time`, event.time_label || formatDate(event.event_date, wedding.timezone));
        setCmsText(`event-${index + 1}-venue`, `${event.venue}\n${event.address}`);
    });
    stories.slice(0, 6).forEach((story, index) => {
        setCmsText(`story-${index + 1}-title`, story.title);
        setCmsText(`story-${index + 1}-body`, story.body);
    });
    gallery.slice(0, 6).forEach((item, index) => {
        const image = document.querySelector(`[data-cms-gallery="${index + 1}"]`);
        if (!image) {
            return;
        }
        image.src = item.directus_file_id ? `${CMS_BASE}/assets/${item.directus_file_id}` : item.image_url;
        image.alt = item.alt_text || image.alt;
    });
    const gift = gifts[0];
    if (gift) {
        setCmsText('gift-label', gift.label);
        setCmsText('gift-account-name', gift.account_name);
        setCmsText('gift-account-number', gift.account_number);
        document.querySelectorAll('[data-cms="gift-account-number"]').forEach((element) => { element.dataset.copy = gift.account_number; });
    }
};
const loadCms = async () => {
    try {
        const params = new URLSearchParams({ 'filter[slug][_eq]': CMS_SLUG, 'filter[status][_eq]': 'published', limit: '1' });
        const weddingResponse = await cmsFetch(`/items/weddings?${params.toString()}`);
        const wedding = weddingResponse.data?.[0];
        if (!wedding) {
            return;
        }
        const filter = encodeURIComponent(JSON.stringify({ wedding_id: { _eq: wedding.id } }));
        const [events, gallery, gifts, stories] = await Promise.all([
            cmsFetch(`/items/wedding_events?filter=${filter}&sort=sort`),
            cmsFetch(`/items/wedding_gallery?filter=${filter}&sort=sort`),
            cmsFetch(`/items/wedding_gifts?filter=${filter}&sort=sort`),
            cmsFetch(`/items/wedding_stories?filter=${filter}&sort=sort`),
        ]);
        applyWedding({ wedding, events: events.data, gallery: gallery.data, gifts: gifts.data, stories: stories.data });
    } catch (error) {
        console.warn('CMS unavailable; using static invitation content.', error);
    }
};
loadCms();

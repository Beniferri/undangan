const CMS_BASE = 'https://directus.benifin.my.id';
const CMS_SLUG = 'beta-storia-2027';
const previewParams = new URLSearchParams(window.location.search);
const previewVersion = previewParams.get('version');
const previewMode = previewParams.get('preview') === 'true' && Boolean(previewVersion);
const previewToken = previewParams.get('access_token');

const cmsFetch = async (path) => {
    const headers = { Accept: 'application/json' };
    if (previewToken) {
        headers.Authorization = `Bearer ${previewToken}`;
    }
    const response = await fetch(`${CMS_BASE}${path}`, {
        headers,
        credentials: previewMode && !previewToken ? 'include' : 'same-origin',
    });
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
const setCanonical = (value) => {
    if (!value) {
        return;
    }
    document.querySelectorAll('link[rel="canonical"]').forEach((element) => { element.href = value; });
};
const directusAssetUrl = (file, options = '') => {
    const id = typeof file === 'object' ? file?.id : file;
    const version = typeof file === 'object' ? file?.filename_download : '';
    if (!id) {
        return '';
    }
    const cacheBust = version ? `${options ? '&' : '?'}v=${encodeURIComponent(version)}` : '';
    return `${CMS_BASE}/assets/${encodeURIComponent(id)}${options}${cacheBust}`;
};
const weddingImageUrl = (wedding, options = '') => {
    const file = wedding.og_image_id || wedding.cover_image_id;
    return file ? directusAssetUrl(file, options) : wedding.cover_image_url;
};
const youtubeEmbedUrl = (value) => {
    try {
        const url = new URL(value);
        let id = url.searchParams.get('v');
        if (url.hostname === 'youtu.be') {
            id = url.pathname.slice(1);
        }
        const startValue = url.searchParams.get('start') || url.searchParams.get('t');
        const start = startValue && /^\d+s?$/.test(startValue) ? Number.parseInt(startValue, 10) : null;
        if (!id && url.pathname.startsWith('/embed/')) {
            id = url.pathname.split('/')[2];
        }
        if (!id || !/^[A-Za-z0-9_-]{6,}$/.test(id)) {
            return null;
        }
        const params = new URLSearchParams({
            rel: '0',
            modestbranding: '1',
            controls: '0',
            disablekb: '1',
            fs: '0',
            iv_load_policy: '3',
            autoplay: '1',
            mute: '1',
            playsinline: '1',
            loop: '1',
            playlist: id,
            end: '47',
        });
        if (start !== null) {
            params.set('start', String(start));
        }
        return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
    } catch {
        return null;
    }
};
const configureVideo = (wedding) => {
    const wrap = document.getElementById('video-love-stroy');
    if (!wrap) {
        return;
    }
    const source = wedding.video_source || '';
    const youtube = source === 'youtube' || (!source && wedding.video_url && youtubeEmbedUrl(wedding.video_url));
    if (youtube) {
        const embed = youtubeEmbedUrl(wedding.video_url);
        if (embed) {
            wrap.dataset.src = embed;
            wrap.dataset.videoType = 'youtube';
        }
        return;
    }
    if (wedding.video_file_id) {
        wrap.dataset.src = directusAssetUrl(wedding.video_file_id);
        wrap.dataset.videoType = 'file';
        return;
    }
    if (wedding.video_url && source !== 'youtube') {
        wrap.dataset.src = wedding.video_url;
        wrap.dataset.videoType = 'file';
    }
};
const setStructuredData = (wedding, events) => {
    const element = document.querySelector('#wedding-jsonld');
    if (!element) {
        return;
    }
    element.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: `Pernikahan ${wedding.groom_name} & ${wedding.bride_name}`,
        description: wedding.seo_description,
        startDate: wedding.wedding_date,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: events[0] ? {
            '@type': 'Place',
            name: events[0].venue,
            address: events[0].address,
        } : undefined,
        url: wedding.canonical_url || window.location.href,
        image: weddingImageUrl(wedding),
    });
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
    configureVideo(wedding);
    document.querySelectorAll('[data-cms="maps-url"]').forEach((element) => { element.href = wedding.maps_url || element.href; });
    const coverFile = wedding.cover_image_id;
    const coverImage = coverFile
        ? directusAssetUrl(coverFile, '?width=1600&quality=82&format=webp')
        : wedding.cover_image_url;
    document.querySelectorAll('[data-cms="cover-image"]').forEach((element) => {
        if (!coverImage) {
            return;
        }
        element.src = coverImage;
        element.dataset.src = coverImage;
        element.alt = wedding.groom_name && wedding.bride_name
            ? `Background pernikahan ${wedding.groom_name} dan ${wedding.bride_name}`
            : element.alt;
    });
    const profileFile = wedding.profile_image_id;
    const profileImage = profileFile
        ? directusAssetUrl(profileFile, '?width=1200&quality=82&format=webp')
        : null;
    document.querySelectorAll('[data-cms="profile-image"]').forEach((element) => {
        if (!profileImage) {
            return;
        }
        element.src = profileImage;
        element.dataset.src = profileImage;
        element.alt = `Foto ${couple}`;
    });
    if (wedding.favicon_image_id) {
        const faviconFile = wedding.favicon_image_id;
        const favicon = directusAssetUrl(faviconFile, '?width=192&height=192&fit=cover&format=png');
        document.querySelectorAll('[data-cms-favicon]').forEach((element) => { element.href = favicon; });
    }
    const seoTitle = wedding.seo_title || `Undangan Pernikahan ${couple}`;
    const seoDescription = wedding.seo_description || `Undangan Pernikahan ${couple}`;
    const ogImage = weddingImageUrl(wedding);
    document.title = seoTitle;
    setMeta('title', seoTitle);
    setMeta('description', seoDescription);
    setMeta('keywords', wedding.seo_keywords);
    setMeta('og:title', seoTitle, true);
    setMeta('og:description', seoDescription, true);
    setMeta('og:image', ogImage, true);
    setMeta('og:image:secure_url', ogImage, true);
    setCanonical(wedding.canonical_url || window.location.href.split('?')[0]);
    events.slice(0, 2).forEach((event, index) => {
        setCmsText(`event-${index + 1}-name`, event.name);
        setCmsText(`event-${index + 1}-time`, event.time_label || formatDate(event.event_date, wedding.timezone));
        setCmsText(`event-${index + 1}-venue`, `${event.venue}\n${event.address}`);
    });
    setStructuredData(wedding, events);
    stories.slice(0, 6).forEach((story, index) => {
        setCmsText(`story-${index + 1}-title`, story.title);
        setCmsText(`story-${index + 1}-body`, story.body);
    });
    document.querySelectorAll('[data-cms-gallery]').forEach((image, index) => {
        const slide = image.closest('.carousel-item');
        const carousel = image.closest('.carousel');
        const offset = carousel?.id === 'carousel-image-two' ? 3 : 0;
        const slot = carousel ? Array.from(carousel.querySelectorAll('[data-cms-gallery]')).indexOf(image) : index;
        const shouldHide = gallery.length > 0 && offset + slot >= Math.min(gallery.length, 6);
        if (slide) {
            slide.hidden = shouldHide;
        }
        if (carousel?.id === 'carousel-image-two') {
            carousel.hidden = gallery.length > 0 && gallery.length <= 3;
        }
    });
    gallery.slice(0, 6).forEach((item, index) => {
        const image = document.querySelector(`[data-cms-gallery="${index + 1}"]`);
        if (!image) {
            return;
        }
        image.src = item.directus_file_id
            ? directusAssetUrl(item.directus_file_id, '?width=1280&quality=80&format=webp')
            : item.image_url;
        image.dataset.src = image.src;
        image.alt = item.alt_text || image.alt;
        image.title = item.caption || image.alt;
        image.loading = 'lazy';
        image.decoding = 'async';
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
        const params = new URLSearchParams({
            'filter[slug][_eq]': CMS_SLUG,
            limit: '1',
            fields: '*,cover_image_id.id,cover_image_id.filename_download,profile_image_id.id,profile_image_id.filename_download,favicon_image_id.id,favicon_image_id.filename_download,og_image_id.id,og_image_id.filename_download',
        });
        if (previewMode) {
            params.set('version', previewVersion);
        } else {
            params.set('filter[status][_eq]', 'published');
        }
        const weddingResponse = await cmsFetch(`/items/weddings?${params.toString()}`);
        const wedding = weddingResponse.data?.[0];
        if (!wedding) {
            return;
        }
        const filter = encodeURIComponent(JSON.stringify({ wedding_id: { _eq: wedding.id } }));
        const versionSuffix = previewMode ? `&version=${encodeURIComponent(previewVersion)}` : '';
        const [events, gallery, gifts, stories] = await Promise.all([
            cmsFetch(`/items/wedding_events?filter=${filter}&sort=sort${versionSuffix}`),
            cmsFetch(`/items/wedding_gallery?filter=${filter}&sort=sort${versionSuffix}`),
            cmsFetch(`/items/wedding_gifts?filter=${filter}&sort=sort${versionSuffix}`),
            cmsFetch(`/items/wedding_stories?filter=${filter}&sort=sort${versionSuffix}`),
        ]);
        applyWedding({ wedding, events: events.data, gallery: gallery.data, gifts: gifts.data, stories: stories.data });
    } catch (error) {
        console.warn('CMS unavailable; using static invitation content.', error);
    }
};
window.cmsReady = loadCms();

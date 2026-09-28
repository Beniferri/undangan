export const defaultInvitationTemplate = `Assalamu’alaikum warahmatullahi wabarakatuh.

Kepada Yth. {nama},

Dengan memohon rahmat Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada pernikahan {mempelai}, insyaAllah pada {tanggal}.

Undangan lengkap dan konfirmasi kehadiran dapat dilihat melalui tautan berikut:
{link}

Merupakan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir. Terima kasih atas perhatian dan doanya.

Wassalamu’alaikum warahmatullahi wabarakatuh.`;

export const normalizeIndonesianPhone = (value) => {
    const input = String(value ?? '').trim();
    if (!/^\+?[\d\s()-]+$/.test(input)) {return null;}
    const digits = input.replace(/\D/g, '');
    const normalized = digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
    return /^628\d{8,12}$/.test(normalized) ? normalized : null;
};

export const buildWhatsAppInvitation = ({ name, phone, template, wedding }) => {
    // Match the public invitation's ?to= handling: one line, at most 80 chars.
    const guest = String(name ?? '').trim();
    if (!guest || guest.length > 80 || [...guest].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) {throw new Error('Nama tamu harus satu baris, maksimal 80 karakter.');}
    const destination = normalizeIndonesianPhone(phone);
    if (!destination) {throw new Error('Nomor WA Indonesia tidak valid. Gunakan 08… atau +62…');}
    if (!wedding?.groom_name || !wedding?.bride_name || !wedding?.wedding_date) {throw new Error('Data pernikahan terbit belum tersedia.');}
    if (!template?.includes('{nama}') || !template?.includes('{link}')) {throw new Error('Template wajib menyertakan {nama} dan {link}.');}
    const [year, month, day] = String(wedding.wedding_date).slice(0, 10).split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 12));
    if (Number.isNaN(date.valueOf())) {throw new Error('Tanggal pernikahan tidak valid.');}
    const dateLabel = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeZone: wedding.timezone || 'Asia/Jakarta' }).format(date);
    const invitation = new URL('https://wedding.benifin.my.id/');
    invitation.searchParams.set('to', guest);
    const invitationUrl = invitation.toString();
    const replacements = { '{nama}': guest, '{mempelai}': `${wedding.groom_name} & ${wedding.bride_name}`, '{tanggal}': dateLabel, '{link}': invitationUrl };
    const message = String(template).replace(/\{(?:nama|mempelai|tanggal|link)\}/g, (token) => replacements[token]);
    const whatsapp = new URL(`https://wa.me/${destination}`);
    whatsapp.searchParams.set('text', message);
    return { invitationUrl, whatsappUrl: whatsapp.toString(), message };
};

export const inviteeStatus = (row) => row.sent_at
    ? { label: 'Sudah dikirim (manual)', className: 'text-bg-success' }
    : { label: 'Belum ditandai', className: 'text-bg-secondary' };

export const inviteeSaveError = (status, message) => {
    if (status === 409) {return 'Nomor WA sudah ada di daftar tamu. Gunakan nomor lain atau Edit kontak yang sudah ada.';}
    if (status === 422) {return 'Nama atau nomor WA tidak valid. Periksa kembali format nomor Indonesia.';}
    if (status === 401 || status === 403) {return 'Sesi admin tidak valid. Muat ulang dashboard lalu login kembali.';}
    return message;
};

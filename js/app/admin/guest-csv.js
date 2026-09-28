export const parseGuestCsv = (input) => {
    const text = String(input).replace(/^\ufeff/, '');
    if (text.length > 1_000_000) { throw new Error('File CSV terlalu besar (maksimal 1 MB).'); }
    const lines = [];
    let row = [];
    let field = '';
    let quoted = false;
    let afterQuote = false;
    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        if (quoted) {
            if (char === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
            else if (char === '"') { quoted = false; afterQuote = true; }
            else { field += char; }
        } else if (char === ',' || char === '\n' || char === '\r') {
            row.push(field);
            field = '';
            afterQuote = false;
            if (char === ',') { continue; }
            if (char === '\r' && text[i + 1] === '\n') { i += 1; }
            lines.push(row);
            row = [];
        } else if (char === '"' && !field && !afterQuote) { quoted = true; }
        else if (afterQuote || char === '"') { throw new Error(`Format CSV tidak valid pada baris ${lines.length + 1}.`); }
        else { field += char; }
    }
    if (quoted) { throw new Error('Format CSV tidak valid: tanda kutip belum ditutup.'); }
    if (field || row.length) { row.push(field); lines.push(row); }
    const header = lines.shift()?.map((value) => value.trim().toLowerCase()) || [];
    const nameIndex = header.findIndex((value) => ['nama', 'name'].includes(value));
    const phoneIndex = header.findIndex((value) => ['nomor', 'phone', 'no_wa', 'whatsapp'].includes(value));
    if (nameIndex < 0 || phoneIndex < 0 || header.length !== 2 || new Set(header).size !== header.length) {
        throw new Error('Kolom CSV wajib tepat: nama,nomor (atau name,phone).');
    }
    const entries = lines.filter((values) => values.some((value) => value.trim()));
    if (entries.length > 500) { throw new Error('CSV maksimal 500 tamu per impor.'); }
    return entries.map((values, index) => {
        if (values.length !== header.length) { throw new Error(`Jumlah kolom salah pada baris ${index + 2}.`); }
        return { name: values[nameIndex].trim(), phone: values[phoneIndex].trim() };
    });
};

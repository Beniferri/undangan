// Keep the guest-count field aligned with the selected RSVP response.
export const initAttendance = (doc = document) => {
    const options = doc.querySelectorAll('input[name="attendance"]');
    const countField = doc.getElementById('guest-count-field');
    if (!options.length || !countField) {
        return;
    }

    const sync = () => {
        countField.hidden = doc.querySelector('input[name="attendance"]:checked')?.value !== '1';
    };
    options.forEach((option) => option.addEventListener('change', sync));
    sync();
};

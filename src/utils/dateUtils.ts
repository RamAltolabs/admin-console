export const getValidDate = (candidate: any): Date | null => {
    if (!candidate || candidate === 'N/A' || candidate === 'undefined' || candidate === 'null') return null;

    // 1. If it's already a Date object
    if (candidate instanceof Date) {
        return isNaN(candidate.getTime()) ? null : candidate;
    }

    const str = String(candidate).trim();
    if (!str) return null;

    // 2. Try standard constructor (handles ISO "YYYY-MM-DDTHH:mm:ssZ")
    let d = new Date(str);
    if (!isNaN(d.getTime())) return d;

    // 3. Handle dashboard-specific formats like "MM-DD-YYYY HH:mm:ss"
    // Many browsers fail on "01-18-2026" but succeed on "01/18/2026"
    if (str.includes('-')) {
        // Simple swap: dash to slash
        const withSlashes = str.replace(/-/g, '/');
        d = new Date(withSlashes);
        if (!isNaN(d.getTime())) return d;

        // More aggressive: Try to identify DD-MM-YYYY vs MM-DD-YYYY
        const parts = str.split(/[- :]/); // split by dash, space, or colon
        if (parts.length >= 3) {
            const p1 = parts[0].padStart(2, '0');
            const p2 = parts[1].padStart(2, '0');
            const p3 = parts[2]; // usually year
            const timePart = parts.slice(3).join(':');

            if (p3.length === 4) {
                // Try YYYY/MM/DD which is safest across browsers
                // Strategy A: MM is first
                let trial = new Date(`${p3}/${p1}/${p2}${timePart ? ' ' + timePart : ''}`);
                if (!isNaN(trial.getTime())) return trial;

                // Strategy B: DD is first
                trial = new Date(`${p3}/${p2}/${p1}${timePart ? ' ' + timePart : ''}`);
                if (!isNaN(trial.getTime())) return trial;
            }
        }
    }

    // 4. Handle Unix timestamps
    if (/^\d+$/.test(str)) {
        const ts = parseInt(str);
        // Check if it's seconds vs milliseconds
        const dateTs = ts < 10000000000 ? ts * 1000 : ts;
        d = new Date(dateTs);
        if (!isNaN(d.getTime())) return d;
    }

    return null;
};

export const formatTime = (date: Date | null | string): string => {
    const d = date instanceof Date ? date : getValidDate(date);
    if (!d) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatDate = (date: Date | null | string): string => {
    const d = date instanceof Date ? date : getValidDate(date);
    if (!d) return 'N/A';
    return d.toLocaleDateString([], { month: '2-digit', day: '2-digit', year: 'numeric' });
};

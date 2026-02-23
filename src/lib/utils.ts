export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatNumber(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatInputNumber(value: string | number): string {
    if (value === undefined || value === null || value === '') return '';
    const numStr = value.toString().replace(/[^0-9]/g, '');
    if (!numStr) return '';
    return new Intl.NumberFormat('id-ID').format(parseInt(numStr));
}

export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
}

export function formatShortDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date);
}

export function getStatusColor(status: string): string {
    switch (status) {
        case 'sudah_dilaksanakan':
            return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        case 'belum_dilaksanakan':
            return 'bg-amber-50 text-amber-600 border-amber-100';
        case 'aktif':
            return 'bg-blue-50 text-blue-600 border-blue-100';
        case 'lunas':
            return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        case 'menunggak':
            return 'bg-red-50 text-red-600 border-red-100';
        default:
            return 'bg-dark-50 text-dark-600 border-dark-100';
    }
}

export function getStatusLabel(status: string): string {
    switch (status) {
        case 'sudah_dilaksanakan':
            return 'Sudah Dilaksanakan';
        case 'belum_dilaksanakan':
            return 'Belum Dilaksanakan';
        case 'aktif':
            return 'Aktif';
        case 'lunas':
            return 'Lunas';
        case 'menunggak':
            return 'Menunggak';
        default:
            return status;
    }
}

export function getKomitmenStatus(paid: number, total: number, status: string): { label: string, color: string } {
    if (status === 'lunas' || paid >= total) {
        return { label: 'Lunas', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
    }
    if (status === 'menunggak') {
        return { label: 'Menunggak', color: 'bg-red-50 text-red-600 border-red-100' };
    }
    if (paid === 0) {
        return { label: 'Belum Bayar', color: 'bg-dark-50 text-dark-500 border-dark-100' };
    }
    return { label: 'Berjalan', color: 'bg-blue-50 text-blue-600 border-blue-100' };
}

export function calculateProgress(paid: number, total: number): number {
    if (total === 0) return 0;
    return Math.min(Math.round((paid / total) * 100), 100);
}

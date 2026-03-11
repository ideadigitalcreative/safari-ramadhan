import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/** jsPDF instance with lastAutoTable (set by jspdf-autotable after autoTable()) */
type JsPDFWithAutoTable = jsPDF & { lastAutoTable?: { finalY: number } };

const ORG = {
    nama: 'Yayasan Satu Hati Merdeka',
    noSk: 'No. 209/BAZNAS-MRS/SK/IV/2021',
    alamat: 'Jl. Citra Sudiang Blok X4 No 21B Makassar',
    telp: '+62 812-4221-4225',
    web: 'https://satuhatiindonesia.com',
    penerima: 'Satu Hati Merdeka',
    jabatan: 'Ketua Merdeka Waqaf',
    namaPenerima: 'Ahmad Riyadhi Sultan, S.Sos',
};

// Warna sesuai referensi
const COLORS = {
    greyBg: [224, 224, 224] as [number, number, number],   // #E0E0E0
    redBar: [216, 39, 47] as [number, number, number],     // #D8272F
    black: [0, 0, 0] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
};

const LEGAL_POINTS = [
    'Satu Hati Merdeka terdaftar sebagai lembaga penerbit Bukti Setor Zakat (BSZ) untuk pengurangan penghasilan kena pajak berdasarkan Peraturan Dirjen Pajak No.PER-22/PJ/2025.',
    'Satu Hati Merdeka tidak menerima segala bentuk dana yang terkait dengan terorisme dan pencucian uang.',
    'Untuk memenuhi kepatuhan terhadap Syariah serta Undang-Undang No. 23 Tahun 2011 tentang Pengelolaan Zakat, data zakat yang disetorkan oleh Penyetor (Muzaki) telah sesuai dengan kriteria/syarat wajib zakat.',
    'Transaksi zakat dapat dikreditkan sebagai pengurangan Penghasilan Bruto sesuai ketentuan PMK No.114 Tahun 2025 dan Pasal 9 ayat (1) huruf g UU No.7 Tahun 2021 tentang Harmonisasi Peraturan Perpajakan (UU HPP).',
];

const DOA_TEXT =
    'Semoga Allah memberikan pahala atas apa yang telah Bapak/Ibu {nama} tunaikan, semoga Allah memberikan keberkahan atas harta yang masih tertinggal dan semoga zakat, infaq dan shodaqoh ini menjadi pembersih bagi jiwa dan harta Bapak/Ibu {nama} beserta keluarga.';

export interface KuitansiDonasiItem {
    nominal: number;
    program: string;
    jenisTransaksi: string;
}

export interface KuitansiData {
    namaDonatur: string;
    alamatDonatur: string;
    npwp?: string;
    nomorDonatur: string;
    nomorTransaksi: string;
    tanggalTransaksi: string;
    items: KuitansiDonasiItem[];
}

function formatRupiah(n: number): string {
    return 'Rp.' + new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

/** Nama program yang ditampilkan di kuitansi (pemetaan nama lama -> nama resmi) */
function programDisplayName(program: string): string {
    const v = program?.trim() || '';
    if (v === 'An-Naafi Bappeda Muh. Yamin') return 'Bantuan Kemanusiaan Palestina';
    return v || 'Donasi';
}

function formatDateId(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
}

async function fetchImageAsBase64(url: string): Promise<string> {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Generate nomor donatur (contoh: 202609030115) dari id + tanggal
 */
export function generateNomorDonatur(donaturId: string, createdAt?: string): string {
    const d = createdAt ? new Date(createdAt) : new Date();
    const ymd = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    const short = donaturId.replace(/-/g, '').slice(0, 6);
    return `${ymd}${short}`.slice(0, 12);
}

/**
 * Generate nomor transaksi (contoh: 20260903001) dari tanggal + id
 */
export function generateNomorTransaksi(tanggal: string, donasiId: string): string {
    const d = new Date(tanggal);
    const ymd = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    const short = donasiId.replace(/-/g, '').slice(0, 3);
    return `${ymd}${short}`;
}

const A4_WIDTH_MM = 210;
const MARGIN = 14;

const LOGO_LEFT_WIDTH = 28;
const LOGO_LEFT_HEIGHT = 14;
// Logo kanan: tinggi lebih besar dari lebar agar tidak gepeng (rasio ~1 : 1.2)
const LOGO_RIGHT_WIDTH = 10;
const LOGO_RIGHT_HEIGHT = 14;

/**
 * Generate dan download PDF kuitansi untuk donatur.
 * @param logoUrl - URL logo (mis. '/logo.png') untuk ditampilkan di header kiri.
 * @param logoUrlRight - URL logo (mis. '/merdeka.png') untuk ditampilkan di header kanan (Merdeka Waqaf).
 */
export async function generateKuitansiPdf(
    data: KuitansiData,
    filename?: string,
    logoUrl?: string,
    logoUrlRight?: string
): Promise<void> {
    const doc = new jsPDF();
    const pageW = A4_WIDTH_MM;
    let y = 12;

    // ---- Header: logo kiri ----
    let logoBase64: string | null = null;
    let logoRightBase64: string | null = null;
    if (logoUrl) {
        try {
            logoBase64 = await fetchImageAsBase64(logoUrl);
        } catch {
            // ignore
        }
    }
    if (logoUrlRight) {
        try {
            logoRightBase64 = await fetchImageAsBase64(logoUrlRight);
        } catch {
            // ignore
        }
    }
    if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', MARGIN, y, LOGO_LEFT_WIDTH, LOGO_LEFT_HEIGHT);
    }
    // Logo kanan: Merdeka Waqaf (lebar lebih kecil agar tidak gepeng)
    if (logoRightBase64) {
        doc.addImage(logoRightBase64, 'PNG', pageW - MARGIN - LOGO_RIGHT_WIDTH, y, LOGO_RIGHT_WIDTH, LOGO_RIGHT_HEIGHT);
    } else {
        doc.setTextColor(0, 128, 0);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Merdeka', pageW - MARGIN - 22, y + 5);
        doc.text('Waqaf', pageW - MARGIN - 22, y + 10);
        doc.setTextColor(...COLORS.black);
    }

    // ---- Header: judul tengah ----
    y += 18;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('KUITANSI', pageW / 2, y, { align: 'center' });
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(ORG.nama, pageW / 2, y, { align: 'center' });
    y += 5;
    doc.setFontSize(8);
    doc.text(ORG.noSk, pageW / 2, y, { align: 'center' });
    y += 5;
    doc.text(ORG.alamat, pageW / 2, y, { align: 'center' });
    y += 4;
    doc.text(`Telp : ${ORG.telp}  web : ${ORG.web}`, pageW / 2, y, { align: 'center' });
    y += 10;

    // ---- Kotak abu: Kepada Bapak/Ibu ----
    const boxH = 10;
    doc.setFillColor(...COLORS.greyBg);
    doc.rect(MARGIN, y, pageW - 2 * MARGIN, boxH, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Kepada Bapak/Ibu ${data.namaDonatur}`, MARGIN + 4, y + 6.5);
    y += boxH + 6;

    // ---- Paragraf intro: 2 baris, "Satu Hati Merdeka" bold ----
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Kuitansi ini adalah bukti pembayaran Zakat, Infaq dan Shodaqoh Anda di ', MARGIN, y);
    const boldStart = doc.getTextWidth('Kuitansi ini adalah bukti pembayaran Zakat, Infaq dan Shodaqoh Anda di ');
    doc.setFont('helvetica', 'bold');
    doc.text('Satu Hati Merdeka.', MARGIN + boldStart, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text('Berikut kami sertakan detail pembayaran Anda.', MARGIN, y);
    y += 8;

    // ---- Kotak abu: dua kolom (Nomor/Nama/NPWP | Nomor Transaksi/Tanggal/Alamat NPWP) ----
    const detailBoxH = 22;
    doc.setFillColor(...COLORS.greyBg);
    doc.rect(MARGIN, y, pageW - 2 * MARGIN, detailBoxH, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const col1X = MARGIN + 4;
    const col2X = MARGIN + (pageW - 2 * MARGIN) / 2 + 4;
    doc.text(`Nomor Donatur    : ${data.nomorDonatur}`, col1X, y + 5);
    doc.text(`Nama Donatur     : ${data.namaDonatur}`, col1X, y + 10);
    doc.text(`NPWP             : ${data.npwp ?? '--'}`, col1X, y + 15);
    doc.text(`Nomor Transaksi  : ${data.nomorTransaksi}`, col2X, y + 5);
    doc.text(`Tanggal Transaksi: ${formatDateId(data.tanggalTransaksi)}`, col2X, y + 10);
    doc.text(`Alamat NPWP      : ${data.alamatDonatur || '--'}`, col2X, y + 15);
    y += detailBoxH + 6;

    // ---- Tabel: bar merah "Detail Transaksi" ----
    doc.setFillColor(...COLORS.redBar);
    doc.rect(MARGIN, y, pageW - 2 * MARGIN, 8, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Detail Transaksi', MARGIN + 4, y + 5.5);
    doc.setTextColor(...COLORS.black);
    y += 8;

    // ---- Tabel: header abu (Jenis Transaksi | Program | Sub Total) + body ----
    const tableData = data.items.map((item) => [
        item.jenisTransaksi,
        programDisplayName(item.program),
        formatRupiah(item.nominal),
    ]);

    autoTable(doc, {
        startY: y,
        head: [['Jenis Transaksi', 'Program', 'Sub Total']],
        body: tableData,
        theme: 'plain',
        headStyles: {
            fillColor: COLORS.greyBg,
            textColor: COLORS.black,
            fontStyle: 'normal',
            fontSize: 9,
        },
        columnStyles: {
            0: { cellWidth: 50, halign: 'left', valign: 'middle' },
            1: { cellWidth: 87, halign: 'center', valign: 'middle' },
            2: { cellWidth: 45, halign: 'right', valign: 'middle' },
        },
        margin: { left: MARGIN, right: MARGIN },
        styles: { fontSize: 9, cellPadding: 3 },
    });

    y = ((doc as JsPDFWithAutoTable).lastAutoTable?.finalY ?? y) + 4;

    // ---- Total Transaksi (kanan, nominal bold) ----
    const total = data.items.reduce((s, i) => s + i.nominal, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Total Transaksi ', pageW - MARGIN - 55, y);
    doc.setFont('helvetica', 'bold');
    doc.text(formatRupiah(total), pageW - MARGIN, y, { align: 'right' });
    y += 12;

    // ---- Doa (paragraf tengah) ----
    const doa = DOA_TEXT.replace(/\{nama\}/g, data.namaDonatur);
    const splitDoa = doc.splitTextToSize(doa, pageW - 2 * MARGIN);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    splitDoa.forEach((line: string) => {
        doc.text(line, pageW / 2, y, { align: 'center' });
        y += 5;
    });
    y += 10;

    // ---- Blok tanda tangan ----
    doc.setFontSize(9);
    doc.text(`Diterima oleh ${ORG.penerima}`, MARGIN, y);
    y += 5;
    doc.text(formatDateId(data.tanggalTransaksi), MARGIN, y);
    y += 10;
    // Placeholder garis tanda tangan (optional: bisa pakai image signature)
    doc.setDrawColor(0, 0, 0);
    doc.line(MARGIN, y, MARGIN + 40, y);
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text(ORG.namaPenerima, MARGIN, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(ORG.jabatan, MARGIN, y);
    y += 14;

    // ---- Footer: Keterangan (4 poin) ----
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Keterangan:', MARGIN, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    LEGAL_POINTS.forEach((point, i) => {
        const lines = doc.splitTextToSize(`${i + 1}. ${point}`, pageW - 2 * MARGIN - 6);
        lines.forEach((line: string) => {
            doc.text(line, MARGIN + 4, y);
            y += 3.5;
        });
    });

    doc.save(filename || `kuitansi-${data.nomorTransaksi}.pdf`);
}

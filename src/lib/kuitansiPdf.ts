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

const LEGAL_TEXT =
    'Satu Hati Merdeka terdaftar sebagai lembaga penerbit Bukti Setor Zakat (BSZ) untuk pengurangan penghasilan kena pajak berdasarkan Peraturan Dirjen Pajak No.PER-22/PJ/2025. ' +
    'Satu Hati Merdeka tidak menerima segala bentuk dana yang terkait dengan terorisme dan pencucian uang. ' +
    'Untuk memenuhi kepatuhan terhadap Syariah serta Undang-Undang No. 23 Tahun 2011 tentang Pengelolaan Zakat, data zakat yang disetorkan oleh Penyetor (Muzaki) telah sesuai dengan kriteria/syarat wajib zakat. ' +
    'Transaksi zakat dapat dikreditkan sebagai pengurangan Penghasilan Bruto sesuai ketentuan PMK No.114 Tahun 2025 dan Pasal 9 ayat (1) huruf g UU No.7 Tahun 2021 tentang Harmonisasi Peraturan Perpajakan (UU HPP).';

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

function formatDateId(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
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

/**
 * Generate dan download PDF kuitansi untuk donatur
 */
// A4 width in mm (jsPDF default)
const A4_WIDTH_MM = 210;

export function generateKuitansiPdf(data: KuitansiData, filename?: string): void {
    const doc = new jsPDF();
    const pageW = A4_WIDTH_MM;
    let y = 18;

    // ---- Header ----
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('KUITANSI', pageW / 2, y, { align: 'center' });
    y += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(ORG.nama, pageW / 2, y, { align: 'center' });
    y += 5;
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(ORG.noSk, pageW / 2, y, { align: 'center' });
    y += 6;
    doc.text(`${ORG.alamat}`, pageW / 2, y, { align: 'center' });
    y += 5;
    doc.text(`Telp : ${ORG.telp}  web : ${ORG.web}`, pageW / 2, y, { align: 'center' });
    y += 8;
    doc.setTextColor(0, 0, 0);

    // Kepada Bapak/Ibu
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Kepada Bapak/Ibu ${data.namaDonatur}`, 14, y);
    y += 8;

    // Keterangan intro
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(
        'Kuitansi ini adalah bukti pembayaran Zakat, Infaq dan Shodaqoh Anda di Satu Hati Merdeka. Berikut kami sertakan detail pembayaran Anda:',
        14,
        y,
        { maxWidth: pageW - 28 }
    );
    y += 10;
    doc.setTextColor(0, 0, 0);

    // Tabel detail transaksi
    const tableData = data.items.map((item, i) => [
        (i + 1).toString(),
        formatRupiah(item.nominal),
        item.program,
        item.jenisTransaksi,
    ]);

    autoTable(doc, {
        startY: y,
        head: [['No.', 'Sub Total', 'Program', 'Jenis Transaksi']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        styles: { fontSize: 9 },
        columnStyles: {
            0: { cellWidth: 12, halign: 'center' },
            1: { cellWidth: 38, halign: 'right' },
            2: { cellWidth: 70 },
            3: { cellWidth: 55 },
        },
        margin: { left: 14, right: 14 },
    });

    y = ((doc as JsPDFWithAutoTable).lastAutoTable?.finalY ?? y) + 8;

    // Total Transaksi
    const total = data.items.reduce((s, i) => s + i.nominal, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Total Transaksi', 14, y);
    doc.text(formatRupiah(total), pageW - 14, y, { align: 'right' });
    y += 10;

    // Detail Transaksi (box)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Detail Transaksi', 14, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const detailLines = [
        `Nama Donatur     : ${data.namaDonatur}`,
        `Nomor Donatur    : ${data.nomorDonatur}`,
        `Nomor Transaksi  : ${data.nomorTransaksi}`,
        `Tanggal Transaksi: ${data.tanggalTransaksi}`,
        `NPWP             : ${data.npwp || '-'}`,
        `Alamat           : ${data.alamatDonatur || '-'}`,
    ];
    detailLines.forEach((line) => {
        doc.text(line, 14, y);
        y += 5;
    });
    y += 6;

    // Legal text (small, wrapped)
    doc.setFontSize(7);
    doc.setTextColor(70, 70, 70);
    const splitLegal = doc.splitTextToSize(LEGAL_TEXT, pageW - 28);
    doc.text(splitLegal, 14, y);
    y += splitLegal.length * 4 + 4;

    // Doa
    const doa = DOA_TEXT.replace(/\{nama\}/g, data.namaDonatur);
    const splitDoa = doc.splitTextToSize(doa, pageW - 28);
    doc.text(splitDoa, 14, y);
    y += splitDoa.length * 4 + 10;
    doc.setTextColor(0, 0, 0);

    // Footer: Diterima oleh
    doc.setFontSize(9);
    doc.text(`Diterima oleh ${ORG.penerima}`, 14, y);
    y += 5;
    doc.text(ORG.jabatan, 14, y);
    y += 8;
    doc.text(formatDateId(data.tanggalTransaksi), 14, y);
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text(ORG.namaPenerima, 14, y);

    doc.save(filename || `kuitansi-${data.nomorTransaksi}.pdf`);
}

import sys
import re

file_path = 'src/app/komitmen/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Define the new sorting block
sorting_block = """            // Sort jadwalList by date and then time score
            const SHOLAT_TIME_SCORES: Record<string, string> = {
                subuh: '05:00',
                dzuhur: '12:00',
                ashar: '15:30',
                isya: '19:30',
                lainnya: '23:59'
            };

            const getTimeScore = (item: any) => {
                return item.jam || SHOLAT_TIME_SCORES[item.waktu_sholat] || '23:59';
            };

            const sortedJadwal = (jadwalData || []).sort((a: any, b: any) => {
                if (a.tanggal !== b.tanggal) {
                    return a.tanggal.localeCompare(b.tanggal);
                }
                return getTimeScore(a).localeCompare(getTimeScore(b));
            });
            setJadwalList(sortedJadwal);"""

# The target to replace
# Looking at lines 81-85 from previous view_file
target = """            // Fetch jadwal for donation linking
            const { data: jadwalData } = await supabase
                .from('jadwal_safari')
                .select('*')
                .order('tanggal', { ascending: false });
            setJadwalList(jadwalData || []);"""

if target in content:
    new_content = content.replace(target, target.replace("ascending: false", "ascending: true").replace("setJadwalList(jadwalData || []);", sorting_block))
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully updated sorting logic in KomitmenPage")
else:
    # Try with CRLF
    target_alt = target.replace('\n', '\r\n')
    if target_alt in content:
        new_content = content.replace(target_alt, target_alt.replace("ascending: false", "ascending: true").replace("setJadwalList(jadwalData || []);", sorting_block.replace('\n', '\r\n')))
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Successfully updated sorting logic in KomitmenPage (CRLF)")
    else:
        print("Could not find target block in KomitmenPage")

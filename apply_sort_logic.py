import sys

with open('src/app/donasi/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Define the new sorting block
sorting_block = """            setDonaturList(donaturData || []);

            // Sort jadwalList by date and then time score
            const SHOLAT_TIME_SCORES: Record<string, string> = {
                subuh: '05:00',
                dzuhur: '12:00',
                ashar: '15:30',
                isya: '19:30',
                lainnya: '23:59'
            };

            const getTimeScore = (item: JadwalSafari) => {
                return item.jam || SHOLAT_TIME_SCORES[item.waktu_sholat] || '23:59';
            };

            const sortedJadwal = (jadwalData as JadwalSafari[] || []).sort((a, b) => {
                if (a.tanggal !== b.tanggal) {
                    return a.tanggal.localeCompare(b.tanggal);
                }
                return getTimeScore(a).localeCompare(getTimeScore(b));
            });

            setJadwalList(sortedJadwal);"""

# The target to replace
target = """            setDonaturList(donaturData || []);
            setJadwalList(jadwalData || []);"""

if target in content:
    new_content = content.replace(target, sorting_block)
    with open('src/app/donasi/page.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully added time-based sorting logic")
else:
    # Try with different line endings if the literal match fails
    target_alt = target.replace('\n', '\r\n')
    if target_alt in content:
        new_content = content.replace(target_alt, sorting_block.replace('\n', '\r\n'))
        with open('src/app/donasi/page.tsx', 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Successfully added time-based sorting logic (CRLF)")
    else:
        print("Could not find target block for replacement")
        # Print a snippet of content around where we expect the target to be
        import re
        match = re.search(r"setDonaturList\(donaturData \|\| \[\]\);", content)
        if match:
            start = max(0, match.start() - 50)
            end = min(len(content), match.end() + 50)
            print(f"Nearest match found: {repr(content[start:end])}")

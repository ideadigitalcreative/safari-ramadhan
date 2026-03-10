with open('src/app/donasi/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = "{j.nama_masjid} — {(j as any).waktu_sholat?.charAt(0).toUpperCase() + (j as any).waktu_sholat?.slice(1)} ({formatShortDate(j.tanggal)})"
replacement = "{j.nama_masjid} — {j.jam ? `[${j.jam}] ` : ''}{(j as any).waktu_sholat?.charAt(0).toUpperCase() + (j as any).waktu_sholat?.slice(1)} ({formatShortDate(j.tanggal)})"

if target in content:
    new_content = content.replace(target, replacement)
    with open('src/app/donasi/page.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Updated dropdown label with time")
else:
    print("Target dropdown label not found")

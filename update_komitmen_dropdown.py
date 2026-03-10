file_path = 'src/app/komitmen/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = "{j.nama_masjid} ({new Date(j.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })})"
# Consistency with Donasi page
replacement = "{j.nama_masjid} — {j.jam ? `[${j.jam}] ` : ''}{(j as any).waktu_sholat?.charAt(0).toUpperCase() + (j as any).waktu_sholat?.slice(1)} ({formatShortDate(j.tanggal)})"

if target in content:
    new_content = content.replace(target, replacement)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Updated dropdown label in KomitmenPage")
else:
    print("Target dropdown label not found in KomitmenPage")

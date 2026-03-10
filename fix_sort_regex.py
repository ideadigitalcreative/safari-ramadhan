import sys
import re

with open('src/app/donasi/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to find the fetch jadwal section
pattern = r"(\/\/ Fetch jadwal\s+const \{ data: jadwalData \} = await supabase\s+\.from\('jadwal_safari'\)\s+\.select\('\*'\)\s+\.order\('tanggal', \{ ascending: )false( \}\);)"
new_content = re.sub(pattern, r"\1true\2", content)

if content != new_content:
    with open('src/app/donasi/page.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully updated sorting to ascending")
else:
    print("Pattern not found")

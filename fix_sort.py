import sys

with open('src/app/donasi/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Line 75 is index 74
if "order('tanggal', { ascending: false });" in lines[74]:
    lines[74] = lines[74].replace("ascending: false", "ascending: true")
    print("Updated line 75")
else:
    print(f"Line 75 content mismatch: {repr(lines[74])}")

with open('src/app/donasi/page.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

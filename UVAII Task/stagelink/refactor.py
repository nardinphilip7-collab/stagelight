import os

replacements = {
    'bg-[#131314]': 'bg-[var(--as-bg)]',
    'bg-[#1c1b1c]': 'bg-[var(--as-surface)]',
    'bg-[#1A1A1A]': 'bg-[var(--as-bg)]',
    'text-[#e5e2e3]': 'text-[var(--as-text)]',
    'text-[#999077]': 'text-[var(--as-text-muted)]',
    'bg-[rgba(255,255,255,0.08)]': 'bg-[var(--as-border)]',
    'border-[rgba(255,255,255,0.08)]': 'border-[var(--as-border)]'
}

for root, dirs, files in os.walk('src'):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.css'):
            path = os.path.join(root, f)
            try:
                content = open(path, 'r', encoding='utf-8').read()
                new_content = content
                for k, v in replacements.items():
                    new_content = new_content.replace(k, v)
                if content != new_content:
                    open(path, 'w', encoding='utf-8').write(new_content)
                    print(f"Updated {path}")
            except Exception as e:
                pass

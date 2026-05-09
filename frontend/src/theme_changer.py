import os
import glob

replacements = {
    "bg-gray-950": "bg-[#030303]",
    "violet-600": "orange-600",
    "violet-500": "orange-500",
    "violet-400": "orange-400",
    "violet-300": "orange-300",
    "violet-900": "orange-900",
    "cyan-600": "amber-600",
    "cyan-500": "amber-500",
    "cyan-400": "amber-400",
}

for filepath in glob.glob('d:/Ai2/truthlens/frontend/src/**/*.tsx', recursive=True):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for old, new in replacements.items():
        new_content = new_content.replace(old, new)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
            
for filepath in glob.glob('d:/Ai2/truthlens/frontend/src/**/*.css', recursive=True):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    new_content = new_content.replace('glow-violet', 'glow-orange')
    new_content = new_content.replace('glow-cyan', 'glow-amber')
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

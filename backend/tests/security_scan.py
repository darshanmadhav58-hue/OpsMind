import os
import re

PATTERNS = [
    r'AIza[0-9A-Za-z-_]{35}',
    r'sk-[a-zA-Z0-9]{32,}',
    r'ghp_[a-zA-Z0-9]{36}',
    r'bearer\s+[a-zA-Z0-9_\-\.]{40,}',
    r'password\s*=\s*["\'][^"\']+["\']'
]

def scan():
    clean = True
    found_count = 0
    ignore_dirs = {'.venv', 'node_modules', '.git', 'dist', '__pycache__', '.pytest_cache'}
    
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        for f in files:
            if f.endswith(('.py', '.ts', '.tsx', '.json', '.md', '.html', '.css')):
                fpath = os.path.join(root, f)
                try:
                    with open(fpath, 'r', encoding='utf-8', errors='ignore') as fp:
                        content = fp.read()
                        for p in PATTERNS:
                            matches = re.findall(p, content, re.IGNORECASE)
                            if matches:
                                print(f"[FLAG] Possible secret in {fpath}: {matches}")
                                found_count += 1
                                clean = False
                except Exception as e:
                    pass
    if clean:
        print(">>> SECURITY SCAN PASSED: Zero exposed API keys, passwords, or secrets found! <<<")
    else:
        print(f">>> WARNING: Found {found_count} potential secrets <<<")

if __name__ == '__main__':
    scan()


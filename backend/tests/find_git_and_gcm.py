import os

def find_tools():
    paths_to_check = [
        r"C:\Program Files\Git",
        r"C:\Program Files (x86)\Git",
        os.path.expanduser(r"~\AppData\Local\Programs\Git"),
        os.path.expanduser(r"~\AppData\Local\GitHubDesktop"),
        r"C:\Program Files\GitHub CLI",
        os.path.expanduser(r"~\AppData\Local\Programs\GitHub CLI"),
        r"C:\Program Files\Git Credential Manager",
        os.path.expanduser(r"~\AppData\Local\Programs\Git Credential Manager"),
        r"C:\ProgramData\chocolatey\bin",
        os.path.expanduser(r"~\scoop\apps\git"),
    ]
    
    found = []
    for base in paths_to_check:
        if os.path.exists(base):
            print(f"Directory exists: {base}")
            for root, dirs, files in os.walk(base):
                for f in files:
                    if f.lower() in ["git.exe", "gh.exe", "git-credential-manager.exe", "git-credential-manager-core.exe"]:
                        p = os.path.join(root, f)
                        print(f"  FOUND: {p}")
                        found.append(p)
                        
    if not found:
        print("No standard git.exe or gh.exe installations found in common user directories.")

if __name__ == "__main__":
    find_tools()


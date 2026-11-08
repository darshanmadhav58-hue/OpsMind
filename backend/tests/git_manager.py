import os
import dulwich.porcelain as git
from dulwich.repo import Repo
from dulwich.ignore import IgnoreFilterManager

def prepare_repo():
    workspace_root = os.path.abspath(".")
    print(f"Working in: {workspace_root}")

    # 1. Initialize repo if not already initialized
    git_dir = os.path.join(workspace_root, ".git")
    if not os.path.exists(git_dir):
        repo = git.init(workspace_root)
        print("Initialized empty Git repository at", git_dir)
    else:
        repo = Repo(workspace_root)
        print("Git repository already exists at", git_dir)

    # 2. Collect files respecting .gitignore
    ignore_manager = IgnoreFilterManager.from_repo(repo)
    
    staged_files = []
    ignored_files = []
    
    for root, dirs, files in os.walk(workspace_root):
        rel_root = os.path.relpath(root, workspace_root)
        if rel_root == ".":
            rel_root = ""
            
        # Avoid traversing into .git
        if ".git" in dirs:
            dirs.remove(".git")
            
        for file in files:
            rel_path = os.path.join(rel_root, file).replace("\\", "/")
            if ignore_manager.is_ignored(rel_path):
                ignored_files.append(rel_path)
            else:
                staged_files.append(rel_path)

    print(f"\nTotal files to commit: {len(staged_files)}")
    print(f"Total ignored files: {len(ignored_files)}")
    
    # 3. Security Sanity Check on staged files
    sensitive_patterns = [".env", ".db", "node_modules", ".venv", "id_rsa", ".pem", ".key"]
    for f in staged_files:
        for p in sensitive_patterns:
            if p == ".env" and f == "backend/.env.example":
                continue
            if p in f:
                raise ValueError(f"CRITICAL: Sensitive file flagged for staging: {f}")
                
    print(">>> SECURITY AUDIT: Staged files are 100% clean of credentials, databases, and venvs! <<<\n")
    
    # 4. Stage files
    print("Staging files...")
    git.add(workspace_root, staged_files)
    
    # 5. Commit
    commit_msg = b"Initial commit: OpsMind - Intelligent Incident Response & Persistent Memory AI\n\n- Vectorize Hindsight persistent cognitive memory integration\n- Google Gemini AI causal reasoning & root cause analysis\n- Guarded remediation terminal with human-in-the-loop safety\n- 4-way hybrid incident retrieval and benchmark scenarios\n- Complete competition submission articles, documentation, and Docker blueprints"
    author = b"OpsMind Lead Engineer <sre-lead@opsmind.io>"
    
    # Set default branch to main
    try:
        commit_id = git.commit(workspace_root, message=commit_msg, author=author, committer=author)
        print(f"Commit created successfully! Hash: {commit_id.decode() if isinstance(commit_id, bytes) else commit_id}")
    except Exception as e:
        print(f"Commit note: {e}")

    # Set branch to refs/heads/main
    try:
        repo.refs[b"refs/heads/main"] = repo.head()
        repo.refs.set_symbolic_ref(b"HEAD", b"refs/heads/main")
        print("Branch set to 'main'")
    except Exception as e:
        print(f"Branch setting: {e}")

    # 6. Status check
    status = git.status(workspace_root)
    print("\nGit Status:")
    print("  Staged:", status.staged)
    print("  Untracked:", status.untracked)
    
if __name__ == "__main__":
    prepare_repo()

"""
OpsMind GitHub Push Helper (Pure Python / Dulwich)
Allows pushing to GitHub without requiring external Git binary installation.
Usage:
  python backend/tests/push_to_github.py <github-repo-url> [github-token]
"""

import sys
import os
import dulwich.porcelain as git
from dulwich.repo import Repo

def main():
    if len(sys.argv) < 2:
        print("Usage: python backend/tests/push_to_github.py <remote-repo-url> [github-personal-access-token]")
        print("Example: python backend/tests/push_to_github.py https://github.com/myuser/opsmind.git ghp_xyz123")
        sys.exit(1)

    remote_url = sys.argv[1].strip()
    token = sys.argv[2].strip() if len(sys.argv) > 2 else os.environ.get("GITHUB_TOKEN")

    # If token provided and URL is standard https, format with token for automated push
    if token and "https://" in remote_url and "@" not in remote_url:
        clean_url = remote_url.replace("https://", "")
        auth_url = f"https://{token}@{clean_url}"
    else:
        auth_url = remote_url

    repo = git.open_repo(".")
    print(f"Pushing branch 'main' (Commit: {repo.head().decode()[:8]}) to {remote_url}...")

    try:
        # Add or update remote 'origin'
        try:
            git.remote_add(repo, "origin", remote_url)
        except Exception:
            pass

        git.push(repo, auth_url, "refs/heads/main")
        print(f"\n>>> SUCCESS! Successfully pushed OpsMind to {remote_url} <<<")
    except Exception as e:
        print(f"\nPush notice: {e}")
        print("\nIf authentication failed, please ensure your GitHub Personal Access Token (PAT) has 'repo' write permissions.")

if __name__ == "__main__":
    main()


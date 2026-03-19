"""
Script để kết nối GitHub và lấy thông tin repository
"""
import requests
import json
import os
from typing import List, Dict, Optional

class GitHubConnector:
    def __init__(self, token: Optional[str] = None):
        """
        Khởi tạo GitHub connector
        
        Args:
            token: GitHub Personal Access Token (PAT)
                   Nếu None, sẽ tìm trong biến môi trường GITHUB_TOKEN
        """
        self.token = token or os.getenv('GITHUB_TOKEN')
        self.base_url = 'https://api.github.com'
        self.headers = {
            'Accept': 'application/vnd.github.v3+json',
        }
        
        if self.token:
            self.headers['Authorization'] = f'token {self.token}'
    
    def get_user_repos(self, username: Optional[str] = None) -> List[Dict]:
        """
        Lấy danh sách repository của user
        
        Args:
            username: Tên user GitHub. Nếu None, sẽ lấy repo của user đang authenticated
        
        Returns:
            Danh sách các repository
        """
        if username:
            url = f'{self.base_url}/users/{username}/repos'
        else:
            url = f'{self.base_url}/user/repos'
        
        repos = []
        page = 1
        per_page = 100
        
        while True:
            params = {
                'page': page,
                'per_page': per_page,
                'sort': 'updated',
                'direction': 'desc'
            }
            
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            
            data = response.json()
            if not data:
                break
            
            repos.extend(data)
            
            # Kiểm tra xem còn trang nào không
            if len(data) < per_page:
                break
            
            page += 1
        
        return repos
    
    def get_repo_info(self, owner: str, repo: str) -> Dict:
        """
        Lấy thông tin chi tiết của một repository
        
        Args:
            owner: Tên owner của repo
            repo: Tên repository
        
        Returns:
            Thông tin chi tiết của repository
        """
        url = f'{self.base_url}/repos/{owner}/{repo}'
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def clone_repo_url(self, repo: Dict) -> str:
        """
        Lấy URL để clone repository
        
        Args:
            repo: Dictionary chứa thông tin repo
        
        Returns:
            URL để clone (SSH hoặc HTTPS)
        """
        # Ưu tiên SSH nếu có token, nếu không dùng HTTPS
        if self.token and 'ssh_url' in repo:
            return repo['ssh_url']
        return repo['clone_url']
    
    def list_repos(self, username: Optional[str] = None) -> None:
        """
        In danh sách repository ra màn hình
        
        Args:
            username: Tên user GitHub
        """
        repos = self.get_user_repos(username)
        
        print(f"\n{'='*80}")
        print(f"Tìm thấy {len(repos)} repository:")
        print(f"{'='*80}\n")
        
        for i, repo in enumerate(repos, 1):
            print(f"{i}. {repo['full_name']}")
            print(f"   Mô tả: {repo.get('description', 'Không có mô tả')}")
            print(f"   URL: {repo['html_url']}")
            print(f"   Clone URL: {self.clone_repo_url(repo)}")
            print(f"   Ngôn ngữ: {repo.get('language', 'N/A')}")
            print(f"   Stars: {repo.get('stargazers_count', 0)}")
            print(f"   Private: {'Có' if repo.get('private') else 'Không'}")
            print()


def main():
    """
    Hàm main để chạy script
    """
    print("GitHub Repository Connector")
    print("=" * 80)
    
    # Kiểm tra token
    token = os.getenv('GITHUB_TOKEN')
    if not token:
        print("\n⚠️  Cảnh báo: Chưa có GitHub token!")
        print("Để sử dụng đầy đủ tính năng, vui lòng:")
        print("1. Tạo Personal Access Token tại: https://github.com/settings/tokens")
        print("2. Thiết lập biến môi trường: set GITHUB_TOKEN=your_token_here")
        print("\nBạn vẫn có thể xem public repos của user khác.\n")
        
        use_token = input("Bạn có muốn nhập token ngay bây giờ? (y/n): ").lower()
        if use_token == 'y':
            token = input("Nhập GitHub token: ").strip()
        else:
            token = None
    
    connector = GitHubConnector(token)
    
    # Lấy username
    username = input("\nNhập tên GitHub user (để trống nếu muốn lấy repo của bạn): ").strip()
    if not username:
        username = None
    
    try:
        connector.list_repos(username)
        
        # Hỏi xem có muốn clone repo nào không
        clone_choice = input("\nBạn có muốn clone một repository? (y/n): ").lower()
        if clone_choice == 'y':
            repo_num = input("Nhập số thứ tự của repo muốn clone: ").strip()
            try:
                repo_num = int(repo_num)
                repos = connector.get_user_repos(username)
                if 1 <= repo_num <= len(repos):
                    selected_repo = repos[repo_num - 1]
                    clone_url = connector.clone_repo_url(selected_repo)
                    print(f"\nĐể clone repository này, chạy lệnh:")
                    print(f"git clone {clone_url}")
                else:
                    print("Số thứ tự không hợp lệ!")
            except ValueError:
                print("Vui lòng nhập số hợp lệ!")
    
    except requests.exceptions.HTTPError as e:
        print(f"\n❌ Lỗi HTTP: {e}")
        if e.response.status_code == 401:
            print("Token không hợp lệ hoặc đã hết hạn!")
        elif e.response.status_code == 404:
            print("Không tìm thấy user hoặc repository!")
    except Exception as e:
        print(f"\n❌ Lỗi: {e}")


if __name__ == '__main__':
    main()


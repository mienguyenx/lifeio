# GitHub Repository Connector

Script Python để kết nối GitHub và lấy thông tin repository từ GitHub của bạn.

## Cài đặt

1. Cài đặt dependencies:
```bash
pip install -r requirements.txt
```

## Sử dụng

### Cách 1: Sử dụng script Python

Chạy script:
```bash
python github_connector.py
```

Script sẽ:
- Hiển thị danh sách tất cả repository của bạn
- Cho phép bạn chọn repository để clone

### Cách 2: Thiết lập GitHub Token (Tùy chọn nhưng khuyến nghị)

Để truy cập private repos và có rate limit cao hơn:

1. Tạo Personal Access Token tại: https://github.com/settings/tokens
   - Chọn scope: `repo` (để truy cập private repos)

2. Thiết lập biến môi trường:
   - Windows PowerShell:
     ```powershell
     $env:GITHUB_TOKEN="your_token_here"
     ```
   - Windows CMD:
     ```cmd
     set GITHUB_TOKEN=your_token_here
     ```
   - Linux/Mac:
     ```bash
     export GITHUB_TOKEN=your_token_here
     ```

### Cách 3: Clone repository trực tiếp

Nếu bạn đã biết URL repository, có thể clone trực tiếp:

```bash
git clone https://github.com/username/repo-name.git
```

Hoặc với SSH:
```bash
git clone git@github.com:username/repo-name.git
```

## Ví dụ sử dụng trong code

```python
from github_connector import GitHubConnector

# Khởi tạo connector
connector = GitHubConnector(token="your_token_here")

# Lấy danh sách repo của bạn
repos = connector.get_user_repos()

# Lấy thông tin một repo cụ thể
repo_info = connector.get_repo_info("username", "repo-name")

# Lấy URL để clone
clone_url = connector.clone_repo_url(repo_info)
```

## Lưu ý

- Không commit token vào git!
- Token nên được lưu trong biến môi trường hoặc file `.env` (không commit file này)


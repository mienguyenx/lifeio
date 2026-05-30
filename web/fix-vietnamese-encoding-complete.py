#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script để sửa encoding tiếng Việt trong database
Sử dụng psycopg2 để kết nối trực tiếp với PostgreSQL
"""

import subprocess
import sys

# Đọc file SQL và chạy với encoding UTF-8 đúng
def run_sql_file(file_path):
    """Chạy file SQL với encoding UTF-8"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # Chạy qua docker exec
        cmd = ['docker', 'exec', '-i', 'supabase_db_Supabase', 'psql', '-U', 'postgres', '-d', 'postgres']
        process = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding='utf-8'
        )
        
        stdout, stderr = process.communicate(input=sql_content)
        
        if process.returncode != 0:
            print(f"Error: {stderr}")
            return False
        
        print(stdout)
        return True
        
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == '__main__':
    # Chạy script SQL
    sql_file = 'fix-all-vietnamese-encoding.sql'
    if run_sql_file(sql_file):
        print("✅ Script đã chạy thành công!")
    else:
        print("❌ Script gặp lỗi!")
        sys.exit(1)


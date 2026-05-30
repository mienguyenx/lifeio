#!/bin/bash
# Script rebuild Docker container cho LifeOS

echo "🔄 Đang rebuild Docker image..."
docker-compose build --no-cache lifeos-app

echo "🛑 Đang dừng container cũ..."
docker-compose stop lifeos-app

echo "🚀 Đang khởi động container mới..."
docker-compose up -d lifeos-app

echo "✅ Hoàn thành! Container đã được rebuild và restart."
echo "📝 Kiểm tra logs: docker-compose logs -f lifeos-app"


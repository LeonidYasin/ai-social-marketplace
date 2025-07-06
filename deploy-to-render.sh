#!/bin/bash

# 🚀 Скрипт для автоматического развёртывания на Render.com
# Использование: ./deploy-to-render.sh

set -e

echo "🚀 Начинаем развёртывание на Render.com..."

# Проверяем, что мы в корневой папке проекта
if [ ! -f "render.yaml" ]; then
    echo "❌ Ошибка: файл render.yaml не найден. Убедитесь, что вы находитесь в корневой папке проекта."
    exit 1
fi

# Проверяем, что все необходимые файлы существуют
echo "📋 Проверяем наличие необходимых файлов..."

required_files=(
    "backend/package.json"
    "frontend/package.json"
    "backend/src/app.js"
    "frontend/src/App.jsx"
    "setup_database.sql"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Ошибка: файл $file не найден"
        exit 1
    fi
done

echo "✅ Все необходимые файлы найдены"

# Проверяем, что git репозиторий настроен
if [ ! -d ".git" ]; then
    echo "❌ Ошибка: .git папка не найдена. Убедитесь, что проект является git репозиторием."
    exit 1
fi

# Проверяем, что изменения закоммичены
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Внимание: есть незакоммиченные изменения"
    echo "Рекомендуется закоммитить изменения перед развёртыванием:"
    echo "  git add ."
    echo "  git commit -m 'Prepare for deployment'"
    echo ""
    read -p "Продолжить развёртывание? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Развёртывание отменено"
        exit 1
    fi
fi

echo "📤 Отправляем изменения в git..."
git push origin main

echo ""
echo "🎉 Готово! Теперь выполните следующие шаги в Render Dashboard:"
echo ""
echo "1. 📊 Создайте PostgreSQL Database:"
echo "   - Name: social-marketplace-db"
echo "   - Plan: Free"
echo ""
echo "2. 🔧 Создайте Web Service для Backend:"
echo "   - Name: social-marketplace-backend"
echo "   - Environment: Node"
echo "   - Build Command: cd backend && npm install"
echo "   - Start Command: cd backend && npm start"
echo "   - Health Check Path: /api/health"
echo ""
echo "3. 🎨 Создайте Static Site для Frontend:"
echo "   - Name: social-marketplace-frontend"
echo "   - Build Command: cd frontend && npm install && npm run build"
echo "   - Publish Directory: frontend/build"
echo ""
echo "4. ⚙️  Настройте переменные окружения:"
echo "   - JWT_SECRET (сильный секретный ключ)"
echo "   - SESSION_SECRET (сильный секретный ключ)"
echo "   - GOOGLE_CLIENT_ID и GOOGLE_CLIENT_SECRET"
echo "   - TELEGRAM_BOT_TOKEN"
echo "   - REACT_APP_API_URL (URL backend сервиса)"
echo ""
echo "5. 🗄️  Инициализируйте базу данных:"
echo "   - В консоли backend сервиса выполните: npm run init-db"
echo ""
echo "📖 Подробные инструкции см. в файле DEPLOYMENT_GUIDE.md"
echo ""
echo "🔗 Полезные ссылки:"
echo "   - Render Dashboard: https://dashboard.render.com/"
echo "   - Документация Render: https://render.com/docs"
echo "" 
# Используем базовый образ Node.js
FROM node:16

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Открываем порт, на котором будет работать приложение
EXPOSE 3000

# Команда для запуска приложения
CMD ["node", "app.js"]
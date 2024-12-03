const request = require('supertest');
const app = require('../app'); // Путь к вашему приложению
const { User } = require('../models');
const jwt = require('jsonwebtoken'); // Импортируем jwt

describe('GET /admin/users', () => {
    let token;

    beforeAll(async () => {
        // Создание администратора для тестирования
        const adminUser  = await User.create({
            email: 'admi1n@example.com',
            password: 'adminpassword',
            username: 'adminuser1',
            isAdmin: true
        });

        // Генерация токена для аутентификации
        token = jwt.sign({ userId: adminUser.id }, process.env.JWT_SECRET);
    });

    afterAll(async () => {
        // Очистка данных после теста
        await User.destroy({ where: { email: 'admi1n@example.com' } });
    });

    it('should return a list of users for authenticated admin', async () => {
        const response = await request(app)
            .get('/admin/users')
            .set('Authorization', `Bearer ${token}`); // Установка токена в заголовок

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true); // Проверка, что ответ - массив
        expect(response.body.length).toBeGreaterThan(0); // Проверка, что массив не пустой
    });

    it('should return a 401 error if not authenticated', async () => {
        const response = await request(app).get('/admin/users');

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('No authorization header provided');
    });

    it('should return a 403 error if user is not an admin', async () => {
        // Создание обычного пользователя
        const normalUser  = await User.create({
            email: 'user@example.com',
            password: 'userpassword',
            username: 'normaluser',
            isAdmin: false
        });

        // Генерация токена для обычного пользователя
        const userToken = jwt.sign({ userId: normalUser.id }, process.env.JWT_SECRET);

        const response = await request(app)
            .get('/admin/users')
            .set('Authorization', `Bearer ${userToken}`); // Установка токена в заголовок

        expect(response.status).toBe(403);
        expect(response.body.message).toBe('Access denied');

        // Очистка данных после теста
        await User.destroy({ where: { email: 'user@example.com' } });
    });
});
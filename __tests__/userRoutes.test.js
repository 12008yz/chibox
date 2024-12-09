const request = require("supertest");
const app = require("../app"); // Путь к вашему приложению
const { User, Notification, Item } = require("../models");

// Тест регистрации
describe("POST /users/register", () => {
  it("should register a new user", async () => {
    const response = await request(app)
      .post("/users/register")
      .send({
        email: `uniqueemail${Date.now()}@example.com`, // Уникальный email
        password: "strongpassword",
        username: `uniqueusername${Date.now()}`, // Уникальный username
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Пользователь успешно зарегистрирован!");
  });

  it("should return an error if the user already exists", async () => {
    await request(app).post("/users/register").send({
      email: "test@example.com",
      password: "password123",
      username: "testuser",
    });

    const response = await request(app).post("/users/register").send({
      email: "test@example.com",
      password: "password123",
      username: "testuser",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Пользователь с таким email или username уже существует."
    );
  });
});

// Тест логина
describe("POST /users/login", () => {
  it("should login an existing user", async () => {
    // Сначала зарегистрируем пользователя
    await request(app).post("/users/register").send({
      email: "test@example.com",
      password: "password123",
      username: "testuser",
    });

    // Теперь попытаемся войти с теми же данными
    const response = await request(app).post("/users/login").send({
      email: "test@example.com",
      password: "password123",
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Успешный вход!");
  });

  it("should return an error if the credentials are incorrect", async () => {
    const response = await request(app).post("/users/login").send({
      email: "nonexistent@example.com",
      password: "wrongpassword",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Email не найден");
  });
});

// Тест уведомлений
describe("GET /users/notifications", () => {
  let token;
  let userId;

  beforeAll(async () => {
    // Генерация уникальных данных
    const uniqueEmail = `testuser${Date.now()}@example.com`;
    const uniqueUsername = `testuser${Date.now()}`;

    // Регистрация пользователя
    const response = await request(app).post("/users/register").send({
      email: uniqueEmail,
      password: "password123",
      username: uniqueUsername,
    });

    expect(response.status).toBe(201); // Проверка успешной регистрации
    userId = response.body.id;

    // Логин для получения токена
    const loginResponse = await request(app).post("/users/login").send({
      email: uniqueEmail,
      password: "password123",
    });

    expect(loginResponse.status).toBe(200); // Проверка успешного входа
    token = loginResponse.body.token;

    expect(token).toBeDefined(); // Проверка, что токен не undefined

    // Создание уведомлений для теста
    await Notification.create({
      receiverId: userId,
      message: "Test notification 1",
      read: false,
    });
    await Notification.create({
      receiverId: userId,
      message: "Test notification 2",
      read: false,
    });
  });

  it("should return notifications for the authenticated user", async () => {
    const response = await request(app)
      .get("/users/notifications")
      .set("Authorization", `Bearer ${token}`); // Установка токена в заголовок

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true); // Проверка, что ответ - массив
    expect(response.body.length).toBe(2); // Проверка, что вернулось 2 уведомления

    // Проверка, что оба уведомления присутствуют, независимо от порядка
    const messages = response.body.map((notification) => notification.message);
    expect(messages).toContain("Test notification 1");
    expect(messages).toContain("Test notification 2");
  });

  afterAll(async () => {
    // Очистка данных после теста
    await User.destroy({ where: { id: userId } });
    await Notification.destroy({ where: { receiverId: userId } });
  });
});

// Получение данных вошедшего пользователя
describe("GET /users/me", () => {
  let token; // Переменная для хранения токена

  beforeAll(async () => {
    // Генерация уникальных данных
    const uniqueEmail = `testuser${Date.now()}@example.com`;
    const uniqueUsername = `testuser${Date.now()}`;

    // Регистрация пользователя
    const response = await request(app).post("/users/register").send({
      email: uniqueEmail,
      password: "password123",
      username: uniqueUsername,
    });

    expect(response.status).toBe(201); // Проверка успешной регистрации

    // Логин для получения токена
    const loginResponse = await request(app).post("/users/login").send({
      email: uniqueEmail,
      password: "password123",
    });

    expect(loginResponse.status).toBe(200); // Проверка успешного входа
    token = loginResponse.body.token; // Сохранение токена
  });

  it("should return user data for the authenticated user", async () => {
    const response = await request(app)
      .get("/users/me")
      .set("Authorization", `Bearer ${token}`); // Установка токена в заголовок

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id"); // Проверка, что в ответе есть ID
    expect(response.body).toHaveProperty("username"); // Проверка, что в ответе есть имя пользователя
    expect(response.body).toHaveProperty("profilePicture"); // Проверка, что в ответе есть изображение профиля
    expect(response.body).toHaveProperty("xp"); // Проверка, что в ответе есть XP
    expect(response.body).toHaveProperty("level"); // Проверка, что в ответе есть уровень
    expect(response.body).toHaveProperty("walletBalance"); // Проверка, что в ответе есть баланс кошелька
    expect(response.body).toHaveProperty("nextBonus"); // Проверка, что в ответе есть следующий бонус
  });

  it("should return an error if the user is not authenticated", async () => {
    const response = await request(app).get("/users/me"); // Запрос без токена

    expect(response.status).toBe(401); // Ожидаем статус 401
    expect(response.body.message).toBe("No authorization header provided"); // Проверка сообщения об ошибке
  });

  afterAll(async () => {
    // Очистка данных после теста
    await User.destroy({ where: { email: token } }); // Удаление пользователя
  });
});

// Получение топ недели
describe("GET /users/topPlayers", () => {
  it("should return top players", async () => {
    const response = await request(app).get("/users/topPlayers");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeLessThanOrEqual(10); // Не более 10 игроков

    // Проверка, что каждый игрок имеет необходимые поля
    response.body.forEach((player) => {
      expect(player).toHaveProperty("id");
      expect(player).toHaveProperty("username");
      expect(player).toHaveProperty("weeklyWinnings");
      expect(player).toHaveProperty("profilePicture");
      expect(player).toHaveProperty("level");
      expect(player).toHaveProperty("fixedItem");
    });
  });

  it("should return an empty array if no players exist", async () => {
    // Мокируем метод findAll, чтобы он возвращал пустой массив
    jest.spyOn(User, "findAll").mockResolvedValue([]);

    const response = await request(app).get("/users/topPlayers");
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]); // Ожидаем пустой массив

    // Восстанавливаем оригинальную реализацию метода после теста
    User.findAll.mockRestore();
  });

  it("should handle server errors", async () => {
    // Мокируем метод findAll, чтобы он выбрасывал ошибку
    jest.spyOn(User, "findAll").mockImplementation(() => {
      throw new Error("Database error");
    });

    const response = await request(app).get("/users/topPlayers");
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Ошибка сервера");

    // Восстанавливаем оригинальную реализацию метода после теста
    User.findAll.mockRestore();
  });
});

describe("GET /users/me", () => {
  let token;
  let userId;

  beforeAll(async () => {
    // Создаем тестового пользователя
    const user = await User.create({
      username: "t111e123stuse123r",
      email: "te123st12321us123er@example.com",
      password: "password123",
      walletBalance: 100,
      inventory: [],
      fixedItem: {},
      xp: 0,
      level: 1,
      profilePicture: "",
      isAdmin: false,
      nextBonus: new Date(),
      bonusAmount: 1000,
      weeklyWinnings: 0,
      lastWinningsUpdate: new Date(),
    });

    userId = user.id;

    // Логинимся для получения токена
    const loginResponse = await request(app).post("/users/login").send({
      email: "te123st12321us123er@example.com",
      password: "password123",
    });

    token = loginResponse.body.token;
    console.log("Token:", token);
  });

  it("should return user data for the authenticated user", async () => {
    const response = await request(app)
      .get("/users/me")
      .set("Authorization", `Bearer ${token}`); // Установка токена в заголовок

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id", userId); // Проверка, что ID совпадает
    expect(response.body).toHaveProperty("username", "testuser"); // Проверка имени пользователя
    expect(response.body).toHaveProperty("email", "testuser@example.com"); // Проверка email
    expect(response.body).toHaveProperty("walletBalance", 100); // Проверка баланса
    expect(response.body).toHaveProperty("inventory"); // Проверка инвентаря
    expect(response.body).toHaveProperty("fixedItem"); // Проверка фиксированного предмета
    expect(response.body).toHaveProperty("xp", 0); // Проверка XP
    expect(response.body).toHaveProperty("level", 1); // Проверка уровня
  });

  afterAll(async () => {
    // Удаляем тестового пользователя, если userId определен
    if (userId) {
      await User.destroy({ where: { id: userId } });
    }
  });
});

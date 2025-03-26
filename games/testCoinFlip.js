const io = require("socket.io-client");
const socket = io("http://localhost:3000"); // Убедитесь, что порт соответствует вашему серверу

socket.on("connect", () => {
  console.log("Подключено к серверу");

  // Задержка перед отправкой событий
  setTimeout(() => {
    // Пример отправки события ставки
    socket.emit("coinFlip:bet", { id: "1" }, 100, 0); // user1 делает ставку 100 на "heads"

    // Пример отправки события выбора
    socket.emit("coinFlip:choice", { id: "1" }, 0); // user1 выбирает "heads"
  }, 1000); // Задержка 1 секунда
});

socket.on("userDataUpdated", (data) => {
  console.log("Данные пользователя обновлены:", data);
});

socket.on("coinFlip:gameState", (gameState) => {
  console.log("Состояние игры обновлено:", gameState);
});

socket.on("coinFlip:result", (result) => {
  console.log("Результат игры:", result);
});

const { User } = require("../models");
const updateUserWinnings = require("../utils/updateUserWinnings");
const updateLevel = require("../utils/updateLevel");

const coinFlip = (io) => {
  let gameState = {
    processedBets: {}, // Добавляем объект для отслеживания обработанных ставок
    heads: {
      players: {},
      bets: {},
      choices: {},
    },
    tails: {
      players: {},
      bets: {},
      choices: {},
    },
  };

  io.on("connection", (socket) => {
    socket.on("coinFlip:bet", async ({ user, bet, choice }) => {
      console.log(
        `Received bet: ${bet} on choice: ${choice} from user: ${user.id}`
      );

      try {
        // Проверка, была ли уже обработана ставка для данного пользователя
        if (gameState.processedBets[user.id]) {
          console.log(`Ставка уже обработана для пользователя: ${user.id}`);
          return; // Если ставка уже обработана, выходим
        }

        // Обработка ставки игрока

        // Если ставка не является числом или меньше 0, вернуть ошибку
        if (isNaN(bet) || bet < 1 || bet > 1000000) {
          return;
        }

        // Проверка, есть ли у пользователя достаточный баланс
        const dbUser = await User.findByPk(user.id);
        if (dbUser.walletBalance < bet) {
          return;
        }

        const betType = choice === 0 ? "heads" : "tails";
        gameState[betType].bets[user.id] = bet;

        // Обновление баланса игрока
        updateLevel(dbUser, bet);
        dbUser.walletBalance -= bet;
        await dbUser.save();

        const userDataPayload = {
          walletBalance: dbUser.walletBalance,
          xp: dbUser.xp,
          level: dbUser.level,
        };
        io.to(user.id).emit("userDataUpdated", userDataPayload);

        // После обновления пользователя добавляем его в состояние игры
        gameState[betType].players[user.id] = dbUser;

        // Отмечаем, что ставка была обработана
        gameState.processedBets[user.id] = true;

        // Отправка обновленного состояния игры всем клиентам
        io.emit("coinFlip:gameState", gameState);
        console.log("Ставка Работает!");
      } catch (err) {
        console.log(err);
      }
    });

    socket.on("coinFlip:choice", ({ user, choice }) => {
      // Обработка выбора игрока
      const choiceType = choice === 0 ? "heads" : "tails";
      gameState[choiceType].choices[user.id] = choice;

      // Отправка обновленного состояния игры всем клиентам
      io.emit("coinFlip:gameState", gameState);
    });
  });

  const calculatePayout = async (result) => {
    let winningChoice = result === 0 ? "heads" : "tails";

    for (let userId in gameState[winningChoice].choices) {
      // Игрок выигрывает, обновляем его баланс
      try {
        const betAmount = gameState[winningChoice].bets[userId];
        const user = await User.findByPk(userId);

        user.walletBalance += betAmount * 2;
        updateUserWinnings(user, betAmount);

        await user.save();

        const userDataPayload = {
          walletBalance: user.walletBalance,
          xp: user.xp,
          level: user.level,
        };

        io.to(userId).emit("userDataUpdated", userDataPayload);
      } catch (err) {
        console.log(err);
      }
    }
  };

  const startGame = async () => {
    io.emit("coinFlip:start");

    // Сбрасываем обработанные ставки перед началом новой игры
    gameState.processedBets = {}; // Обнуляем объект обработанных ставок

    const result = Math.floor(Math.random() * 2);

    setTimeout(async () => {
      // Отправляем результат только после 5 секунд анимации
      setTimeout(() => {
        io.emit("coinFlip:result", result);
      }, 5000); // 5 секунд на анимацию

      // Calculate payouts based on game result and player choices
      await calculatePayout(result);

      // Reset game state
      gameState = {
        processedBets: {}, // Сбрасываем обработанные ставки
        heads: {
          players: {},
          bets: {},
          choices: {},
        },
        tails: {
          players: {},
          bets: {},
          choices: {},
        }
      };

      setTimeout(startGame, 14000); // 14 секунд до следующей игры
    }, 5000); // 5 секунд на ставки
  };

  startGame();
};

module.exports = coinFlip;
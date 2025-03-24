const { User } = require("../models");
const updateUserWinnings = require("../utils/updateUserWinnings");
const updateLevel = require("../utils/updateLevel");

const coinFlip = (io) => {
  let gameState = {
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
    // Обработчик для запроса текущего состояния игры
    socket.on("requestGameState", () => {
      socket.emit("coinFlip:gameState", gameState);
    });

    socket.on("coinFlip:bet", async (user, bet, choice) => {
      try {
        if (isNaN(bet) || bet < 1 || bet > 1000000) {
          return;
        }

        const dbUser = await User.findByPk(user.id);
        if (dbUser.walletBalance < bet) {
          return;
        }

        const betType = choice === 0 ? "heads" : "tails";
        gameState[betType].bets[user.id] = bet;

        const previousBalance = dbUser.walletBalance; // Сохраняем предыдущий баланс
        dbUser.walletBalance -= bet; // Списываем ставку
        await dbUser.save();

        const userDataPayload = {
          walletBalance: dbUser.walletBalance,
          xp: dbUser.xp,
          level: dbUser.level,
        };
        io.to(user.id).emit("userDataUpdated", userDataPayload);

        gameState[betType].players[user.id] = dbUser;
        io.emit("coinFlip:gameState", gameState);

        // Передаем previousBalance в calculatePayout
        calculatePayout(previousBalance, choice);
      } catch (err) {
        console.log(err);
      }
    });

    socket.on("coinFlip:choice", (user, choice) => {
      const choiceType = choice === 0 ? "heads" : "tails";
      gameState[choiceType].choices[user.id] = choice;
      io.emit("coinFlip:gameState", gameState);
    });
  });

  const calculatePayout = async (previousBalance, result) => {
    let winningChoice = result === 0 ? "heads" : "tails";

    for (let userId in gameState[winningChoice].choices) {
      try {
        const betAmount = gameState[winningChoice].bets[userId];
        const user = await User.findByPk(userId);

        // Проверяем, совпадает ли выбор пользователя с результатом
        if (gameState[winningChoice].choices[userId] === winningChoice) {
          console.log(
            `User ID: ${userId}, Bet Amount: ${betAmount}, Previous Balance: ${previousBalance}`
          );
          user.walletBalance = previousBalance + betAmount * 2; // Обновляем баланс после выигрыша
          console.log(`New Balance after win: ${user.walletBalance}`);
          updateUserWinnings(user, betAmount);
        } else {
          console.log(`User ID: ${userId} lost the bet.`);
          // В случае проигрыша, баланс не изменяется
        }

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
    const result = Math.floor(Math.random() * 2);
    setTimeout(async () => {
      console.log("Sending coinFlip:result:", result); // Лог для отладки
      io.emit("coinFlip:result", result);
      await calculatePayout(result);

      // Сброс состояния игры
      gameState = {
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

      // Запуск нового раунда через 14 секунд
      setTimeout(startGame, 14000);
    }, 5000); // Анимация монеты длится 5 секунд
  };

  startGame();
};

module.exports = coinFlip;

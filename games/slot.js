const SlotGame = require('../models/Slot');
const User = require('../models/User');
const updateLevel = require("../utils/updateLevel");
const updateUserWinnings = require("../utils/updateUserWinnings");

class SlotGameController {
    static async spin(userId, betAmount, io) {
        // Проверка суммы ставки
        if (isNaN(betAmount) || betAmount < 0.5 || betAmount > 50000) {
            throw new Error("Invalid bet amount");
        }

        // Проверка баланса пользователя
        const player = await User.findById(userId).select("-password -email -isAdmin -nextBonus -inventory");
        if (!player || player.walletBalance < betAmount) {
            throw new Error("Insufficient balance");
        }

        // Обновление уровня игрока
        updateLevel(player, betAmount);

        // Генерация случайного состояния грида
        const gridState = this.generateRandomGrid();

        // Подсчет выигрышей
        const winResults = this.calculateWins(gridState);

        // Проверка специальных функций
        let manekiNekoFeature = false;
        if (this.checkForManekiNeko(gridState)) {
            manekiNekoFeature = true;
            // Логика для функции Maneki-neko
        }

        // Расчет общего выигрыша
        const totalPayout = this.calculateTotalPayout(winResults, betAmount);

        // Обновление баланса игрока
        if (winResults.length > 0) {
            player.walletBalance += totalPayout;
            updateUserWinnings(player, totalPayout);
        }

        await player.save();

        // Отправка обновленных данных пользователя
        const updatedUserData = {
            walletBalance: player.walletBalance,
            xp: player.xp,
            level: player.level,
        };

        setTimeout(() => {
            io.to(userId.toString()).emit('userDataUpdated', updatedUserData);
        }, 3000);

        // Возвращение состояния игры
        return {
            userId: userId,
            betAmount: betAmount,
            gridState: gridState,
            lastSpinResult: winResults,
            manekiNekoFeature: manekiNekoFeature,
            totalPayout: totalPayout
        };
    }

    static generateRandomGrid() {
        const symbolFrequencies = {
            'red': 100,
            'blue': 90,
            'green': 80,
            'yin_yang': 50,
            'hakkero': 30,
            'yellow': 20,
            'wild': 20
        };

        let symbolPool = [];
        for (const symbol in symbolFrequencies) {
            symbolPool.push(...Array(symbolFrequencies[symbol]).fill(symbol));
        }

        const grid = Array.from({ length: 9 }, () => {
            const randomIndex = Math.floor(Math.random() * symbolPool.length);
            return symbolPool[randomIndex];
        });

        return grid;
    }

    static calculateWins(grid) {
        const symbolPayouts = {
            red: 0.5,
            blue: 1,
            green: 3,
            yin_yang: 8,
            hakkero: 12,
            yellow: 25,
            wild: 100
        };

        const wins = [];

        // Функция для расчета выигрыша по линии
        const calculateLinePayout = (line) => {
            if (line.every(symbol => symbol === line[0] || symbol === 'wild')) {
                const mainSymbol = line[0] !== 'wild' ? line[0] : line[1];
                return symbolPayouts[mainSymbol];
            }
            return 0;
        };

        // Проверка горизонтальных линий
        for (let i = 0; i < 9; i += 3) {
            const line = [grid[i], grid[i + 1], grid[i + 2]];
            const payout = calculateLinePayout(line);
            if (payout > 0) wins.push({ line: `Horizontal ${i / 3 + 1}`, payout });
        }

        // Проверка диагоналей
        const diagonal1 = [grid[0], grid[4], grid[8]];
        const diagonal2 = [grid[2], grid[4], grid[6]];
        const diagonal1Payout = calculateLinePayout(diagonal1);
        const diagonal2Payout = calculateLinePayout(diagonal2);
        if (diagonal2Payout > 0) wins.push({ line: "Diagonal 2", payout: diagonal2Payout });

        return wins;
    }

    static checkForManekiNeko(grid) {
        // Проверка на наличие трех "wild" подряд
        if (grid.slice(3, 6).every(symbol => symbol === 'wild')) {
            // Замена боковых символов на случайный символ
            const newGrid = [
                grid[0], grid[1], grid[2],
                this.getRandomSymbol(), this.getRandomSymbol(), this.getRandomSymbol(),
                grid[6], grid[7], grid[8]
            ];

            // Повторное вращение центральной части
            for (let i = 3; i < 6; i++) {
                const randomSymbol = this.getRandomSymbol();
                while (newGrid[i] === randomSymbol) {
                    randomSymbol = this.getRandomSymbol();
                }
                newGrid[i] = randomSymbol;
            }

            return newGrid;
        }

        return false;
    }

    static getRandomSymbol() {
        const symbols = ['red', 'blue', 'green', 'yin_yang', 'hakkero', 'yellow', 'wild'];
        const randomIndex = Math.floor(Math.random() * symbols.length);
        return symbols[randomIndex];
    }
}

module.exports = SlotGameController;
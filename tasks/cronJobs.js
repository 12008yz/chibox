const cron = require('node-cron');
const { User, Notification } = require('../models'); // Импортируем модели из вашего index.js

module.exports = {
   startCronJobs: function (io) {
      // Запланировать задачу, которая будет выполняться каждую среду в 20:00 -3 UTC
      cron.schedule('0 20 * * 3', async () => {
         try {
            // Получить топ 3 пользователей и установить следующий бонус на 10000, 5000, 2500
            const topUsers = await User.findAll({
               order: [['weeklyWinnings', 'DESC']],
               limit: 3
            });

            const bonus = [10000, 5000, 2500];
            for (let i = 0; i < topUsers.length; i++) {
               const user = topUsers[i];
               user.bonusAmount = bonus[i];
               await user.save();

               // Создать новое уведомление
               const newNotification = await Notification.create({
                  receiverId: user.id,
                  message: `You have been awarded K₽${bonus[i]} for being in the top 3 on the leaderboard!`,
                  read: false
               });

               // Эмитировать событие для пользователя
               io.to(user.id.toString()).emit("newNotification", {
                  message: `You have been awarded K₽${bonus[i]} for being in the top 3 on the leaderboard!`
               });
            }

            // Сбросить недельные выигрыши для всех пользователей
            await User.update({ weeklyWinnings: 0 }, { where: {} });

            console.log('Weekly winnings reset successfully.');
         } catch (error) {
            console.error('Error resetting weekly winnings:', error);
         }
      });
   }
}
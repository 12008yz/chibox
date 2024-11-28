const User = require('../models/User');
const Item = require('../models/Item')

const baseChances = {
   "1": { "1": 0.5, "2": 0.2, "3": 0.1, "4": 0.05, "5": 0.002 },
   "2": { "1": 0.2, "2": 0.5, "3": 0.2, "4": 0.1, "5": 0.01 },
   "3": { "1": 0.1, "2": 0.2, "3": 0.5, "4": 0.2, "5": 0.05 },
   "4": { "1": 0.05, "2": 0.1, "3": 0.2, "4": 0.5, "5": 0.1 },
   "5": { "1": 0.002, "2": 0.01, "3": 0.05, "4": 0.1, "5": 0.5 }
};

const calculateSuccessRate = (selectedItems, targetRarity) => {
   let totalChance = 1;
   let diminishingFactor = 1;

   const diminishingRate = 0.9;

   selectedItems.forEach(item => {
      const itemRarity = item.rarity;
      const chance = baseChances[itemRarity][targetRarity] || 0;
      totalChance *= chance * diminishingFactor;
      diminishingFactor *= diminishingRate; // Уменьшаем шанс с каждым предметом
   });

   return totalChance;
};


const upgradeItems = async (userId, itemId, targetRarity) => {
   try {
      const user = await User.findByPk(userId);
      const item = await Item.findByPk(itemId);

      if (!user || !item) {
         throw new Error("User or item not found");
      }

      // Проверка, достаточно ли средств у пользователя для улучшения
      const upgradeCost = 100; // Определите стоимость улучшения
      if (user.walletBalance < upgradeCost) {
         throw new Error("Insufficient funds for upgrade")
      }

      const successRate = calculateSuccessRate([item], targetRarity);
      const isSuccess = Math.random() < successRate;

      if (isSuccess) {
         // Успешное улучшение
         item.rarity = targetRarity; // Обновляем редкость предмета
         await item.save();
         user.walletBalance -= upgradeCost; // Уменьшаем баланс пользователя
         await user.save();
         return { success: true, message: "Item upgraded successfully", item };
      } else {
         // Неудачное улучшение
         return { success: false, message: "Upgrade failed", item };
      }
   } catch (error) {
      console.error("Error during upgrade:", error);
      throw new Error("An error occurred during the upgrade process");
   }
};

module.exports = upgradeItems;
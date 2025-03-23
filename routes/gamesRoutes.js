const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/authMiddleware");
const User = require("../models/User");
const Case = require("../models/Case");
const SlotGameController = require("../games/slot");
const updateLevel = require("../utils/updateLevel");
const { Item } = require("../models");
const upgradeItems = require("../games/upgrade");

// Массив редкостей
const Rarities = [
  { id: "1", chance: 0.7992 },
  { id: "2", chance: 0.1598 },
  { id: "3", chance: 0.032 },
  { id: "4", chance: 0.0064 },
  { id: "5", chance: 0.0026 },
];

function groupItemsByRarity(items) {
  const itemsByRarity = {};
  items.forEach((item) => {
    if (!itemsByRarity[item.rarity]) {
      itemsByRarity[item.rarity] = [];
    }
    itemsByRarity[item.rarity].push(item);
  });
  return itemsByRarity;
}

function getRandomWeightedItem(items, weightPropertyName) {
  const randomNumber = Math.random();
  let cumulativeWeight = 0;
  for (const item of items) {
    cumulativeWeight += item[weightPropertyName];
    if (randomNumber <= cumulativeWeight) {
      return item;
    }
  }
}

function getRandomItemFromRarity(itemsByRarity, rarity) {
  const items = itemsByRarity[rarity];
  if (!items || items.length === 0) {
    return null;
  }
  return items[Math.floor(Math.random() * items.length)];
}

function getWinningItem(caseData) {
  const itemsByRarity = groupItemsByRarity(caseData.items);
  const winningsRarity = getRandomWeightedItem(Rarities, "chance");
  let winningsItem = getRandomItemFromRarity(itemsByRarity, winningsRarity.id);

  if (!winningsItem) {
    const existingRarities = Object.keys(itemsByRarity);
    const randomExistingRarity =
      existingRarities[Math.floor(Math.random() * existingRarities.length)];
    winningsItem = getRandomItemFromRarity(itemsByRarity, randomExistingRarity);
  }
  return winningsItem;
}

const addUniqueInfoToItem = (item) => {
  return {
    caseId: item.caseId,
    name: item.name,
    image: item.image,
    rarity: item.rarity,
    case: item.case,
    uniqueId: require("uuid").v4(),
  };
};

module.exports = (io) => {
  router.post("/openCase/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      const quantityToOpen = req.body.quantity;
      const winningItems = [];

      const caseData = await Case.findByPk(id, {
        include: {
          model: Item,
        },
      });

      if (!caseData || !user) {
        if (!caseData) {
          return res.status(404).json({ message: "Case not found" });
        } else {
          return res.status(404).json({ message: "User not found" });
        }
      }

      if (!Number.isInteger(quantityToOpen)) {
        return res
          .status(400)
          .json({ message: "Quantity to open must be an integer" });
      }
      if (quantityToOpen > 5) {
        return res
          .status(400)
          .json({ message: "You can only open up to 5 cases at a time" });
      }

      if (quantityToOpen < 1) {
        return res
          .status(400)
          .json({ message: "You need to open at least 1 case" });
      }

      if (user.walletBalance < caseData.price * quantityToOpen) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      for (let i = 0; i < quantityToOpen; i++) {
        const winningItem = getWinningItem(caseData);
        const itemWithUniqueId = addUniqueInfoToItem(winningItem);
        winningItems.push(itemWithUniqueId);
      }

      user.inventory = [...user.inventory, ...winningItems];

      updateLevel(user, caseData.price * quantityToOpen);

      await user.save();

      const winnerUser = {
        name: user.username,
        id: user.id,
        profilePicture: user.profilePicture,
      };

      io.emit("caseOpened", {
        winningItems: winningItems,
        user: winnerUser,
        caseImage: caseData.image,
      });
      res.json({ items: winningItems });

      const userDataPayload = {
        walletBalance: user.walletBalance,
        xp: user.xp,
        level: user.level,
      };
      io.to(user.id.toString()).emit("userDataUpdated", userDataPayload);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Ошибка сервера" });
    }
  });

  // Upgrade items
  router.post("/upgrade", isAuthenticated, async (req, res) => {
    const { selectedItemsIds, targetRarityId } = req.body;
    const user = req.user;

    try {
      const result = await upgradeItems(user, selectedItemsIds, targetRarityId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Ошибка при обновлении предметов" });
    }
  });

  router.post("/slots", isAuthenticated, async (req, res) => {
    const user = req.user;

    try {
      const { betAmount } = req.body;

      const result = await SlotGameController.spin(user.id, betAmount, io);
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  });

  // router.post("/coinFlip/bet", isAuthenticated, (req, res) => {
  //   const { user, bet, choice } = req.body;
  //   io.emit("coinFlip:bet", user, bet, choice);
  //   res.status(200).json({ message: "Bet placed successfully" });
  // });

  return router;
};

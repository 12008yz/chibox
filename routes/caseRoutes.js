const express = require('express');
const router = express.Router()
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');
const Case = require('../models/Case')

router.get('/', async (req, res) => {
   try {
      const cases = await Case.findAll({
         attributes: { exclude: ['items'] }
      })
      res.json(cases);
   } catch (err) {
      res.status(500).json({ message: err.message });
   }
})

router.post('/', isAuthenticated, isAdmin, async (req, res) => {
   const newCase = new Case({
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      items: req.body.items
   });

   try {
      const savedCase = await newCase.save()
      res.status(201).json(savedCase)
   } catch (err) {
      res.status(400).json({ message: err.message });
   };
})

module.exports = router
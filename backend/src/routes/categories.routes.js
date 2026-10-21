const { Router } = require('express');
const categoriesController = require('../controllers/categories.controller');

// Public on purpose: the order filter needs the category list before a visitor
// has logged in. Creating and editing categories is under /admin.
const router = Router();

router.get('/', categoriesController.list);

module.exports = router;

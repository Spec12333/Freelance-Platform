const { Category } = require('../models');

// Public read side of categories. The admin CRUD lives in admin.service.js,
// because it is guarded by a role and has its own rules.
const list = () => Category.findAll({ attributes: ['id', 'name', 'slug'], order: [['name', 'ASC']] });

module.exports = { list };

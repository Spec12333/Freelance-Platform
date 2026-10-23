const { Router } = require('express');
const { auth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { validate } = require('../middleware/validate');
const { ROLES } = require('../config/constants');
const { idParam, paginationSchema } = require('../validators/common');
const { adminUsersQuery, blockUserSchema, categorySchema } = require('../validators/admin');
const adminController = require('../controllers/admin.controller');

const router = Router();
const withId = validate(idParam, 'params');

// One guard for the whole router: nothing below can be reached without it.
router.use(auth, requireRole(ROLES.ADMIN));

router.get('/users', validate(adminUsersQuery, 'query'), adminController.listUsers);
router.patch('/users/:id/block', withId, validate(blockUserSchema), adminController.setBlocked);

router.get('/categories', validate(paginationSchema, 'query'), adminController.listCategories);
router.post('/categories', validate(categorySchema), adminController.createCategory);
router.patch('/categories/:id', withId, validate(categorySchema), adminController.renameCategory);
router.delete('/categories/:id', withId, adminController.deleteCategory);

module.exports = router;

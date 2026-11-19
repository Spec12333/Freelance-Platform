const { Router } = require('express');
const { auth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { validate } = require('../middleware/validate');
const { ROLES } = require('../config/constants');
const { idParam, paginationSchema } = require('../validators/common');
const { updateProfileSchema, listFreelancersQuery, avatarQuery } = require('../validators/users');
const { avatarBody } = require('../middleware/avatarBody');
const avatarsController = require('../controllers/avatars.controller');
const freelancersController = require('../controllers/freelancers.controller');
const reviewsController = require('../controllers/reviews.controller');

const router = Router();
const withId = validate(idParam, 'params');

router.get('/', validate(listFreelancersQuery, 'query'), freelancersController.list);
router.patch('/me', auth, requireRole(ROLES.FREELANCER), validate(updateProfileSchema), freelancersController.updateMe);
router.put('/me/avatar', auth, requireRole(ROLES.FREELANCER), ...avatarBody, avatarsController.save);
router.delete('/me/avatar', auth, requireRole(ROLES.FREELANCER), avatarsController.remove);
router.get('/:id/avatar', withId, validate(avatarQuery, 'query'), avatarsController.get);
router.get('/:id', withId, freelancersController.getById);
router.get('/:id/reviews', withId, validate(paginationSchema, 'query'), reviewsController.listByUser);

module.exports = router;

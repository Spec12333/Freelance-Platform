const { Router } = require('express');
const { auth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { validate } = require('../middleware/validate');
const { ROLES } = require('../config/constants');
const { idParam, paginationSchema } = require('../validators/common');
const { createOrderSchema, updateOrderSchema, listOrdersQuery, changeStatusSchema } = require('../validators/orders');
const { createProposalSchema } = require('../validators/proposals');
const { createMessageSchema } = require('../validators/messages');
const { createReviewSchema } = require('../validators/reviews');
const ordersController = require('../controllers/orders.controller');
const proposalsController = require('../controllers/proposals.controller');
const messagesController = require('../controllers/messages.controller');
const reviewsController = require('../controllers/reviews.controller');

// Everything that hangs off a single order lives under /orders/:id, so the URL
// alone says which order a proposal, message or review belongs to.
const router = Router();
const withId = validate(idParam, 'params');

// Orders
router.get('/', validate(listOrdersQuery, 'query'), ordersController.list);
router.post('/', auth, requireRole(ROLES.CLIENT), validate(createOrderSchema), ordersController.create);
router.get('/:id', withId, ordersController.getById);
router.patch('/:id', auth, requireRole(ROLES.CLIENT), withId, validate(updateOrderSchema), ordersController.update);
// No role check here: who may make a transition depends on the transition, so
// the service decides.
router.patch('/:id/status', auth, withId, validate(changeStatusSchema), ordersController.changeStatus);

// Proposals of an order
router.get('/:id/proposals', auth, requireRole(ROLES.CLIENT), withId, proposalsController.listByOrder);
router.post(
  '/:id/proposals',
  auth,
  requireRole(ROLES.FREELANCER),
  withId,
  validate(createProposalSchema),
  proposalsController.create,
);

// Chat of an order
router.get('/:id/messages', auth, withId, validate(paginationSchema, 'query'), messagesController.list);
router.post('/:id/messages', auth, withId, validate(createMessageSchema), messagesController.create);

// Reviews of an order
router.get('/:id/reviews', withId, reviewsController.listByOrder);
router.post('/:id/review', auth, withId, validate(createReviewSchema), reviewsController.create);

module.exports = router;

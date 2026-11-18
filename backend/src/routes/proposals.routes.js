const { Router } = require('express');
const { auth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { validate } = require('../middleware/validate');
const { ROLES } = require('../config/constants');
const { idParam } = require('../validators/common');
const { myProposalsQuery, updateProposalSchema } = require('../validators/proposals');
const proposalsController = require('../controllers/proposals.controller');

// Creating and listing proposals of an order is under /orders/:id/proposals.
// This router holds what is addressed by the proposal itself.
const router = Router();

// Declared before /:id/... so "my" is never read as an id.
router.get('/my', auth, requireRole(ROLES.FREELANCER), validate(myProposalsQuery, 'query'), proposalsController.listMine);
router.patch('/:id', auth, requireRole(ROLES.FREELANCER), validate(idParam, 'params'), validate(updateProposalSchema), proposalsController.update);
router.delete('/:id', auth, requireRole(ROLES.FREELANCER), validate(idParam, 'params'), proposalsController.remove);
router.post('/:id/accept', auth, requireRole(ROLES.CLIENT), validate(idParam, 'params'), proposalsController.accept);

module.exports = router;

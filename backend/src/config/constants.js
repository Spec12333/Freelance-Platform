// Enum values shared by models, validators and services. Keeping them here means
// a typo like 'COMPLETE' instead of 'COMPLETED' breaks on require, not at runtime.

const ROLES = {
  CLIENT: 'CLIENT',
  FREELANCER: 'FREELANCER',
  ADMIN: 'ADMIN',
};

const ORDER_STATUS = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  REVIEW: 'REVIEW',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

const PROPOSAL_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
};

module.exports = {
  ROLES,
  ORDER_STATUS,
  PROPOSAL_STATUS,
  ROLE_VALUES: Object.values(ROLES),
  ORDER_STATUS_VALUES: Object.values(ORDER_STATUS),
  PROPOSAL_STATUS_VALUES: Object.values(PROPOSAL_STATUS),
};

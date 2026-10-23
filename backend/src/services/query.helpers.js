// SQL fragments and attribute lists shared by several services.
//
// Ratings are not stored anywhere: a user's rating is AVG(rating) over the
// reviews where they are the target. Computing it as a correlated subquery
// keeps it always correct, costs one query instead of one per row, and lets the
// freelancer list sort by it in SQL.
//
// `alias` is the table alias Sequelize gives the user in the generated SQL: the
// model name at the top level ("User") or the `as` of an include ("client",
// "freelancer"). It always comes from code in this file's callers, never from
// a request, so interpolating it is safe.
const { literal } = require('sequelize');

const ratingAttribute = (alias) => [
  literal(
    `(SELECT ROUND(AVG(r."rating"), 1)::float FROM "Reviews" AS r WHERE r."targetId" = "${alias}"."id")`,
  ),
  'rating',
];

const reviewsCountAttribute = (alias) => [
  literal(`(SELECT COUNT(*)::int FROM "Reviews" AS r WHERE r."targetId" = "${alias}"."id")`),
  'reviewsCount',
];

// The shapes a user takes when nested in another object, as listed in
// docs/API.md. Each one selects only what its screen needs - in particular a
// nested user never carries an email.

// order.client, order.freelancer
const userSummaryAttributes = (alias) => ['id', 'name', ratingAttribute(alias)];

// proposal.freelancer
const userBadgeAttributes = (alias) => [...userSummaryAttributes(alias), reviewsCountAttribute(alias)];

// message.sender, review.author
const USER_REF_ATTRIBUTES = ['id', 'name', 'avatarUrl'];

// A full profile as seen by others: everything except the hash and the email.
const publicUserAttributes = (alias = 'User') => ({
  exclude: ['passwordHash', 'email'],
  include: [ratingAttribute(alias), reviewsCountAttribute(alias)],
});

// A profile as seen by its owner (and by the admin): the email is included.
const privateUserAttributes = (alias = 'User') => ({
  exclude: ['passwordHash'],
  include: [ratingAttribute(alias), reviewsCountAttribute(alias)],
});

module.exports = {
  ratingAttribute,
  reviewsCountAttribute,
  userSummaryAttributes,
  userBadgeAttributes,
  USER_REF_ATTRIBUTES,
  publicUserAttributes,
  privateUserAttributes,
};

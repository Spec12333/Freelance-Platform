// One pagination shape for every list endpoint. Agreed up front because
// changing the response envelope once the frontend reads it is painful.
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

// Turns validated query values into what Sequelize needs.
const getPagination = ({ page = 1, limit = DEFAULT_LIMIT } = {}) => ({
  page,
  limit,
  offset: (page - 1) * limit,
});

// Turns the result of findAndCountAll into the response envelope.
// "pages" is at least 1 so an empty list still reads as "page 1 of 1".
const buildPage = ({ rows, count }, { page, limit }) => ({
  items: rows,
  total: count,
  page,
  pages: Math.max(1, Math.ceil(count / limit)),
});

module.exports = { DEFAULT_LIMIT, MAX_LIMIT, getPagination, buildPage };

const { asyncHandler } = require('../utils/asyncHandler');
const categoriesService = require('../services/categories.service');

const list = asyncHandler(async (req, res) => {
  // Returned as a plain array, not paginated: it feeds a filter dropdown and
  // there will never be hundreds of categories.
  res.json(await categoriesService.list());
});

module.exports = { list };

const { asyncHandler } = require('../utils/asyncHandler');
const adminService = require('../services/admin.service');

const listUsers = asyncHandler(async (req, res) => {
  res.json(await adminService.listUsers(req.valid.query));
});

const setBlocked = asyncHandler(async (req, res) => {
  res.json(await adminService.setBlocked(req.user, req.valid.params.id, req.valid.body.isBlocked));
});

const listCategories = asyncHandler(async (req, res) => {
  res.json(await adminService.listCategories(req.valid.query));
});

const createCategory = asyncHandler(async (req, res) => {
  res.status(201).json(await adminService.createCategory(req.valid.body));
});

const renameCategory = asyncHandler(async (req, res) => {
  res.json(await adminService.renameCategory(req.valid.params.id, req.valid.body));
});

const deleteCategory = asyncHandler(async (req, res) => {
  await adminService.deleteCategory(req.valid.params.id);
  res.status(204).end();
});

module.exports = {
  listUsers,
  setBlocked,
  listCategories,
  createCategory,
  renameCategory,
  deleteCategory,
};

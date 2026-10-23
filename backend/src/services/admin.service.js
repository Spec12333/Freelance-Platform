const { Op, literal, UniqueConstraintError } = require('sequelize');
const { User, Category, Order } = require('../models');
const { ApiError } = require('../utils/ApiError');
const { getPagination, buildPage } = require('../utils/pagination');
const { slugify } = require('../utils/slugify');
const { privateUserAttributes } = require('./query.helpers');
const usersService = require('./users.service');

// --- Users -----------------------------------------------------------------

const listUsers = async (query) => {
  const { role, search, isBlocked } = query;
  const pagination = getPagination(query);

  const where = {};
  if (role) where.role = role;
  if (isBlocked !== undefined) where.isBlocked = isBlocked;
  if (search) {
    where[Op.or] = [{ name: { [Op.iLike]: `%${search}%` } }, { email: { [Op.iLike]: `%${search}%` } }];
  }

  // The admin sees emails, so this uses the private shape.
  const result = await User.findAndCountAll({
    where,
    attributes: privateUserAttributes(),
    order: [['id', 'ASC']],
    limit: pagination.limit,
    offset: pagination.offset,
  });
  return buildPage(result, pagination);
};

// Takes effect on the user's very next request: the auth middleware checks
// isBlocked every time, so an already issued token stops working immediately.
const setBlocked = async (admin, userId, isBlocked) => {
  if (admin.id === userId) throw ApiError.conflict('You cannot block your own account');

  const user = await User.findByPk(userId);
  if (!user) throw ApiError.notFound('User not found');

  await user.update({ isBlocked });
  return usersService.getCurrentUser(user.id);
};

// --- Categories ------------------------------------------------------------

const categoryAttributes = [
  'id',
  'name',
  'slug',
  [literal('(SELECT COUNT(*)::int FROM "Orders" AS o WHERE o."categoryId" = "Category"."id")'), 'ordersCount'],
];

const listCategories = async (query) => {
  const pagination = getPagination(query);
  const result = await Category.findAndCountAll({
    attributes: categoryAttributes,
    order: [['name', 'ASC']],
    limit: pagination.limit,
    offset: pagination.offset,
  });
  return buildPage(result, pagination);
};

const getCategory = async (id) => {
  const category = await Category.findByPk(id, { attributes: categoryAttributes });
  if (!category) throw ApiError.notFound('Category not found');
  return category;
};

// Both name and slug are unique. "Web Dev" and "web-dev" are different names
// but the same slug, so the database is left to decide and its error reworded.
const saveCategory = async (save) => {
  try {
    return await save();
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw ApiError.conflict('A category with this name already exists');
    }
    throw error;
  }
};

// The slug only keeps Latin letters and digits, so a name like "!!" or a
// Cyrillic-only name would produce an empty one.
const slugFor = (name) => {
  const slug = slugify(name);
  if (!slug) throw ApiError.badRequest('Category name must contain Latin letters or digits');
  return slug;
};

const createCategory = async ({ name }) => {
  const category = await saveCategory(() => Category.create({ name, slug: slugFor(name) }));
  return getCategory(category.id);
};

const renameCategory = async (id, { name }) => {
  const category = await Category.findByPk(id);
  if (!category) throw ApiError.notFound('Category not found');
  await saveCategory(() => category.update({ name, slug: slugFor(name) }));
  return getCategory(id);
};

const deleteCategory = async (id) => {
  const category = await Category.findByPk(id);
  if (!category) throw ApiError.notFound('Category not found');

  // Deleting it would orphan orders (categoryId is NOT NULL), so it is refused
  // while any order still points at it.
  const ordersCount = await Order.count({ where: { categoryId: id } });
  if (ordersCount > 0) {
    throw ApiError.conflict(`Category is used by ${ordersCount} order(s) and cannot be deleted`);
  }
  await category.destroy();
};

module.exports = {
  listUsers,
  setBlocked,
  listCategories,
  createCategory,
  renameCategory,
  deleteCategory,
};

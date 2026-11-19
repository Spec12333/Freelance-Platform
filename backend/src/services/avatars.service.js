const sharp = require('sharp');
const { createHash } = require('node:crypto');
const { Avatar, User, sequelize } = require('../models');
const usersService = require('./users.service');
const { ApiError } = require('../utils/ApiError');

const MIME_FORMATS = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_BYTES = 5 * 1024 * 1024;

// Some PNG decoders expose only the first APNG frame in their metadata.
const hasPngAnimation = (file) => {
  let offset = 8;
  while (offset + 12 <= file.length) {
    const length = file.readUInt32BE(offset);
    if (file.toString('ascii', offset + 4, offset + 8) === 'acTL') return true;
    offset += length + 12;
  }
  return false;
};

const save = async (user, file, contentType) => {
  if (!Buffer.isBuffer(file) || file.length === 0) throw ApiError.badRequest('Choose a non-empty image file');
  if (file.length > MAX_BYTES) throw new ApiError(413, 'Avatar must be no larger than 5 MB');
  let data;
  try {
    // Decode actual image bytes, reject animations, strip metadata and re-encode.
    const image = sharp(file, { limitInputPixels: 16_000_000, failOn: 'warning' });
    const metadata = await image.metadata();
    if (!MIME_FORMATS[contentType] || metadata.format !== MIME_FORMATS[contentType]
      || (metadata.pages ?? 1) > 1 || (metadata.format === 'png' && hasPngAnimation(file))) {
      throw Error('Unsupported image');
    }
    const edge = Math.min(512, metadata.width, metadata.height);
    data = await image.rotate().resize(edge, edge, { fit: 'cover' }).webp({ quality: 80 }).toBuffer();
  } catch {
    throw ApiError.badRequest('Use a valid, non-animated JPEG, PNG or WebP image up to 16 megapixels');
  }
  const version = createHash('sha256').update(data).digest('hex');
  await sequelize.transaction(async (transaction) => {
    // Serialize replacements and removals for this account in one transaction.
    const owner = await User.findByPk(user.id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!owner) throw ApiError.notFound('User not found');
    await Avatar.upsert({ userId: user.id, data, version }, { transaction });
    await owner.update({ avatarUrl: `/api/freelancers/${user.id}/avatar?v=${version}` }, { transaction });
  });
  return usersService.getCurrentUser(user.id);
};

const remove = async (user) => {
  await sequelize.transaction(async (transaction) => {
    const owner = await User.findByPk(user.id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!owner) throw ApiError.notFound('User not found');
    await owner.update({ avatarUrl: null }, { transaction });
    await Avatar.destroy({ where: { userId: user.id }, transaction });
  });
  return usersService.getCurrentUser(user.id);
};

const get = async (userId) => {
  const avatar = await Avatar.findByPk(userId);
  if (!avatar) throw ApiError.notFound('Avatar not found');
  return avatar;
};

module.exports = { save, remove, get };

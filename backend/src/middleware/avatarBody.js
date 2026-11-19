const { raw } = require('express');
const { ApiError } = require('../utils/ApiError');

// Run after auth; the endpoint accepts image bytes rather than multipart/JSON.
const requireImageType = (req, res, next) => {
  const type = (req.get('Content-Type') ?? '').split(';')[0].trim().toLowerCase();
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) {
    return next(new ApiError(415, 'Use a JPEG, PNG or WebP image'));
  }
  next();
};

const avatarBody = [requireImageType, raw({ type: () => true, limit: '5mb', inflate: false })];

module.exports = { avatarBody };

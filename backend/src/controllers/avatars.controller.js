const avatarsService = require('../services/avatars.service');
const { asyncHandler } = require('../utils/asyncHandler');

const save = asyncHandler(async (req, res) => {
  res.json(await avatarsService.save(req.user, req.body, req.get('Content-Type').split(';')[0].trim().toLowerCase()));
});

const remove = asyncHandler(async (req, res) => {
  res.json(await avatarsService.remove(req.user));
});

const get = asyncHandler(async (req, res) => {
  const avatar = await avatarsService.get(req.valid.params.id);
  res.set({
    'Content-Type': 'image/webp',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'public, max-age=0, must-revalidate',
    ETag: `"${avatar.version}"`,
  });
  res.send(avatar.data);
});

module.exports = { save, remove, get };

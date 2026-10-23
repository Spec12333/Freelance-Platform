// "UI/UX Design" -> "ui-ux-design". Shared by the seed and the admin category
// endpoints so both produce the same slug for the same name.
const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

module.exports = { slugify };

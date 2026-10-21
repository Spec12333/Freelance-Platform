// Fills the database with data every screen can be built against: categories,
// one user per role, two freelancers and orders in different statuses.
//
//   npm run seed            - idempotent, safe to run repeatedly
//   npm run seed -- --fresh - drops every table first (development only)
const bcrypt = require('bcrypt');
const { env } = require('./config/env');
const { sequelize, User, Category, Order } = require('./models');
const { ROLES, ORDER_STATUS } = require('./config/constants');

const fresh = process.argv.includes('--fresh');

const CATEGORY_NAMES = [
  'Web Development',
  'Mobile Development',
  'UI/UX Design',
  'Graphic Design',
  'Copywriting',
  'Translation',
  'SEO & Marketing',
  'Video & Animation',
];

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// Plain passwords are fine here: this data exists to be logged into, and the
// same table is documented in docs/API.md.
const USERS = [
  {
    email: 'admin@freelancehub.dev',
    password: 'admin123',
    name: 'Site Admin',
    role: ROLES.ADMIN,
  },
  {
    email: 'client@freelancehub.dev',
    password: 'client123',
    name: 'Karen Petrosyan',
    role: ROLES.CLIENT,
    bio: 'Runs a small online store and outsources design and development.',
  },
  {
    email: 'anna@freelancehub.dev',
    password: 'anna123',
    name: 'Anna Hakobyan',
    role: ROLES.FREELANCER,
    bio: 'Frontend developer, 3 years with React and TypeScript.',
    skills: ['react', 'typescript', 'css'],
    hourlyRate: 20,
    portfolioUrl: 'https://example.com/anna',
  },
  {
    email: 'davit@freelancehub.dev',
    password: 'davit123',
    name: 'Davit Grigoryan',
    role: ROLES.FREELANCER,
    bio: 'Node.js backend developer. APIs, PostgreSQL, deployment.',
    skills: ['node', 'express', 'postgresql'],
    hourlyRate: 25,
    portfolioUrl: 'https://example.com/davit',
  },
];

const seed = async () => {
  if (fresh && env.isProduction) {
    // The one guard that matters: --fresh drops every table.
    console.error('Refusing to run --fresh with NODE_ENV=production.');
    process.exit(1);
  }

  await sequelize.authenticate();
  await sequelize.sync(fresh ? { force: true } : { alter: true });
  if (fresh) console.log('Dropped and recreated all tables.');

  // findOrCreate keyed on the unique column makes re-running the seed a no-op
  // instead of a duplicate-key crash.
  const categories = [];
  for (const name of CATEGORY_NAMES) {
    const [category] = await Category.findOrCreate({
      where: { name },
      defaults: { name, slug: slugify(name) },
    });
    categories.push(category);
  }

  const users = {};
  for (const userData of USERS) {
    const { email, password, ...rest } = userData;
    const [user] = await User.findOrCreate({
      where: { email },
      defaults: { email, passwordHash: await bcrypt.hash(password, 10), ...rest },
    });
    users[email] = user;
  }

  const client = users['client@freelancehub.dev'];
  const anna = users['anna@freelancehub.dev'];
  const webDev = categories.find((category) => category.slug === 'web-development');
  const design = categories.find((category) => category.slug === 'ui-ux-design');

  // Orders are only created on an empty table: they have no unique column to
  // key on, so re-running would otherwise pile up copies.
  const orderCount = await Order.count();
  if (orderCount === 0) {
    await Order.bulkCreate([
      {
        title: 'Landing page for an online store',
        description:
          'A one-page site with a product block, a contact form and mobile layout.',
        budget: 300,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: ORDER_STATUS.OPEN,
        clientId: client.id,
        categoryId: webDev.id,
      },
      {
        title: 'Redesign of a mobile app profile screen',
        description: 'Three screens in Figma, light and dark theme.',
        budget: 450,
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        status: ORDER_STATUS.IN_PROGRESS,
        clientId: client.id,
        freelancerId: anna.id,
        categoryId: design.id,
      },
      {
        title: 'Fix layout bugs in an admin panel',
        description: 'Table breaks below 1200px, modal scrolls the page behind it.',
        budget: 120,
        status: ORDER_STATUS.COMPLETED,
        clientId: client.id,
        freelancerId: anna.id,
        categoryId: webDev.id,
      },
    ]);
  }

  console.log(
    `Seed finished: ${await Category.count()} categories, ${await User.count()} users, ${await Order.count()} orders.`,
  );
  await sequelize.close();
};

seed().catch(async (error) => {
  console.error('Seed failed:', error);
  await sequelize.close();
  process.exit(1);
});

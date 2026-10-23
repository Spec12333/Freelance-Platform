// Fills the database with data every screen can be built against: categories,
// demo users for every role and a marketplace in every state - open orders with
// unseen proposals, work in progress with a chat, completed orders with reviews,
// a cancelled order and a blocked account.
//
//   npm run seed            - idempotent, safe to run repeatedly
//   npm run seed -- --fresh - drops every table first (development only)
const bcrypt = require('bcrypt');
const { env } = require('./config/env');
const { sequelize, User, Category, Order, Proposal, Message, Review } = require('./models');
const { ROLES, ORDER_STATUS, PROPOSAL_STATUS } = require('./config/constants');
const { slugify } = require('./utils/slugify');

const fresh = process.argv.includes('--fresh');

const { OPEN, IN_PROGRESS, REVIEW, COMPLETED, CANCELLED } = ORDER_STATUS;
const { PENDING, ACCEPTED, REJECTED } = PROPOSAL_STATUS;

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const ago = (ms) => new Date(Date.now() - ms);
const fromNow = (ms) => new Date(Date.now() + ms);

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

// Plain passwords are fine here: this data exists to be logged into, and the
// same table is documented in docs/API.md. The key is how orders below refer
// to each user.
const USERS = {
  admin: {
    email: 'admin@freelancehub.dev',
    password: 'admin123',
    name: 'Site Admin',
    role: ROLES.ADMIN,
  },
  karen: {
    email: 'client@freelancehub.dev',
    password: 'client123',
    name: 'Karen Petrosyan',
    role: ROLES.CLIENT,
    bio: 'Runs a small online store and outsources design and development.',
  },
  lilit: {
    email: 'lilit@freelancehub.dev',
    password: 'lilit123',
    name: 'Lilit Sargsyan',
    role: ROLES.CLIENT,
    bio: 'Owner of a family café and a bakery in Yerevan.',
  },
  anna: {
    email: 'anna@freelancehub.dev',
    password: 'anna123',
    name: 'Anna Hakobyan',
    role: ROLES.FREELANCER,
    bio: 'Frontend developer, 3 years with React and TypeScript.',
    skills: ['react', 'typescript', 'css'],
    hourlyRate: 20,
    portfolioUrl: 'https://example.com/anna',
  },
  davit: {
    email: 'davit@freelancehub.dev',
    password: 'davit123',
    name: 'Davit Grigoryan',
    role: ROLES.FREELANCER,
    bio: 'Node.js backend developer. APIs, PostgreSQL, deployment.',
    skills: ['node', 'express', 'postgresql'],
    hourlyRate: 25,
    portfolioUrl: 'https://example.com/davit',
  },
  mariam: {
    email: 'mariam@freelancehub.dev',
    password: 'mariam123',
    name: 'Mariam Avetisyan',
    role: ROLES.FREELANCER,
    bio: 'Product designer: mobile interfaces, branding, illustrations.',
    skills: ['figma', 'ui-design', 'branding'],
    hourlyRate: 18,
    portfolioUrl: 'https://example.com/mariam',
  },
  // Exists to show the admin's block list and the "account blocked" error.
  blocked: {
    email: 'blocked@freelancehub.dev',
    password: 'blocked123',
    name: 'Blocked Account',
    role: ROLES.FREELANCER,
    bio: 'Sent the same copy-pasted proposal to every order.',
    skills: ['spam'],
    hourlyRate: 5,
    isBlocked: true,
  },
};

// Orders with everything attached to them. `from: 'client' | 'freelancer'` in
// messages and reviews means that side of this particular order.
const ORDERS = [
  // --- Karen -------------------------------------------------------------
  {
    client: 'karen',
    category: 'web-development',
    title: 'Landing page for an online store',
    description:
      'A one-page site with a product block, a contact form and a mobile layout. Design is ready in Figma.',
    budget: 300,
    deadline: fromNow(14 * DAY),
    status: OPEN,
    createdAt: ago(2 * DAY),
    proposals: [
      {
        freelancer: 'mariam',
        price: 320,
        coverLetter: 'I can polish the Figma layout first and then hand it over to a developer.',
        status: PENDING,
        viewedByClient: true,
      },
      {
        freelancer: 'anna',
        price: 280,
        coverLetter: 'I build landing pages in React with a fully responsive layout. Ready in 5 days.',
        status: PENDING,
      },
      {
        freelancer: 'davit',
        price: 300,
        coverLetter: 'I can do the page and also wire the contact form to email on the backend.',
        status: PENDING,
      },
    ],
  },
  {
    client: 'karen',
    category: 'web-development',
    title: 'REST API for a delivery app',
    description:
      'Endpoints for orders, couriers and delivery tracking. PostgreSQL, JWT authentication, Swagger docs.',
    budget: 800,
    deadline: fromNow(30 * DAY),
    status: OPEN,
    createdAt: ago(1 * DAY),
    proposals: [
      {
        freelancer: 'davit',
        price: 750,
        coverLetter: 'This is exactly my stack. I can share a similar project I delivered last month.',
        status: PENDING,
      },
    ],
  },
  {
    client: 'karen',
    category: 'copywriting',
    title: 'Product descriptions for 40 items',
    description: 'Short, friendly descriptions for kitchenware, 60-80 words each, in English.',
    budget: 150,
    deadline: fromNow(10 * DAY),
    status: OPEN,
    createdAt: ago(5 * HOUR),
  },
  {
    client: 'karen',
    category: 'ui-ux-design',
    title: 'Redesign of a mobile app profile screen',
    description: 'Three screens in Figma: profile, settings and order history, light and dark theme.',
    budget: 450,
    deadline: fromNow(21 * DAY),
    status: IN_PROGRESS,
    freelancer: 'mariam',
    createdAt: ago(9 * DAY),
    proposals: [
      {
        freelancer: 'mariam',
        price: 450,
        coverLetter: 'Mobile design is my main focus. Portfolio has three similar profile screens.',
        status: ACCEPTED,
        viewedByClient: true,
      },
      {
        freelancer: 'anna',
        price: 400,
        coverLetter: 'I can design and later implement these screens in React Native.',
        status: REJECTED,
        viewedByClient: true,
      },
    ],
    messages: [
      { from: 'client', body: 'Hi Mariam! The brand colors are in the shared folder.' },
      { from: 'freelancer', body: 'Got them, thanks. Should the dark theme use the same accent?' },
      { from: 'client', body: 'Yes, same accent, just a darker background.' },
      { from: 'freelancer', body: 'Great. First draft of the profile screen will be ready tomorrow.' },
    ],
  },
  {
    client: 'karen',
    category: 'web-development',
    title: 'Filters for the admin panel orders table',
    description: 'Add filtering by date, status and amount to an existing React table, keep state in the URL.',
    budget: 250,
    deadline: fromNow(3 * DAY),
    status: REVIEW,
    freelancer: 'anna',
    createdAt: ago(12 * DAY),
    proposals: [
      {
        freelancer: 'anna',
        price: 250,
        coverLetter: 'I did URL-driven filters on my last two projects, happy to do it here as well.',
        status: ACCEPTED,
        viewedByClient: true,
      },
    ],
    messages: [
      { from: 'freelancer', body: 'Filters are done and pushed to the branch, sending for review.' },
      { from: 'client', body: 'Thanks! I will check everything this evening.' },
    ],
  },
  {
    client: 'karen',
    category: 'web-development',
    title: 'Fix layout bugs in an admin panel',
    description: 'The table breaks below 1200px and the modal scrolls the page behind it.',
    budget: 120,
    status: COMPLETED,
    freelancer: 'anna',
    createdAt: ago(30 * DAY),
    proposals: [
      {
        freelancer: 'anna',
        price: 120,
        coverLetter: 'Both are classic CSS issues, I can fix them within a day.',
        status: ACCEPTED,
        viewedByClient: true,
      },
    ],
    messages: [
      { from: 'freelancer', body: 'Both bugs are fixed, the modal now locks the page scroll.' },
      { from: 'client', body: 'Works perfectly, thank you!' },
    ],
    reviews: [
      { from: 'client', rating: 5, comment: 'Fast and precise. Fixed more than I asked for.' },
      { from: 'freelancer', rating: 5, comment: 'Clear task, quick feedback. Pleasure to work with.' },
    ],
  },
  {
    client: 'karen',
    category: 'graphic-design',
    title: 'Logo for a pet shop',
    description: 'A simple logo for a small pet shop, two or three concepts to choose from.',
    budget: 100,
    status: CANCELLED,
    createdAt: ago(20 * DAY),
    proposals: [
      {
        freelancer: 'mariam',
        price: 120,
        coverLetter: 'I would start with a quick moodboard and then three logo concepts.',
        status: REJECTED,
        viewedByClient: true,
      },
    ],
  },

  // --- Lilit -------------------------------------------------------------
  {
    client: 'lilit',
    category: 'graphic-design',
    title: 'Menu design for a café',
    description: 'A two-page printed menu in the style of the café: warm colors, hand-drawn icons.',
    budget: 200,
    deadline: fromNow(12 * DAY),
    status: OPEN,
    createdAt: ago(1 * DAY),
    proposals: [
      {
        freelancer: 'mariam',
        price: 190,
        coverLetter: 'I designed your bakery identity, so the menu would match it naturally.',
        status: PENDING,
      },
    ],
  },
  {
    client: 'lilit',
    category: 'seo-marketing',
    title: 'Instagram promotion for a café',
    description: 'A one-month content plan and targeted ads for a café that opened two months ago.',
    budget: 350,
    deadline: fromNow(20 * DAY),
    status: OPEN,
    createdAt: ago(3 * HOUR),
  },
  {
    client: 'lilit',
    category: 'web-development',
    title: 'Online table booking form',
    description: 'A booking form for the café website with date, time and party size, sent to email.',
    budget: 280,
    deadline: fromNow(7 * DAY),
    status: IN_PROGRESS,
    freelancer: 'anna',
    createdAt: ago(6 * DAY),
    proposals: [
      {
        freelancer: 'anna',
        price: 260,
        coverLetter: 'I can build the form with validation and a clear confirmation screen.',
        status: ACCEPTED,
        viewedByClient: true,
      },
      {
        freelancer: 'davit',
        price: 300,
        coverLetter: 'I would add a small backend so bookings are stored, not only emailed.',
        status: REJECTED,
        viewedByClient: true,
      },
    ],
    messages: [
      { from: 'client', body: 'We are open from 9 to 22, bookings only up to 21:00 please.' },
      { from: 'freelancer', body: 'Noted. Should Sunday have the same hours?' },
      { from: 'client', body: 'Sunday closes at 20:00.' },
    ],
  },
  {
    client: 'lilit',
    category: 'web-development',
    title: 'Website for a café',
    description: 'A five-page website: home, menu, gallery, contacts and an about page.',
    budget: 600,
    status: COMPLETED,
    freelancer: 'davit',
    createdAt: ago(60 * DAY),
    proposals: [
      {
        freelancer: 'davit',
        price: 600,
        coverLetter: 'I can deliver the site with a simple admin page to update the menu.',
        status: ACCEPTED,
        viewedByClient: true,
      },
    ],
    reviews: [
      { from: 'client', rating: 4, comment: 'Good work, a few days late but the result is great.' },
      { from: 'freelancer', rating: 5, comment: 'Very friendly client with a clear vision.' },
    ],
  },
  {
    client: 'lilit',
    category: 'translation',
    title: 'Translate the café menu into English',
    description: 'About 60 menu items with short descriptions, from Armenian into English.',
    budget: 80,
    status: COMPLETED,
    freelancer: 'anna',
    createdAt: ago(40 * DAY),
    proposals: [
      {
        freelancer: 'anna',
        price: 80,
        coverLetter: 'Native-level English, I have translated two restaurant menus before.',
        status: ACCEPTED,
        viewedByClient: true,
      },
    ],
    reviews: [{ from: 'client', rating: 4, comment: 'Accurate translation, delivered on time.' }],
  },
  {
    client: 'lilit',
    category: 'graphic-design',
    title: 'Brand identity for a bakery',
    description: 'Logo, color palette, packaging stickers and a one-page brand guide.',
    budget: 500,
    status: COMPLETED,
    freelancer: 'mariam',
    createdAt: ago(50 * DAY),
    proposals: [
      {
        freelancer: 'mariam',
        price: 500,
        coverLetter: 'Branding for food businesses is my favorite kind of project.',
        status: ACCEPTED,
        viewedByClient: true,
      },
    ],
    // Only the client has reviewed so far: Mariam can still leave hers, which
    // is the case the review form needs for a demo.
    reviews: [{ from: 'client', rating: 5, comment: 'Beautiful identity, customers love the stickers.' }],
  },
];

const seedMarketplace = async (users, categoriesBySlug) => {
  for (const data of ORDERS) {
    const clientId = users[data.client].id;
    const freelancerId = data.freelancer ? users[data.freelancer].id : null;

    const order = await Order.create({
      title: data.title,
      description: data.description,
      budget: data.budget,
      deadline: data.deadline || null,
      status: data.status,
      clientId,
      freelancerId,
      categoryId: categoriesBySlug[data.category].id,
      createdAt: data.createdAt,
      updatedAt: data.createdAt,
    });

    // Proposals arrive an hour apart after the order was posted.
    for (const [index, proposal] of (data.proposals || []).entries()) {
      const createdAt = new Date(data.createdAt.getTime() + (index + 1) * HOUR);
      await Proposal.create({
        orderId: order.id,
        freelancerId: users[proposal.freelancer].id,
        price: proposal.price,
        coverLetter: proposal.coverLetter,
        status: proposal.status,
        viewedByClient: proposal.viewedByClient || false,
        createdAt,
        updatedAt: createdAt,
      });
    }

    const sideId = (from) => (from === 'client' ? clientId : freelancerId);

    // Chat messages a few hours apart, ending shortly before now.
    const messages = data.messages || [];
    for (const [index, message] of messages.entries()) {
      const createdAt = ago((messages.length - index) * 3 * HOUR);
      await Message.create({
        orderId: order.id,
        senderId: sideId(message.from),
        body: message.body,
        createdAt,
        updatedAt: createdAt,
      });
    }

    for (const review of data.reviews || []) {
      const authorId = sideId(review.from);
      await Review.create({
        orderId: order.id,
        authorId,
        targetId: authorId === clientId ? freelancerId : clientId,
        rating: review.rating,
        comment: review.comment,
      });
    }
  }
};

const seed = async () => {
  if (fresh && env.isProduction) {
    // The one guard that matters: --fresh drops every table.
    console.error('Refusing to run --fresh with NODE_ENV=production.');
    process.exit(1);
  }

  await sequelize.authenticate();
  // Same policy as server.js: never alter existing tables in production.
  await sequelize.sync(fresh ? { force: true } : { alter: !env.isProduction });
  if (fresh) console.log('Dropped and recreated all tables.');

  // findOrCreate keyed on the unique column makes re-running the seed a no-op
  // instead of a duplicate-key crash.
  const categoriesBySlug = {};
  for (const name of CATEGORY_NAMES) {
    const [category] = await Category.findOrCreate({
      where: { name },
      defaults: { name, slug: slugify(name) },
    });
    categoriesBySlug[category.slug] = category;
  }

  const users = {};
  for (const [key, userData] of Object.entries(USERS)) {
    const { email, password, ...rest } = userData;
    const [user] = await User.findOrCreate({
      where: { email },
      defaults: { email, passwordHash: await bcrypt.hash(password, 10), ...rest },
    });
    users[key] = user;
  }

  // Orders have no unique column to key on, so the marketplace is only created
  // on an empty table - re-running would otherwise pile up copies.
  if ((await Order.count()) === 0) {
    await seedMarketplace(users, categoriesBySlug);
  } else {
    console.log('Orders already exist, skipping orders, proposals, messages and reviews.');
  }

  const counts = await Promise.all([Category, User, Order, Proposal, Message, Review].map((Model) => Model.count()));
  console.log(
    `Seed finished: ${counts[0]} categories, ${counts[1]} users, ${counts[2]} orders, ` +
      `${counts[3]} proposals, ${counts[4]} messages, ${counts[5]} reviews.`,
  );
  await sequelize.close();
};

seed().catch(async (error) => {
  console.error('Seed failed:', error);
  await sequelize.close();
  process.exit(1);
});

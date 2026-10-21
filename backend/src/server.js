const { app } = require('./app');
const { env } = require('./config/env');
const { sequelize } = require('./models');

const start = async () => {
  try {
    // Fails loudly if the database is unreachable or the credentials are wrong,
    // instead of letting the first request discover it.
    await sequelize.authenticate();

    // alter: true keeps local tables in step with the models while they change
    // daily. On production it is a plain sync(): alter rewrites tables and can
    // lose data. Real migrations are listed as future work in the README.
    await sequelize.sync({ alter: !env.isProduction });

    app.listen(env.port, () => {
      console.log(`API ready on http://localhost:${env.port}/api  (${env.nodeEnv})`);
    });
  } catch (error) {
    console.error('Failed to start the server:', error);
    process.exit(1);
  }
};

start();

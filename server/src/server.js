'use strict';

const app = require('./app');
const env = require('./config/env');

app.listen(env.PORT, () => {
  console.log(`Server listening on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
});

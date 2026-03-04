import app from './src/index';

console.log(`Server is running at http://localhost:3000`);

export default {
  port: 3000,
  fetch: app.fetch,
};

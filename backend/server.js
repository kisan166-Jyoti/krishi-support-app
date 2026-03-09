const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Krishi Support API running at http://localhost:${PORT}`);
});

import express from 'express';

// Serve every prototype: http://localhost:3000/semantic-search/ etc.
const app = express();
app.use(express.static(import.meta.dirname));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Prototypes running: http://localhost:${PORT}/semantic-search/`);
});

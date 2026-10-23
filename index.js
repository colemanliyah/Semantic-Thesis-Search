import express from 'express';

const app = express();
app.use(express.static('public/semantic-search'));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}/`);
});

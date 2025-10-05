import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import chromaRoutes from './routes/chromaRoutes.js';

console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY);

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', routes);
app.use('/', chromaRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
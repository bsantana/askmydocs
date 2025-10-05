import express from 'express';
import { listIndexedDocuments, deleteAllFromChroma } from '../utils/chromaClient.js';

const router = express.Router();

// Rota para deletar todos os documentos do ChromaDB
router.delete('/chroma/delete-all', async (req, res) => {
  try {
    await deleteAllFromChroma();
    res.json({ message: 'Todos os documentos foram removidos do ChromaDB.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar todos os documentos', details: err.message });
  }
});

router.get('/chroma/list', async (req, res) => {
  try {
    const results = await listIndexedDocuments();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar documentos', details: err.message });
  }
});

export default router;

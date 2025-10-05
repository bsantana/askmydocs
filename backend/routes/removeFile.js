import express from 'express';
import { removeFileFromChroma } from '../utils/chromaClient.js';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = dirname(fileURLToPath(import.meta.url));

router.post('/remove-file', async (req, res) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ error: 'Nome do arquivo não informado.' });

  try {
    await removeFileFromChroma(filename);
    // Remove do disco
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const filePath = path.join(uploadsDir, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ message: 'Arquivo e dados removidos com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover arquivo.', details: err.message });
  }
});

export default router;

import express from 'express';
import { removeFileFromChroma } from '../utils/chromaClient.js';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = dirname(fileURLToPath(import.meta.url));

router.post('/remove-file', async (req, res) => {
  const { originalname } = req.body;
  if (!originalname) return res.status(400).json({ error: 'Nome original do arquivo não informado.' });

  try {
    // Busca o metadado correspondente ao nome original
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const files = fs.readdirSync(uploadsDir);
    const metaFile = files.find(f => f.endsWith('.json') && (() => {
      try {
        const meta = JSON.parse(fs.readFileSync(path.join(uploadsDir, f)));
        return meta.originalname === originalname;
      } catch {
        return false;
      }
    })());
    if (!metaFile) return res.status(404).json({ error: 'Arquivo não encontrado.' });
    const meta = JSON.parse(fs.readFileSync(path.join(uploadsDir, metaFile)));
    const filename = meta.filename;

    await removeFileFromChroma(filename);
    // Remove do disco
    const filePath = path.join(uploadsDir, filename);
    const metaPath = path.join(uploadsDir, filename + '.json');
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
    res.json({ message: 'Arquivo e metadados removidos com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover arquivo.', details: err.message });
  }
});

export default router;

import fs from 'fs';
import path from 'path';

const docsController = (req, res) => {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao listar arquivos' });
    }
    // Filtra arquivos .json (metadados)
    const metaFiles = files.filter(f => f.endsWith('.json'));
    const documents = metaFiles.map(f => {
      try {
        const meta = JSON.parse(fs.readFileSync(path.join(uploadsDir, f)));
        return meta;
      } catch {
        return null;
      }
    }).filter(Boolean);
    res.json({ documents });
  });
};

export default docsController;

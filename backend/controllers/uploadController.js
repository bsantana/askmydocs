import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { queryChroma, indexDocument } from '../utils/chromaClient.js';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
import mammoth from 'mammoth';

const uploadController = async (req, res) => {
	if (!req.file) {
		return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
	}

	const filePath = path.join(__dirname, '..', req.file.path);
	let extractedText = '';

	try {
		if (req.file.mimetype === 'application/pdf') {
			const pdfParse = require('pdf-parse');
			const dataBuffer = fs.readFileSync(filePath);
			const data = await pdfParse(dataBuffer);

			// Divide o texto por página usando '\f' (form feed) ou '\n\n' como fallback
			let pages = [];
			if (data.text.includes('\f')) {
				pages = data.text.split('\f').filter(Boolean);
			} else {
				pages = data.text.split('\n\n').filter(Boolean);
			}

			for (let i = 0; i < pages.length; i++) {
				await indexDocument({
					id: `${req.file.filename}-page-${i + 1}`,
					text: pages[i],
					metadata: {
						originalname: req.file.originalname,
						mimetype: req.file.mimetype,
						size: req.file.size,
						page: i + 1
					}
				});
			}
			extractedText = pages.join('\n---\n');
		} else if (
			req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
			req.file.mimetype === 'application/msword'
		) {
			const dataBuffer = fs.readFileSync(filePath);
			const result = await mammoth.extractRawText({ buffer: dataBuffer });
			await indexDocument({
				id: req.file.filename,
				text: result.value,
				metadata: {
					originalname: req.file.originalname,
					mimetype: req.file.mimetype,
					size: req.file.size
				}
			});
			extractedText = result.value;
		} else {
			return res.status(400).json({ error: 'Tipo de arquivo não suportado.' });
		}

		res.json({ message: 'Arquivo enviado, texto extraído e indexado com sucesso!', text: extractedText });
	} catch (err) {
		res.status(500).json({ error: 'Erro ao processar arquivo.', details: err.message });
	}
};

export default uploadController;

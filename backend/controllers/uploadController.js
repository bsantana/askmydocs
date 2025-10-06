import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { queryChroma, indexDocument } from '../utils/chromaClient.js';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
import mammoth from 'mammoth';

const uploadController = async (req, res) => {
		console.log('Recebendo upload...');
		if (!req.file) {
			console.log('Nenhum arquivo enviado.');
			return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
		}

		console.log('Arquivo recebido:', req.file);
		const filePath = path.join(__dirname, '..', req.file.path);
		let extractedText = '';

	try {
				// Salva metadados do arquivo
				const meta = {
					originalname: req.file.originalname,
					filename: req.file.filename,
					mimetype: req.file.mimetype,
					size: req.file.size,
					uploadDate: new Date().toISOString()
				};
				const metaPath = path.join(path.dirname(filePath), req.file.filename + '.json');
				console.log('Salvando metadados em:', metaPath);
				fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

				if (req.file.mimetype === 'application/pdf') {
					console.log('Processando PDF:', filePath);
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
					console.log('Total de páginas extraídas:', pages.length);
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
					console.log('Processando DOC/DOCX:', filePath);
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
					console.log('Tipo de arquivo não suportado:', req.file.mimetype);
					return res.status(400).json({ error: 'Tipo de arquivo não suportado.' });
				}

				console.log('Upload finalizado com sucesso!');
				res.json({ message: 'Arquivo enviado, texto extraído e indexado com sucesso!', text: extractedText });
	} catch (err) {
	console.error('Erro no uploadController:', err);
	res.status(500).json({ error: 'Erro ao processar arquivo.', details: err.message });
	}
};

export default uploadController;

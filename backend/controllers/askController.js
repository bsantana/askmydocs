import { askGemini } from '../utils/geminiClient.js';
import { queryChroma } from '../utils/chromaClient.js';

const askController = async (req, res) => {
	try {
		const { question } = req.body;
		if (!question) {
			return res.status(400).json({ error: 'Pergunta não enviada.' });
		}
				// Busca contexto relevante no ChromaDB
				const contextDocs = await queryChroma(question, 3);
				// Monta contexto detalhado para a IA
				const context = contextDocs.map(doc =>
					`Arquivo: ${doc.originalname} | Página: ${doc.page}\n${doc.text}`
				).join('\n---\n');
			// Prompt para a IA seguir os critérios de resposta
			const prompt = `
        Você é um assistente que responde perguntas com base em trechos de arquivos PDF previamente carregados.\n\n
        Critérios obrigatórios:\n
        1. Retorne um trecho literal encontrado nos arquivos.\n
        2. Dê uma explicação simplificada desse trecho em linguagem clara.\n
        3. Informe a referência de onde a resposta foi encontrada (nome do arquivo e página).\n\n
        Pergunta: ${question}\n\n
        Contexto:\n${context}
      `;
			// Envia prompt para Gemini
			const answer = await askGemini(prompt);
			res.json({ message: answer, context: contextDocs });
	} catch (err) {
		res.status(500).json({ error: 'Erro ao consultar Gemini', details: err.message });
	}
};

export default askController;

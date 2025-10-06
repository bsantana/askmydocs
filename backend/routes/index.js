import express from 'express';
import multer from 'multer';
import docsController from '../controllers/docsController.js';
import uploadController from '../controllers/uploadController.js';
import askController from '../controllers/askController.js';
import removeFileRouter from './removeFile.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Rota para buscar documentos enviados
router.get('/docs', docsController);

router.post('/upload', upload.single('file'), uploadController);
router.post('/ask', askController);
router.use(removeFileRouter);

export default router;
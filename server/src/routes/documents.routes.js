const express = require('express');
const multer = require('multer');
const path = require('path');
const documentsController = require('../controllers/documents.controller');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Multer config for local storage (swap to R2 when configured)
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, TXT, and CSV files are allowed'));
    }
  },
});

router.use(authMiddleware);

router.post('/upload', upload.single('file'), documentsController.uploadDocument);
router.get('/', documentsController.getDocuments);
router.post('/:id/ask', documentsController.askDocument);
router.get('/:id/summary', documentsController.getDocumentSummary);

module.exports = router;

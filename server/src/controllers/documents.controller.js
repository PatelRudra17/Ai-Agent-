const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const { summarize, askAboutDocument } = require('../services/gemini.service');

// For now, store files locally (swap to Cloudflare R2 when configured)
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// POST /api/documents/upload
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const { originalname, filename, mimetype, size } = req.file;

    // Extract text from PDF
    let extractedText = '';
    if (mimetype === 'application/pdf') {
      try {
        const pdfParse = require('pdf-parse');
        const buffer = fs.readFileSync(req.file.path);
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text;
      } catch (err) {
        console.error('PDF parse failed:', err.message);
      }
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ path: req.file.path });
        extractedText = result.value;
      } catch (err) {
        console.error('DOCX parse failed:', err.message);
      }
    } else if (mimetype?.startsWith('text/')) {
      extractedText = fs.readFileSync(req.file.path, 'utf-8');
    }

    // File URL (local for now, R2 when configured)
    const url = `/uploads/${filename}`;

    const doc = await Document.create({
      userId: req.user.userId,
      filename,
      originalName: originalname,
      mimeType: mimetype,
      size,
      url,
      extractedText: extractedText.substring(0, 100000), // limit stored text
    });

    res.status(201).json({ message: 'Document uploaded', document: doc });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/documents
exports.getDocuments = async (req, res) => {
  try {
    const docs = await Document.find({ userId: req.user.userId })
      .select('originalName mimeType size url createdAt aiSummary')
      .sort({ createdAt: -1 });
    res.json({ documents: docs });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/documents/:id/ask — Ask AI about document
exports.askDocument = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ message: 'Question required' });

    const doc = await Document.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    if (!doc.extractedText) return res.status(400).json({ message: 'No text extracted from this document' });

    // Limit text sent to Gemini to avoid token limits
    const textForAI = doc.extractedText.substring(0, 30000);
    const answer = await askAboutDocument(textForAI, question);

    res.json({ answer });
  } catch (error) {
    res.status(500).json({ message: 'AI service error', error: error.message });
  }
};

// GET /api/documents/:id/summary — Get AI summary
exports.getDocumentSummary = async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    if (doc.aiSummary) return res.json({ summary: doc.aiSummary });

    if (!doc.extractedText) return res.status(400).json({ message: 'No text extracted from this document' });

    const textForAI = doc.extractedText.substring(0, 30000);
    const summary = await summarize(textForAI, 'document');

    doc.aiSummary = summary;
    await doc.save();

    res.json({ summary });
  } catch (error) {
    res.status(500).json({ message: 'AI service error', error: error.message });
  }
};

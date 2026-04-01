const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');

/**
 * Generate CSV from data
 * @param {Array} data - Array of objects
 * @param {Array} columns - Column definitions [{label, value}]
 * @returns {string} CSV string
 */
exports.exportCSV = (data, columns) => {
  const fields = columns.map((c) => ({ label: c.label, value: c.value }));
  const parser = new Parser({ fields });
  return parser.parse(data);
};

/**
 * Generate PDF table from data
 * @param {string} title - Document title
 * @param {Array} data - Array of objects
 * @param {Array} columns - Column definitions [{label, value, width}]
 * @returns {PDFDocument} PDF stream
 */
exports.exportPDF = (title, data, columns) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

  // Title
  doc.fontSize(18).fillColor('#333').text(title, { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#888').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
  doc.moveDown(1);

  // Table header
  const startX = 40;
  let y = doc.y;
  const rowHeight = 25;
  const colWidths = columns.map((c) => c.width || Math.floor(720 / columns.length));

  doc.fillColor('#6366f1');
  let x = startX;
  columns.forEach((col, i) => {
    doc.fontSize(9).font('Helvetica-Bold').text(col.label, x + 4, y + 6, { width: colWidths[i] - 8 });
    x += colWidths[i];
  });

  y += rowHeight;
  doc.moveTo(startX, y).lineTo(startX + colWidths.reduce((s, w) => s + w, 0), y).stroke('#ddd');

  // Table rows
  doc.fillColor('#333').font('Helvetica');
  data.forEach((row) => {
    if (y > 520) {
      doc.addPage();
      y = 40;
    }

    x = startX;
    columns.forEach((col, i) => {
      const val = typeof col.value === 'function' ? col.value(row) : (row[col.value] ?? '');
      doc.fontSize(8).text(String(val).slice(0, 50), x + 4, y + 6, { width: colWidths[i] - 8 });
      x += colWidths[i];
    });

    y += rowHeight;
    doc.moveTo(startX, y).lineTo(startX + colWidths.reduce((s, w) => s + w, 0), y).stroke('#eee');
  });

  return doc;
};

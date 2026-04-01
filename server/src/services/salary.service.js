const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '../../uploads/salary-slips');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const generateSalarySlip = async ({ employee, month, year, salary }) => {
  return new Promise((resolve, reject) => {
    const filename = `salary-${employee.name.replace(/\s+/g, '-')}-${year}-${String(month).padStart(2, '0')}.pdf`;
    const filepath = path.join(UPLOAD_DIR, filename);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Company header
    doc.fontSize(20).font('Helvetica-Bold').text('Corporate AI Agent', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Salary Slip', { align: 'center' });
    doc.moveDown(0.5);

    // Month/Year
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    doc.fontSize(12).font('Helvetica-Bold').text(`${monthNames[month - 1]} ${year}`, { align: 'center' });
    doc.moveDown(1);

    // Separator
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e5e7eb');
    doc.moveDown(1);

    // Employee details
    const basicPay = salary.basic || 0;
    const hra = salary.hra || Math.round(basicPay * 0.4);
    const da = salary.da || Math.round(basicPay * 0.1);
    const special = salary.special || Math.round(basicPay * 0.2);
    const gross = basicPay + hra + da + special;
    const pf = salary.pf || Math.round(basicPay * 0.12);
    const tax = salary.tax || Math.round(gross * 0.1);
    const deductions = pf + tax;
    const netPay = gross - deductions;

    // Employee info section
    doc.fontSize(11).font('Helvetica-Bold').text('Employee Details');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');
    infoRow(doc, 'Name', employee.name);
    infoRow(doc, 'Email', employee.email);
    infoRow(doc, 'Department', employee.department || 'N/A');
    infoRow(doc, 'Employee ID', employee._id?.toString().slice(-8).toUpperCase());
    doc.moveDown(1);

    // Earnings
    doc.fontSize(11).font('Helvetica-Bold').text('Earnings');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');
    infoRow(doc, 'Basic Pay', formatCurrency(basicPay));
    infoRow(doc, 'HRA', formatCurrency(hra));
    infoRow(doc, 'Dearness Allowance', formatCurrency(da));
    infoRow(doc, 'Special Allowance', formatCurrency(special));
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold');
    infoRow(doc, 'Gross Salary', formatCurrency(gross));
    doc.moveDown(1);

    // Deductions
    doc.fontSize(11).font('Helvetica-Bold').text('Deductions');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');
    infoRow(doc, 'Provident Fund (12%)', formatCurrency(pf));
    infoRow(doc, 'Income Tax (10%)', formatCurrency(tax));
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold');
    infoRow(doc, 'Total Deductions', formatCurrency(deductions));
    doc.moveDown(1);

    // Net Pay
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#2563eb');
    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#2563eb').text(`Net Pay: ${formatCurrency(netPay)}`, { align: 'center' });
    doc.fillColor('#000');
    doc.moveDown(2);

    // Footer
    doc.fontSize(8).font('Helvetica').fillColor('#9ca3af');
    doc.text('This is a computer-generated salary slip. No signature required.', { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });

    doc.end();

    stream.on('finish', () => {
      resolve({
        filename,
        filepath,
        url: `/uploads/salary-slips/${filename}`,
        netPay,
        gross,
        deductions,
      });
    });

    stream.on('error', reject);
  });
};

function infoRow(doc, label, value) {
  const y = doc.y;
  doc.text(label, 60, y, { width: 250 });
  doc.text(value, 350, y, { width: 180, align: 'right' });
  doc.moveDown(0.4);
}

function formatCurrency(amount) {
  return `Rs. ${amount.toLocaleString('en-IN')}`;
}

module.exports = { generateSalarySlip };

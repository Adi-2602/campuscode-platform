const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * Generate PDF report
 */
const generatePDF = (data, callback) => {
  const doc = new PDFDocument({ margin: 50 });

  // Pipe to callback
  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  doc.on("end", () => callback(Buffer.concat(chunks)));

  // Add content
  addHeader(doc, data.title, data.subtitle);
  addMetadata(doc, data.metadata);

  if (data.summary) {
    addSummarySection(doc, data.summary);
  }

  if (data.tables) {
    data.tables.forEach((table) => {
      addTable(doc, table.title, table.headers, table.rows);
    });
  }

  if (data.sections) {
    data.sections.forEach((section) => {
      addSection(doc, section.title, section.content);
    });
  }

  addFooter(doc);

  doc.end();
};

/**
 * Add header to PDF
 */
const addHeader = (doc, title, subtitle) => {
  doc
    .fontSize(24)
    .font("Helvetica-Bold")
    .text(title, { align: "center" })
    .moveDown(0.5);

  if (subtitle) {
    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor("#666666")
      .text(subtitle, { align: "center" })
      .moveDown(1);
  }

  doc.strokeColor("#000000").lineWidth(2).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(1);
  doc.fillColor("#000000");
};

/**
 * Add metadata section
 */
const addMetadata = (doc, metadata) => {
  if (!metadata) return;

  doc.fontSize(10).font("Helvetica");

  Object.keys(metadata).forEach((key) => {
    doc
      .font("Helvetica-Bold")
      .text(`${key}: `, { continued: true })
      .font("Helvetica")
      .text(metadata[key]);
  });

  doc.moveDown(1);
};

/**
 * Add summary section with key metrics
 */
const addSummarySection = (doc, summary) => {
  doc.fontSize(16).font("Helvetica-Bold").text("Summary", { underline: true }).moveDown(0.5);

  doc.fontSize(10).font("Helvetica");

  // Create a grid of summary items
  const items = Object.keys(summary);
  const itemsPerRow = 3;
  const boxWidth = 150;
  const boxHeight = 60;
  const startX = 50;
  let currentX = startX;
  let currentY = doc.y;

  items.forEach((key, index) => {
    if (index > 0 && index % itemsPerRow === 0) {
      currentX = startX;
      currentY += boxHeight + 10;
    }

    // Draw box
    doc
      .rect(currentX, currentY, boxWidth, boxHeight)
      .strokeColor("#cccccc")
      .stroke();

    // Add label
    doc
      .fontSize(8)
      .fillColor("#666666")
      .text(key, currentX + 10, currentY + 10, {
        width: boxWidth - 20,
        align: "left"
      });

    // Add value
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .fillColor("#000000")
      .text(String(summary[key]), currentX + 10, currentY + 30, {
        width: boxWidth - 20,
        align: "left"
      });

    currentX += boxWidth + 10;
  });

  doc.y = currentY + boxHeight + 20;
  doc.fillColor("#000000");
  doc.moveDown(1);
};

/**
 * Add table to PDF
 */
const addTable = (doc, title, headers, rows) => {
  doc.addPage();

  doc.fontSize(16).font("Helvetica-Bold").text(title, { underline: true }).moveDown(0.5);

  const tableTop = doc.y;
  const columnWidth = (500 - 50) / headers.length;
  const rowHeight = 25;

  // Draw headers
  doc.fontSize(10).font("Helvetica-Bold").fillColor("#000000");

  headers.forEach((header, i) => {
    doc.text(header, 50 + i * columnWidth, tableTop, {
      width: columnWidth,
      align: "left"
    });
  });

  // Draw header line
  doc
    .strokeColor("#000000")
    .lineWidth(1)
    .moveTo(50, tableTop + 15)
    .lineTo(550, tableTop + 15)
    .stroke();

  // Draw rows
  doc.fontSize(9).font("Helvetica");

  let currentY = tableTop + 20;

  rows.forEach((row, rowIndex) => {
    // Check if we need a new page
    if (currentY > 700) {
      doc.addPage();
      currentY = 50;

      // Redraw headers on new page
      doc.fontSize(10).font("Helvetica-Bold");
      headers.forEach((header, i) => {
        doc.text(header, 50 + i * columnWidth, currentY, {
          width: columnWidth,
          align: "left"
        });
      });
      doc
        .strokeColor("#000000")
        .lineWidth(1)
        .moveTo(50, currentY + 15)
        .lineTo(550, currentY + 15)
        .stroke();
      currentY += 20;
      doc.fontSize(9).font("Helvetica");
    }

    // Alternate row colors
    if (rowIndex % 2 === 0) {
      doc
        .rect(50, currentY, 500, rowHeight)
        .fillColor("#f5f5f5")
        .fill();
      doc.fillColor("#000000");
    }

    // Draw row data
    Object.values(row).forEach((cell, i) => {
      doc.text(String(cell), 55 + i * columnWidth, currentY + 5, {
        width: columnWidth - 10,
        align: "left"
      });
    });

    currentY += rowHeight;
  });

  doc.y = currentY + 20;
};

/**
 * Add section with content
 */
const addSection = (doc, title, content) => {
  doc.fontSize(14).font("Helvetica-Bold").text(title, { underline: true }).moveDown(0.5);

  doc.fontSize(10).font("Helvetica");

  if (typeof content === "string") {
    doc.text(content, { align: "left" });
  } else if (Array.isArray(content)) {
    content.forEach((item) => {
      doc.text(`• ${item}`, { indent: 20 });
    });
  }

  doc.moveDown(1);
};

/**
 * Add footer to PDF
 */
const addFooter = (doc) => {
  const pages = doc.bufferedPageRange();

  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);

    // Draw footer line
    doc
      .strokeColor("#cccccc")
      .lineWidth(1)
      .moveTo(50, 770)
      .lineTo(550, 770)
      .stroke();

    // Add footer text
    doc
      .fontSize(8)
      .fillColor("#666666")
      .text(
        `Generated on ${new Date().toLocaleDateString()} | CampusCode Admin System`,
        50,
        780,
        { align: "left" }
      );

    doc.text(`Page ${i + 1} of ${pages.count}`, 50, 780, { align: "right" });
  }
};

/**
 * Save PDF to file
 */
const savePDFToFile = (data, filename) => {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(process.cwd(), "temp", filename);

    // Ensure temp directory exists
    const tempDir = path.join(process.cwd(), "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(outputPath);

    doc.pipe(stream);

    // Add content
    addHeader(doc, data.title, data.subtitle);
    addMetadata(doc, data.metadata);

    if (data.summary) {
      addSummarySection(doc, data.summary);
    }

    if (data.tables) {
      data.tables.forEach((table) => {
        addTable(doc, table.title, table.headers, table.rows);
      });
    }

    if (data.sections) {
      data.sections.forEach((section) => {
        addSection(doc, section.title, section.content);
      });
    }

    addFooter(doc);

    doc.end();

    stream.on("finish", () => resolve(outputPath));
    stream.on("error", reject);
  });
};

/**
 * Generate student performance report
 */
const generateStudentReport = (studentData) => {
  return {
    title: "Student Performance Report",
    subtitle: studentData.studentName,
    metadata: {
      "Student ID": studentData.studentId,
      "Email": studentData.studentEmail,
      "Roll No": studentData.studentRollNo || "N/A",
      "Report Date": new Date().toLocaleDateString()
    },
    summary: {
      "Total Exams": studentData.totalExams || 0,
      "Average Score": `${(studentData.averageScore || 0).toFixed(2)}%`,
      "Pass Rate": `${(studentData.passRate || 0).toFixed(2)}%`,
      "Highest Score": studentData.highestScore || 0,
      "Lowest Score": studentData.lowestScore || 0,
      "Rank": studentData.rank || "N/A"
    },
    tables: studentData.examResults ? [
      {
        title: "Exam Results",
        headers: ["Exam", "Date", "Score", "Total", "Percentage", "Status"],
        rows: studentData.examResults
      }
    ] : [],
    sections: [
      {
        title: "Performance Analysis",
        content: studentData.analysis || "No analysis available"
      }
    ]
  };
};

/**
 * Generate exam analysis report
 */
const generateExamReport = (examData) => {
  return {
    title: "Exam Analysis Report",
    subtitle: examData.examTitle,
    metadata: {
      "Exam ID": examData.examId,
      "Date": examData.examDate,
      "Total Students": examData.totalStudents || 0,
      "Report Date": new Date().toLocaleDateString()
    },
    summary: {
      "Total Students": examData.totalStudents || 0,
      "Submitted": examData.submittedStudents || 0,
      "Completion Rate": `${(examData.completionRate || 0).toFixed(2)}%`,
      "Average Score": `${(examData.averageScore || 0).toFixed(2)}%`,
      "Pass Rate": `${(examData.passRate || 0).toFixed(2)}%`,
      "Highest Score": examData.highestScore || 0
    },
    tables: examData.studentResults ? [
      {
        title: "Student Results",
        headers: ["Student", "Roll No", "Score", "Percentage", "Status"],
        rows: examData.studentResults
      }
    ] : []
  };
};

module.exports = {
  generatePDF,
  savePDFToFile,
  generateStudentReport,
  generateExamReport,
  addHeader,
  addMetadata,
  addSummarySection,
  addTable,
  addSection,
  addFooter
};
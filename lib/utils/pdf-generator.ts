import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

// Helper function to ensure font files are accessible
function ensureFontFiles() {
  try {
    // Try to find the font files in node_modules
    const pdfkitPath = require.resolve("pdfkit");
    const pdfkitDir = path.dirname(pdfkitPath);
    const fontDir = path.join(pdfkitDir, "js", "data");

    // Check if fonts directory exists
    if (fs.existsSync(fontDir)) {
      return fontDir;
    }

    // Alternative path
    const altFontDir = path.join(
      process.cwd(),
      "node_modules",
      "pdfkit",
      "js",
      "data"
    );
    if (fs.existsSync(altFontDir)) {
      return altFontDir;
    }
  } catch (error) {
    // Font files not found, will use default fonts
    console.warn("PDFKit font files not found, using default fonts:", error);
  }
  return null;
}

export interface ROPDFData {
  dealer: {
    name: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    phone?: string;
  };
  customer: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  vehicle: {
    year?: string;
    make?: string;
    model?: string;
    trim?: string;
    vin?: string;
    color?: string;
    stockNumber?: string;
    mileageIn?: number;
    mileageOut?: number;
  };
  serviceRecord: {
    roNumber: string;
    openDate?: string;
    closeDate?: string;
    deliveredDate?: string;
    serviceAdvisorName?: string;
    invoiceNumber?: string;
    typeOfSale?: string;
  };
  operations: Array<{
    operationCode: string;
    operationDescription: string;
    payType: string;
    laborComplaint?: string;
    laborCause?: string;
    laborCorrection?: string;
    laborComments?: string;
    laborLines: Array<{
      techNumber?: string;
      techName?: string;
      laborBillHours?: number;
      laborSale?: number;
      laborCost?: number;
      repairIn?: string;
      repairOut?: string;
    }>;
    partsLines: Array<{
      partNumber?: string;
      partDescription?: string;
      quantity?: number;
      unitCost?: number;
      unitSale?: number;
      totalCost?: number;
      totalSale?: number;
    }>;
    totalLaborHours?: number;
    totalLaborSale?: number;
    totalLaborCost?: number;
    totalPartsSale?: number;
    totalPartsCost?: number;
  }>;
  totals: {
    customerLaborCost?: number;
    customerLaborSale?: number;
    customerPartsCost?: number;
    customerPartsSale?: number;
    warrantyLaborCost?: number;
    warrantyLaborSale?: number;
    warrantyPartsCost?: number;
    warrantyPartsSale?: number;
    internalLaborCost?: number;
    internalLaborSale?: number;
    internalPartsCost?: number;
    internalPartsSale?: number;
    grandTotal?: number;
  };
}

export function generateROPDF(data: ROPDFData): PDFKit.PDFDocument {
  // Create PDF with default fonts (no external font files needed)
  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
  });

  // Using Courier font which is a standard PDF font that doesn't require external files
  // Courier is more reliably available in Next.js/Docker environments

  const pageWidth = 612; // Letter size width in points
  const pageHeight = 792; // Letter size height in points
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;

  let yPosition = margin;
  const lineHeight = 14;
  const sectionSpacing = 10;

  // Helper function to add text with word wrapping
  const addText = (
    text: string,
    x: number,
    y: number,
    options: {
      width?: number;
      fontSize?: number;
      align?: "left" | "center" | "right";
      bold?: boolean;
    } = {}
  ) => {
    const {
      width = contentWidth,
      fontSize = 10,
      align = "left",
      bold = false,
    } = options;

    // Use Courier font which is a standard PDF font that doesn't require external files
    // Courier is more reliably available than Helvetica in Next.js environments
    doc.font(bold ? "Courier-Bold" : "Courier").fontSize(fontSize);
    doc.text(text, x, y, { width, align });
  };

  // Helper to check if we need a new page
  const checkNewPage = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Header - Dealer Information
  addText(data.dealer.name || "", margin, yPosition, {
    fontSize: 14,
    bold: true,
  });
  yPosition += lineHeight + 2;

  const dealerAddress = [
    data.dealer.address,
    data.dealer.city,
    data.dealer.state,
    data.dealer.zip,
  ]
    .filter(Boolean)
    .join(" ");

  if (dealerAddress) {
    addText(dealerAddress, margin, yPosition, { fontSize: 10 });
    yPosition += lineHeight;
  }

  if (data.dealer.phone) {
    addText(data.dealer.phone, margin, yPosition, { fontSize: 10 });
    yPosition += lineHeight;
  }

  yPosition += sectionSpacing;

  // Customer Information (Left side)
  const customerInfoY = yPosition;
  addText(data.customer.name || "", margin, customerInfoY, {
    fontSize: 10,
    bold: true,
  });
  let customerY = customerInfoY + lineHeight;

  if (data.customer.address) {
    addText(data.customer.address, margin, customerY, { fontSize: 9 });
    customerY += lineHeight;
  }

  if (data.customer.phone) {
    addText(`Phone: ${data.customer.phone}`, margin, customerY, {
      fontSize: 9,
    });
    customerY += lineHeight;
  }

  if (data.customer.email) {
    addText(`Email: ${data.customer.email}`, margin, customerY, {
      fontSize: 9,
    });
    customerY += lineHeight;
  }

  // Vehicle Information (Right side)
  const vehicleInfoX = pageWidth / 2;
  const vehicleInfo = [
    data.vehicle.year,
    data.vehicle.make,
    data.vehicle.model,
    data.vehicle.trim,
  ]
    .filter(Boolean)
    .join(" ");

  addText(vehicleInfo || "", vehicleInfoX, customerInfoY, {
    fontSize: 10,
    bold: true,
    width: contentWidth / 2,
  });
  let vehicleY = customerInfoY + lineHeight;

  if (data.vehicle.vin) {
    addText(`VIN: ${data.vehicle.vin}`, vehicleInfoX, vehicleY, {
      fontSize: 9,
      width: contentWidth / 2,
    });
    vehicleY += lineHeight;
  }

  if (data.vehicle.color) {
    addText(`Color: ${data.vehicle.color}`, vehicleInfoX, vehicleY, {
      fontSize: 9,
      width: contentWidth / 2,
    });
    vehicleY += lineHeight;
  }

  if (data.vehicle.stockNumber) {
    addText(`Stock #: ${data.vehicle.stockNumber}`, vehicleInfoX, vehicleY, {
      fontSize: 9,
      width: contentWidth / 2,
    });
    vehicleY += lineHeight;
  }

  if (data.vehicle.mileageIn !== undefined) {
    addText(
      `Mileage In: ${data.vehicle.mileageIn.toLocaleString()}`,
      vehicleInfoX,
      vehicleY,
      { fontSize: 9, width: contentWidth / 2 }
    );
    vehicleY += lineHeight;
  }

  if (data.vehicle.mileageOut !== undefined) {
    addText(
      `Mileage Out: ${data.vehicle.mileageOut.toLocaleString()}`,
      vehicleInfoX,
      vehicleY,
      { fontSize: 9, width: contentWidth / 2 }
    );
    vehicleY += lineHeight;
  }

  yPosition = Math.max(customerY, vehicleY) + sectionSpacing;

  // RO Header Information
  const roHeaderY = yPosition;
  addText("DESCRIPTION", margin, roHeaderY, { fontSize: 10, bold: true });
  addText("Accounting Invoice", pageWidth - margin - 150, roHeaderY, {
    fontSize: 10,
    bold: true,
    width: 150,
    align: "right",
  });
  yPosition += lineHeight + 2;

  // RO Number and Dates
  addText(`RO Number: ${data.serviceRecord.roNumber}`, margin, yPosition, {
    fontSize: 10,
    bold: true,
  });

  if (data.serviceRecord.invoiceNumber) {
    addText(
      `Invoice Number: ${data.serviceRecord.invoiceNumber}`,
      pageWidth - margin - 150,
      yPosition,
      { fontSize: 10, width: 150, align: "right" }
    );
  }
  yPosition += lineHeight;

  if (data.serviceRecord.openDate) {
    const openDate = new Date(data.serviceRecord.openDate).toLocaleDateString(
      "en-US",
      { month: "short", day: "numeric", year: "numeric" }
    );
    addText(`Date Opened: ${openDate}`, margin, yPosition, { fontSize: 9 });
  }

  if (data.serviceRecord.closeDate) {
    const closeDate = new Date(data.serviceRecord.closeDate).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
    addText(`Date Closed: ${closeDate}`, margin + 150, yPosition, {
      fontSize: 9,
    });
  }

  if (data.serviceRecord.deliveredDate) {
    const deliveredDate = new Date(
      data.serviceRecord.deliveredDate
    ).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    addText(`Date Delivered: ${deliveredDate}`, margin + 300, yPosition, {
      fontSize: 9,
    });
  }

  if (data.serviceRecord.serviceAdvisorName) {
    addText(
      `Service Writer: ${data.serviceRecord.serviceAdvisorName}`,
      pageWidth - margin - 150,
      yPosition,
      { fontSize: 9, width: 150, align: "right" }
    );
  }
  yPosition += lineHeight + sectionSpacing;

  // Operations
  data.operations.forEach((operation, index) => {
    checkNewPage(100);

    const operationNumber = index + 1;
    addText(
      `${operationNumber}. Customer statement of problem`,
      margin,
      yPosition,
      { fontSize: 10, bold: true }
    );
    yPosition += lineHeight;

    // Operation description
    if (operation.operationDescription) {
      addText(operation.operationDescription, margin + 20, yPosition, {
        fontSize: 9,
        width: contentWidth - 20,
      });
      yPosition += lineHeight;
    }

    // Labor complaint
    if (operation.laborComplaint) {
      addText(`I/ ${operation.laborComplaint}`, margin + 20, yPosition, {
        fontSize: 9,
        width: contentWidth - 20,
      });
      yPosition += lineHeight;
    }

    yPosition += 4;

    // Cause/Action to Take
    if (operation.laborCause) {
      addText("1 -- Cause/Action to Take", margin + 20, yPosition, {
        fontSize: 9,
        bold: true,
      });
      yPosition += lineHeight;
      addText(operation.laborCause, margin + 40, yPosition, {
        fontSize: 9,
        width: contentWidth - 40,
      });
      yPosition += lineHeight;
    }

    // Correction/Action Taken
    if (operation.laborCorrection) {
      addText("1-- Correction/Action Taken", margin + 20, yPosition, {
        fontSize: 9,
        bold: true,
      });
      yPosition += lineHeight;
      addText(operation.laborCorrection, margin + 40, yPosition, {
        fontSize: 9,
        width: contentWidth - 40,
      });
      yPosition += lineHeight;
    }

    yPosition += 4;

    // Labor and Parts Table Header
    checkNewPage(200);

    // Table headers
    doc.font("Courier-Bold").fontSize(8);
    doc.text("Warranty ID", margin, yPosition, { width: 80 });
    doc.text("Tech", margin + 80, yPosition, { width: 100 });
    doc.text("lop Act Hr", margin + 180, yPosition, { width: 60 });
    doc.text("Repair In", margin + 240, yPosition, { width: 80 });
    doc.text("Repair Out", margin + 320, yPosition, { width: 80 });
    doc.text("QTY", margin + 400, yPosition, { width: 40 });
    doc.text("COST", margin + 440, yPosition, { width: 60 });
    doc.text("LIST or LABOR TOTAL", margin + 500, yPosition, { width: 62 });

    yPosition += lineHeight;

    // Draw line under header
    doc
      .moveTo(margin, yPosition)
      .lineTo(pageWidth - margin, yPosition)
      .stroke();

    yPosition += 4;

    // Labor Lines
    if (operation.laborLines && operation.laborLines.length > 0) {
      operation.laborLines.forEach((labor) => {
        checkNewPage(30);

        const techInfo = labor.techName
          ? `${labor.techNumber || ""} ${labor.techName}`.trim()
          : labor.techNumber || "";

        doc.font("Courier").fontSize(8);
        doc.text("", margin, yPosition, { width: 80 });
        doc.text(techInfo, margin + 80, yPosition, { width: 100 });
        doc.text(
          (labor.laborBillHours || 0).toFixed(2),
          margin + 180,
          yPosition,
          { width: 60 }
        );
        doc.text(labor.repairIn || "", margin + 240, yPosition, { width: 80 });
        doc.text(labor.repairOut || "", margin + 320, yPosition, {
          width: 80,
        });
        doc.text("1", margin + 400, yPosition, { width: 40 });
        doc.text(
          `$${(labor.laborCost || 0).toFixed(2)}`,
          margin + 440,
          yPosition,
          { width: 60 }
        );
        doc.text(
          `$${(labor.laborSale || 0).toFixed(2)}`,
          margin + 500,
          yPosition,
          { width: 62 }
        );

        yPosition += lineHeight;
      });
    }

    // Parts Lines
    if (operation.partsLines && operation.partsLines.length > 0) {
      operation.partsLines.forEach((part) => {
        checkNewPage(30);

        doc.font("Courier").fontSize(8);
        doc.text("", margin, yPosition, { width: 80 });
        doc.text("", margin + 80, yPosition, { width: 100 });
        doc.text("", margin + 180, yPosition, { width: 60 });
        doc.text("", margin + 240, yPosition, { width: 80 });
        doc.text("", margin + 320, yPosition, { width: 80 });
        doc.text((part.quantity || 0).toString(), margin + 400, yPosition, {
          width: 40,
        });
        doc.text(
          `$${(part.unitCost || 0).toFixed(2)}`,
          margin + 440,
          yPosition,
          { width: 60 }
        );
        doc.text(
          `$${(part.unitSale || 0).toFixed(2)}`,
          margin + 500,
          yPosition,
          { width: 62 }
        );

        yPosition += lineHeight;

        // Part number and description on next line
        checkNewPage(20);
        const partInfo = `${part.partNumber || ""} ${
          part.partDescription || ""
        }`.trim();
        doc.font("Courier").fontSize(8);
        doc.text(partInfo, margin + 20, yPosition, {
          width: contentWidth - 20,
        });
        yPosition += lineHeight;
      });
    }

    // Operation Totals
    yPosition += 4;
    checkNewPage(20);

    const operationTotal =
      (operation.totalLaborSale || 0) + (operation.totalPartsSale || 0);

    doc.font("Courier-Bold").fontSize(9);
    doc.text("Sub Total Parts", margin + 300, yPosition, { width: 100 });
    doc.text(
      `$${(operation.totalPartsCost || 0).toFixed(2)}`,
      margin + 400,
      yPosition,
      { width: 60 }
    );
    doc.text(
      `$${(operation.totalPartsSale || 0).toFixed(2)}`,
      margin + 500,
      yPosition,
      { width: 62 }
    );

    yPosition += lineHeight;

    doc.text("SubTotal Job #" + operationNumber, margin + 300, yPosition, {
      width: 100,
    });
    doc.text(
      `$${(
        (operation.totalLaborCost || 0) + (operation.totalPartsCost || 0)
      ).toFixed(2)}`,
      margin + 400,
      yPosition,
      { width: 60 }
    );
    doc.text(`$${operationTotal.toFixed(2)}`, margin + 500, yPosition, {
      width: 62,
    });

    yPosition += lineHeight + sectionSpacing;
  });

  // Grand Totals Section
  checkNewPage(100);
  yPosition += sectionSpacing;

  addText("Miscellaneous Charges and Deductions", margin, yPosition, {
    fontSize: 10,
    bold: true,
  });
  yPosition += lineHeight + sectionSpacing;

  // Summary by Pay Type
  const summaryY = yPosition;
  addText("Internal", margin, summaryY, { fontSize: 9, bold: true });
  addText("Service Contract", margin + 100, summaryY, {
    fontSize: 9,
    bold: true,
  });
  addText("Warranty", margin + 220, summaryY, { fontSize: 9, bold: true });
  addText("Customer Pay", margin + 320, summaryY, {
    fontSize: 9,
    bold: true,
  });
  yPosition += lineHeight;

  // Labor totals
  addText("Labor", margin, yPosition, { fontSize: 9 });
  addText(
    `$${(data.totals.internalLaborCost || 0).toFixed(2)}`,
    margin + 100,
    yPosition,
    { fontSize: 9 }
  );
  addText(
    `$${(data.totals.warrantyLaborCost || 0).toFixed(2)}`,
    margin + 220,
    yPosition,
    { fontSize: 9 }
  );
  addText(
    `$${(data.totals.customerLaborCost || 0).toFixed(2)}`,
    margin + 320,
    yPosition,
    { fontSize: 9 }
  );
  yPosition += lineHeight;

  // Parts totals
  addText("Parts", margin, yPosition, { fontSize: 9 });
  addText(
    `$${(data.totals.internalPartsCost || 0).toFixed(2)}`,
    margin + 100,
    yPosition,
    { fontSize: 9 }
  );
  addText(
    `$${(data.totals.warrantyPartsCost || 0).toFixed(2)}`,
    margin + 220,
    yPosition,
    { fontSize: 9 }
  );
  addText(
    `$${(data.totals.customerPartsCost || 0).toFixed(2)}`,
    margin + 320,
    yPosition,
    { fontSize: 9 }
  );
  yPosition += lineHeight + 4;

  // Grand Total
  const grandTotal =
    (data.totals.customerLaborSale || 0) +
    (data.totals.customerPartsSale || 0) +
    (data.totals.warrantyLaborSale || 0) +
    (data.totals.warrantyPartsSale || 0) +
    (data.totals.internalLaborSale || 0) +
    (data.totals.internalPartsSale || 0);

  addText("GRAND TOTAL", margin + 400, yPosition, {
    fontSize: 12,
    bold: true,
  });
  addText(`$${grandTotal.toFixed(2)}`, margin + 500, yPosition, {
    fontSize: 12,
    bold: true,
    width: 62,
  });

  // Footer
  const footerY = pageHeight - margin - 20;
  addText(`Printed: ${new Date().toLocaleString()}`, margin, footerY, {
    fontSize: 8,
    align: "left",
  });
  doc.font("Courier").fontSize(8);
  doc.text(`RO ${data.serviceRecord.roNumber}`, pageWidth - margin, footerY, {
    align: "right",
    width: 100,
  });

  return doc;
}

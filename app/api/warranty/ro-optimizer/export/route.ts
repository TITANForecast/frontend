import { NextRequest, NextResponse } from "next/server";
import {
  requireDealerAccess,
  dealerUnauthorizedResponse,
} from "@/lib/auth/dealer-middleware";
import { prisma } from "@/lib/db/prisma-admin-data";
import { generateROPDF, ROPDFData } from "@/lib/utils/pdf-generator";
import archiver from "archiver";
import { Readable } from "stream";

/**
 * POST /api/warranty/ro-optimizer/export
 * Generate PDFs for multiple ROs and return as ZIP
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealerId");
    const body = await request.json();
    const { serviceRecordIds } = body; // Array of service record IDs

    if (!dealerId) {
      return NextResponse.json(
        { error: "dealerId is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(serviceRecordIds) || serviceRecordIds.length === 0) {
      return NextResponse.json(
        { error: "serviceRecordIds array is required" },
        { status: 400 }
      );
    }

    const auth = await requireDealerAccess(request, dealerId);
    if (!auth.authorized) {
      return dealerUnauthorizedResponse(auth.error);
    }

    // Fetch dealer information
    const dealer = await prisma.dealer.findUnique({
      where: { id: dealerId },
    });

    if (!dealer) {
      return NextResponse.json(
        { error: "Dealer not found" },
        { status: 404 }
      );
    }

    // Create a ZIP archive
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Maximum compression
    });

    // Generate PDF for each RO
    const pdfPromises = serviceRecordIds.map(async (serviceRecordId: string) => {
      try {
        // Fetch service record with related data
        const serviceRecordQuery = `
          SELECT 
            sr.*,
            v.year as vehicle_year,
            v.make as vehicle_make,
            v.model as vehicle_model,
            v.trim as vehicle_trim,
            v.vin as vehicle_vin,
            v.exterior_color as vehicle_color,
            v.stock_number as vehicle_stock_number,
            COALESCE(
              NULLIF(c.full_name, ''),
              TRIM(
                COALESCE(NULLIF(c.salutation, ''), '') || ' ' ||
                COALESCE(NULLIF(c.first_name, ''), '') || ' ' ||
                COALESCE(NULLIF(c.middle_name, ''), '') || ' ' ||
                COALESCE(NULLIF(c.last_name, ''), '') || ' ' ||
                COALESCE(NULLIF(c.suffix, ''), '')
              )
            ) as customer_name,
            TRIM(
              COALESCE(NULLIF(c.address_line_1, ''), '') || 
              CASE WHEN c.address_line_2 IS NOT NULL AND c.address_line_2 != '' THEN ', ' || c.address_line_2 ELSE '' END ||
              CASE 
                WHEN (c.city IS NOT NULL AND c.city != '') OR (c.state IS NOT NULL AND c.state != '') OR (c.zip_code IS NOT NULL AND c.zip_code != '') 
                THEN ', ' || TRIM(COALESCE(NULLIF(c.city, ''), '') || ' ' || COALESCE(NULLIF(c.state, ''), '') || ' ' || COALESCE(NULLIF(c.zip_code, ''), ''))
                ELSE '' 
              END
            ) as customer_address,
            COALESCE(NULLIF(c.cell_phone, ''), NULLIF(c.home_phone, ''), NULLIF(c.work_phone, '')) as customer_phone,
            c.email_1 as customer_email
          FROM service_record sr
          LEFT JOIN vehicle v ON sr.vehicle_id = v.id
          LEFT JOIN customer c ON sr.customer_id = c.id
          WHERE sr.id = '${serviceRecordId}'
            AND sr.dealer_id = '${dealerId}'
        `;

        const serviceRecords = await prisma.$queryRawUnsafe<any[]>(
          serviceRecordQuery
        );

        if (!serviceRecords || serviceRecords.length === 0) {
          return null;
        }

        const sr = serviceRecords[0];

        // Fetch all operations for this service record
        const operationsQuery = `
          SELECT 
            o.*
          FROM operation o
          WHERE o.service_record_id = '${serviceRecordId}'
            AND o.dealer_id = '${dealerId}'
          ORDER BY o.id
        `;

        const operations = await prisma.$queryRawUnsafe<any[]>(operationsQuery);

        // Fetch labor and parts lines for each operation
        const operationsWithDetails = await Promise.all(
          operations.map(async (op) => {
            const laborQuery = `
              SELECT 
                l.tech_number,
                l.tech_name,
                l.labor_bill_hours,
                l.labor_sale,
                l.labor_cost
              FROM labor_line l
              WHERE l.operation_id = '${op.id}'
              ORDER BY l.id
            `;

            const partsQuery = `
              SELECT 
                p.part_number,
                p.part_description,
                p.part_quantity,
                p.parts_unit_cost,
                p.parts_unit_sale,
                p.parts_unit_cost * p.part_quantity as total_cost,
                p.parts_unit_sale * p.part_quantity as total_sale
              FROM parts_line p
              WHERE p.operation_id = '${op.id}'
              ORDER BY p.id
            `;

            const [laborLines, partsLines] = await Promise.all([
              prisma.$queryRawUnsafe<any[]>(laborQuery),
              prisma.$queryRawUnsafe<any[]>(partsQuery),
            ]);

            const totalLaborHours = laborLines.reduce(
              (sum, l) => sum + parseFloat(l.labor_bill_hours || 0),
              0
            );
            const totalLaborSale = laborLines.reduce(
              (sum, l) => sum + parseFloat(l.labor_sale || 0),
              0
            );
            const totalLaborCost = laborLines.reduce(
              (sum, l) => sum + parseFloat(l.labor_cost || 0),
              0
            );
            const totalPartsSale = partsLines.reduce(
              (sum, p) => sum + parseFloat(p.total_sale || 0),
              0
            );
            const totalPartsCost = partsLines.reduce(
              (sum, p) => sum + parseFloat(p.total_cost || 0),
              0
            );

            return {
              ...op,
              labor_lines: laborLines,
              parts_lines: partsLines,
              total_labor_hours: totalLaborHours,
              total_labor_sale: totalLaborSale,
              total_labor_cost: totalLaborCost,
              total_parts_sale: totalPartsSale,
              total_parts_cost: totalPartsCost,
            };
          })
        );

        // Fetch financial summary
        const financialSummaryQuery = `
          SELECT *
          FROM financial_summary
          WHERE service_record_id = '${serviceRecordId}'
        `;

        const financialSummaries = await prisma.$queryRawUnsafe<any[]>(
          financialSummaryQuery
        );
        const fs =
          financialSummaries && financialSummaries.length > 0
            ? financialSummaries[0]
            : null;

        // Format data for PDF generation
        const pdfData: ROPDFData = {
          dealer: {
            name: dealer.name || "",
            address: dealer.address || undefined,
            city: dealer.city || undefined,
            state: dealer.state || undefined,
            zip: dealer.zip || undefined,
            phone: dealer.contactPhone || undefined,
          },
          customer: {
            name: sr.customer_name || "",
            address: sr.customer_address || undefined,
            phone: sr.customer_phone || undefined,
            email: sr.customer_email || undefined,
          },
          vehicle: {
            year: sr.vehicle_year?.toString() || undefined,
            make: sr.vehicle_make || undefined,
            model: sr.vehicle_model || undefined,
            trim: sr.vehicle_trim || undefined,
            vin: sr.vehicle_vin || undefined,
            color: sr.vehicle_color || undefined,
            stockNumber: sr.vehicle_stock_number || undefined,
            mileageIn: sr.ro_mileage
              ? parseFloat(sr.ro_mileage.toString())
              : undefined,
            mileageOut: sr.mileage_out
              ? parseFloat(sr.mileage_out.toString())
              : undefined,
          },
          serviceRecord: {
            roNumber: sr.ro_number || serviceRecordId,
            openDate: sr.open_date ? new Date(sr.open_date).toISOString() : undefined,
            closeDate: sr.close_date
              ? new Date(sr.close_date).toISOString()
              : undefined,
            deliveredDate: sr.pickup_date
              ? new Date(sr.pickup_date).toISOString()
              : undefined,
            serviceAdvisorName: sr.service_advisor_name || undefined,
            invoiceNumber: undefined,
            typeOfSale: undefined,
          },
          operations: operationsWithDetails.map((op) => ({
            operationCode: op.operation_code || "",
            operationDescription: op.operation_description || "",
            payType: op.sale_type || "C",
            laborComplaint: op.labor_complaint || undefined,
            laborCause: op.labor_cause || undefined,
            laborCorrection: op.labor_correction || undefined,
            laborComments: op.labor_comments || undefined,
            laborLines: (op.labor_lines || [])
              .filter((l: any) => l.tech_number || l.tech_name)
              .map((l: any) => ({
                techNumber: l.tech_number || undefined,
                techName: l.tech_name || undefined,
                laborBillHours: l.labor_bill_hours
                  ? parseFloat(l.labor_bill_hours.toString())
                  : undefined,
                laborSale: l.labor_sale
                  ? parseFloat(l.labor_sale.toString())
                  : undefined,
                laborCost: l.labor_cost
                  ? parseFloat(l.labor_cost.toString())
                  : undefined,
                repairIn: undefined,
                repairOut: undefined,
              })),
            partsLines: (op.parts_lines || [])
              .filter((p: any) => p.part_number || p.part_description)
              .map((p: any) => ({
                partNumber: p.part_number || undefined,
                partDescription: p.part_description || undefined,
                quantity: p.part_quantity
                  ? parseFloat(p.part_quantity.toString())
                  : undefined,
                unitCost: p.parts_unit_cost
                  ? parseFloat(p.parts_unit_cost.toString())
                  : undefined,
                unitSale: p.parts_unit_sale
                  ? parseFloat(p.parts_unit_sale.toString())
                  : undefined,
                totalCost: p.total_cost ? parseFloat(p.total_cost.toString()) : undefined,
                totalSale: p.total_sale ? parseFloat(p.total_sale.toString()) : undefined,
              })),
            totalLaborHours: op.total_labor_hours
              ? parseFloat(op.total_labor_hours)
              : undefined,
            totalLaborSale: op.total_labor_sale
              ? parseFloat(op.total_labor_sale)
              : undefined,
            totalLaborCost: op.total_labor_cost
              ? parseFloat(op.total_labor_cost)
              : undefined,
            totalPartsSale: op.total_parts_sale
              ? parseFloat(op.total_parts_sale)
              : undefined,
            totalPartsCost: op.total_parts_cost
              ? parseFloat(op.total_parts_cost)
              : undefined,
          })),
          totals: {
            customerLaborCost: fs?.customer_labor_cost
              ? parseFloat(fs.customer_labor_cost)
              : undefined,
            customerLaborSale: fs?.customer_labor_sale
              ? parseFloat(fs.customer_labor_sale)
              : undefined,
            customerPartsCost: fs?.customer_parts_cost
              ? parseFloat(fs.customer_parts_cost)
              : undefined,
            customerPartsSale: fs?.customer_parts_sale
              ? parseFloat(fs.customer_parts_sale)
              : undefined,
            warrantyLaborCost: fs?.warranty_labor_cost
              ? parseFloat(fs.warranty_labor_cost)
              : undefined,
            warrantyLaborSale: fs?.warranty_labor_sale
              ? parseFloat(fs.warranty_labor_sale)
              : undefined,
            warrantyPartsCost: fs?.warranty_parts_cost
              ? parseFloat(fs.warranty_parts_cost)
              : undefined,
            warrantyPartsSale: fs?.warranty_parts_sale
              ? parseFloat(fs.warranty_parts_sale)
              : undefined,
            internalLaborCost: fs?.internal_labor_cost
              ? parseFloat(fs.internal_labor_cost)
              : undefined,
            internalLaborSale: fs?.internal_labor_sale
              ? parseFloat(fs.internal_labor_sale)
              : undefined,
            internalPartsCost: fs?.internal_parts_cost
              ? parseFloat(fs.internal_parts_cost)
              : undefined,
            internalPartsSale: fs?.internal_parts_sale
              ? parseFloat(fs.internal_parts_sale)
              : undefined,
            grandTotal: fs?.total_sale ? parseFloat(fs.total_sale) : undefined,
          },
        };

        // Generate PDF
        const pdfDoc = generateROPDF(pdfData);

        // Convert PDF to buffer
        const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
          const chunks: Buffer[] = [];

          pdfDoc.on("data", (chunk: Buffer) => {
            chunks.push(chunk);
          });

          pdfDoc.on("end", () => {
            resolve(Buffer.concat(chunks));
          });

          pdfDoc.on("error", (error) => {
            reject(error);
          });

          pdfDoc.end();
        });

        return {
          roNumber: sr.ro_number || serviceRecordId,
          buffer: pdfBuffer,
        };
      } catch (error) {
        console.error(`Error generating PDF for RO ${serviceRecordId}:`, error);
        return null;
      }
    });

    // Wait for all PDFs to be generated
    const pdfResults = await Promise.all(pdfPromises);
    const validPdfs = pdfResults.filter(
      (result): result is { roNumber: string; buffer: Buffer } => result !== null
    );

    if (validPdfs.length === 0) {
      return NextResponse.json(
        { error: "No PDFs were generated" },
        { status: 500 }
      );
    }

    // Add PDFs to archive
    validPdfs.forEach(({ roNumber, buffer }) => {
      archive.append(buffer, { name: `RO-${roNumber}.pdf` });
    });

    // Finalize the archive
    archive.finalize();

    // Convert archive stream to buffer
    const zipBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];

      archive.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      archive.on("end", () => {
        resolve(Buffer.concat(chunks));
      });

      archive.on("error", (error) => {
        reject(error);
      });
    });

    // Return ZIP file
    return new NextResponse(zipBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="RO-Optimizer-Export-${new Date().toISOString().split("T")[0]}.zip"`,
      },
    });
  } catch (error) {
    console.error("Error generating bulk PDF export:", error);
    return NextResponse.json(
      {
        error: "Failed to generate bulk PDF export",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}



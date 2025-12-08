import { NextRequest } from "next/server";
import {
  requireDealerAccess,
  dealerUnauthorizedResponse,
} from "@/lib/auth/dealer-middleware";
import { prisma } from "@/lib/db/prisma-admin-data";

/**
 * GET /api/dealer-settings/operations/export
 * Stream operations as CSV for efficient large dataset exports
 *
 * This endpoint:
 * - Streams data directly from database to client (no intermediate buffering)
 * - Uses minimal memory regardless of dataset size
 * - Provides real-time progress feedback
 * - Handles millions of records efficiently
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealerId");

    // Extract all filter parameters (same as regular operations endpoint)
    const serviceIds = searchParams.get("serviceIds");
    const warrantyEligible = searchParams.get("warrantyEligible");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const payTypes = searchParams.get("payTypes");
    const eligibleMakesOnly = searchParams.get("eligibleMakesOnly");
    const eligibleOpcodesOnly = searchParams.get("eligibleOpcodesOnly");
    const laborPartsFilter = searchParams.get("laborPartsFilter");
    const laborFields = searchParams.get("laborFields");
    const search = searchParams.get("search");
    const sortColumn =
      searchParams.get("sortColumn") || "service_record_open_date";
    const sortDirection = searchParams.get("sortDirection") || "desc";

    if (!dealerId) {
      return new Response("dealerId is required", { status: 400 });
    }

    const auth = await requireDealerAccess(request, dealerId);
    if (!auth.authorized) {
      return dealerUnauthorizedResponse(auth.error);
    }

    // Build WHERE clause (same as regular endpoint)
    let whereConditions = [`o.dealer_id = '${dealerId}'`];

    if (serviceIds) {
      const serviceIdArray = serviceIds.split(",").map((id) => id.trim());
      if (serviceIdArray.includes("null")) {
        const nonNullIds = serviceIdArray.filter((id) => id !== "null");
        if (nonNullIds.length > 0) {
          whereConditions.push(
            `(o.service_id IN (${nonNullIds.join(
              ","
            )}) OR o.service_id IS NULL)`
          );
        } else {
          whereConditions.push(`o.service_id IS NULL`);
        }
      } else {
        whereConditions.push(`o.service_id IN (${serviceIdArray.join(",")})`);
      }
    }

    if (warrantyEligible === "true") {
      whereConditions.push(`o.is_warranty_eligible = true`);
    } else if (warrantyEligible === "false") {
      whereConditions.push(`o.is_warranty_eligible = false`);
    } else if (warrantyEligible === "null") {
      whereConditions.push(`o.is_warranty_eligible IS NULL`);
    }

    if (startDate) {
      whereConditions.push(`sr.open_date >= '${startDate}'`);
    }

    if (endDate) {
      whereConditions.push(`sr.open_date <= '${endDate}'`);
    }

    if (payTypes) {
      const payTypeArray = payTypes.split(",").map((pt) => `'${pt.trim()}'`);
      whereConditions.push(`o.sale_type IN (${payTypeArray.join(",")})`);
    }

    if (eligibleMakesOnly === "true") {
      whereConditions.push(`m.warranty_eligible = true`);
    }

    if (eligibleOpcodesOnly === "true") {
      whereConditions.push(`oc.warranty_eligible = true`);
    }

    if (laborFields) {
      const laborFieldArray = laborFields
        .split(",")
        .map((field) => field.trim());
      const laborConditions: string[] = [];

      if (laborFieldArray.includes("complaint")) {
        laborConditions.push(
          `(o.labor_complaint IS NOT NULL AND o.labor_complaint != '')`
        );
      }
      if (laborFieldArray.includes("cause")) {
        laborConditions.push(
          `(o.labor_cause IS NOT NULL AND o.labor_cause != '')`
        );
      }
      if (laborFieldArray.includes("correction")) {
        laborConditions.push(
          `(o.labor_correction IS NOT NULL AND o.labor_correction != '')`
        );
      }
      if (laborFieldArray.includes("comment")) {
        laborConditions.push(
          `(o.labor_comments IS NOT NULL AND o.labor_comments != '')`
        );
      }

      if (laborConditions.length > 0) {
        whereConditions.push(`(${laborConditions.join(" AND ")})`);
      }
    }

    if (search) {
      const escapedSearch = search.replace(/'/g, "''");
      whereConditions.push(
        `(o.operation_code ILIKE '%${escapedSearch}%' OR sr.ro_number ILIKE '%${escapedSearch}%' OR o.operation_description ILIKE '%${escapedSearch}%' OR o.labor_complaint ILIKE '%${escapedSearch}%' OR o.labor_cause ILIKE '%${escapedSearch}%' OR o.labor_correction ILIKE '%${escapedSearch}%' OR o.labor_comments ILIKE '%${escapedSearch}%')`
      );
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Map sort column
    const columnMap: Record<string, string> = {
      service_record_open_date: "sr.open_date",
      operation_code: "o.operation_code",
      operation_description: "o.operation_description",
      pay_type: "o.sale_type",
      service_name: "s.name",
      service_category_name: "sc.name",
      service_subcategory_name: "ss.name",
      is_warranty_eligible: "o.is_warranty_eligible",
      ai_confidence_warranty: "o.ai_confidence_warranty",
    };

    const validColumn = columnMap[sortColumn] || "sr.open_date";
    const validDirection =
      sortDirection.toLowerCase() === "asc" ? "ASC" : "DESC";
    const orderByClause = `ORDER BY ${validColumn} ${validDirection}, o.id DESC`;

    // WHERE clause for labor/parts filter (changed from HAVING since we're using subqueries)
    // Add conditions to the main WHERE clause to filter operations
    // Note: For warranty operations, we match RO Selection logic which requires labor_sale > 0 (not just hours)
    let laborPartsWhereClause = "";
    if (laborPartsFilter === "labor") {
      // Match RO Selection: require labor_sale > 0 (not just hours)
      // This ensures we exclude operations with $0 or negative revenue
      laborPartsWhereClause = ` AND COALESCE(labor_totals.total_labor_sale, 0) > 0`;
    } else if (laborPartsFilter === "parts") {
      laborPartsWhereClause = ` AND COALESCE(parts_totals.total_parts_sale, 0) > 0`;
    } else if (laborPartsFilter === "laborOrParts") {
      laborPartsWhereClause = ` AND (COALESCE(labor_totals.total_labor_sale, 0) > 0 OR COALESCE(parts_totals.total_parts_sale, 0) > 0)`;
    }

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send CSV headers first
          const csvHeaders =
            [
              "Service Record Open Date",
              "RO Number",
              "Operation Code",
              "Operation Description",
              "Pay Type",
              "Service Name",
              "Service Category",
              "Service Subcategory",
              "Warranty Eligible",
              "AI Confidence Service (%)",
              "AI Confidence Warranty (%)",
              "AI Reasoning Summary",
              "Customer Name",
              "Customer Phone",
              "Customer Email",
              "Customer Address",
              "Vehicle Year",
              "Vehicle Make",
              "Vehicle Model",
              "Vehicle Trim",
              "Vehicle VIN",
              "Labor Hours",
              "Labor Sale Total",
              "Labor Cost",
              "Parts Sale Total",
              "Parts Cost",
              "Parts Count",
              "Parts List",
              "ELR (Effective Labor Rate)",
              "Part Markup %",
              "Labor Complaint",
              "Labor Cause",
              "Labor Correction",
              "Labor Comments",
              "Eligibility Notes",
              "Updated At",
            ].join(",") + "\n";

          controller.enqueue(encoder.encode(csvHeaders));

          // Stream data in batches from database
          const batchSize = 1000;
          let offset = 0;
          let hasMoreData = true;

          while (hasMoreData) {
            const query = `
              SELECT 
                o.*,
                sr.open_date as service_record_open_date,
                sr.ro_number as ro_number,
                s.id as service_id,
                s.name as service_name,
                sc.id as service_category_id,
                sc.name as service_category_name,
                ss.id as service_subcategory_id,
                ss.name as service_subcategory_name,
                u.name as updated_by_user_name,
                v.make as vehicle_make,
                v.year as vehicle_year,
                v.model as vehicle_model,
                v.trim as vehicle_trim,
                v.vin as vehicle_vin,
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
                COALESCE(NULLIF(c.cell_phone, ''), NULLIF(c.home_phone, ''), NULLIF(c.work_phone, '')) as customer_phone,
                c.email_1 as customer_email,
                TRIM(
                  COALESCE(NULLIF(c.address_line_1, ''), '') || 
                  CASE WHEN c.address_line_2 IS NOT NULL AND c.address_line_2 != '' THEN ', ' || c.address_line_2 ELSE '' END ||
                  CASE 
                    WHEN (c.city IS NOT NULL AND c.city != '') OR (c.state IS NOT NULL AND c.state != '') OR (c.zip_code IS NOT NULL AND c.zip_code != '') 
                    THEN ', ' || TRIM(COALESCE(NULLIF(c.city, ''), '') || ' ' || COALESCE(NULLIF(c.state, ''), '') || ' ' || COALESCE(NULLIF(c.zip_code, ''), ''))
                    ELSE '' 
                  END
                ) as customer_address,
                o.sale_type as pay_type,
                COALESCE(labor_totals.total_labor_hours, 0) as total_labor_hours,
                COALESCE(labor_totals.total_labor_sale, 0) as total_labor_sale,
                COALESCE(labor_totals.total_labor_cost, 0) as total_labor_cost,
                COALESCE(parts_totals.total_parts_sale, 0) as total_parts_sale,
                COALESCE(parts_totals.total_parts_cost, 0) as total_parts_cost,
                COALESCE(parts_totals.parts_count, 0) as parts_count,
                parts_totals.parts_list as parts_list,
                o.ai_reasoning_summary
              FROM operation o
              LEFT JOIN service_record sr ON o.service_record_id = sr.id
              LEFT JOIN vehicle v ON sr.vehicle_id = v.id
              LEFT JOIN customer c ON sr.customer_id = c.id
              LEFT JOIN makes m ON v.make = m.make_name
              LEFT JOIN opcodes oc ON o.operation_code = oc.opcode
              LEFT JOIN services s ON o.service_id = s.id AND o.dealer_id = s.dealer_id
              LEFT JOIN service_categories sc ON s.category_id = sc.id AND s.dealer_id = sc.dealer_id
              LEFT JOIN service_subcategories ss ON s.subcategory_id = ss.id AND s.dealer_id = ss.dealer_id
              LEFT JOIN users u ON o.updated_by::text = u.id
              LEFT JOIN (
                SELECT 
                  l.operation_id,
                  COALESCE(SUM(l.labor_bill_hours), 0) as total_labor_hours,
                  COALESCE(SUM(l.labor_sale), 0) as total_labor_sale,
                  COALESCE(SUM(l.labor_cost), 0) as total_labor_cost
                FROM labor_line l
                GROUP BY l.operation_id
              ) labor_totals ON o.id = labor_totals.operation_id
              LEFT JOIN (
                SELECT 
                  p.operation_id,
                  COALESCE(SUM(p.parts_unit_sale * p.part_quantity), 0) as total_parts_sale,
                  COALESCE(SUM(p.parts_unit_cost * p.part_quantity), 0) as total_parts_cost,
                  COUNT(DISTINCT CASE WHEN p.part_number IS NOT NULL AND p.part_number != '' THEN p.id END) as parts_count,
                  STRING_AGG(DISTINCT NULLIF(p.part_number, ''), ', ') FILTER (WHERE p.part_number IS NOT NULL AND p.part_number != '') as parts_list
                FROM parts_line p
                GROUP BY p.operation_id
              ) parts_totals ON o.id = parts_totals.operation_id
              ${whereClause}${laborPartsWhereClause}
              ${orderByClause}
              LIMIT ${batchSize} OFFSET ${offset}
            `;

            const batch = await prisma.$queryRawUnsafe<any[]>(query);

            if (batch.length === 0) {
              hasMoreData = false;
              break;
            }

            // Convert batch to CSV rows and stream immediately
            for (const op of batch) {
              const laborHours = parseDecimal(op.total_labor_hours);
              const laborSale = parseDecimal(op.total_labor_sale);
              const partsSale = parseDecimal(op.total_parts_sale);
              const partsCost = parseDecimal(op.total_parts_cost);

              const elr = laborHours > 0 ? laborSale / laborHours : null;
              const partMarkup =
                partsCost > 0
                  ? ((partsSale - partsCost) / partsCost) * 100
                  : null;

              const row =
                [
                  op.service_record_open_date
                    ? new Date(op.service_record_open_date).toLocaleDateString()
                    : "",
                  escapeCSV(op.ro_number || op.service_record_id || ""),
                  escapeCSV(op.operation_code || ""),
                  escapeCSV(op.operation_description || ""),
                  op.pay_type === "C"
                    ? "Customer Pay"
                    : op.pay_type === "W"
                    ? "Warranty"
                    : op.pay_type === "I"
                    ? "Internal"
                    : "",
                  escapeCSV(op.service_name || ""),
                  escapeCSV(op.service_category_name || ""),
                  escapeCSV(op.service_subcategory_name || ""),
                  op.is_warranty_eligible === null
                    ? "Unset"
                    : op.is_warranty_eligible
                    ? "Yes"
                    : "No",
                  op.ai_confidence_service !== null &&
                  op.ai_confidence_service !== undefined
                    ? (op.ai_confidence_service * 100).toFixed(1)
                    : "",
                  op.ai_confidence_warranty !== null &&
                  op.ai_confidence_warranty !== undefined
                    ? (op.ai_confidence_warranty * 100).toFixed(1)
                    : "",
                  escapeCSV(op.ai_reasoning_summary || ""),
                  escapeCSV(op.customer_name || ""),
                  escapeCSV(op.customer_phone || ""),
                  escapeCSV(op.customer_email || ""),
                  escapeCSV(op.customer_address || ""),
                  escapeCSV(op.vehicle_year || ""),
                  escapeCSV(op.vehicle_make || ""),
                  escapeCSV(op.vehicle_model || ""),
                  escapeCSV(op.vehicle_trim || ""),
                  escapeCSV(op.vehicle_vin || ""),
                  laborHours > 0 ? laborHours.toFixed(2) : "0.00",
                  laborSale.toFixed(2),
                  parseDecimal(op.total_labor_cost).toFixed(2),
                  partsSale.toFixed(2),
                  partsCost.toFixed(2),
                  op.parts_count || 0,
                  escapeCSV(op.parts_list || ""),
                  elr !== null ? `$${elr.toFixed(2)}` : "N/A",
                  partMarkup !== null ? `${partMarkup.toFixed(2)}%` : "N/A",
                  escapeCSV(op.labor_complaint || ""),
                  escapeCSV(op.labor_cause || ""),
                  escapeCSV(op.labor_correction || ""),
                  escapeCSV(op.labor_comments || ""),
                  escapeCSV(op.eligibility_notes || ""),
                  op.updated_at ? new Date(op.updated_at).toLocaleString() : "",
                ].join(",") + "\n";

              controller.enqueue(encoder.encode(row));
            }

            offset += batchSize;

            // If we got fewer results than batch size, we're done
            if (batch.length < batchSize) {
              hasMoreData = false;
            }
          }

          controller.close();
        } catch (error) {
          console.error("Streaming export error:", error);
          controller.error(error);
        }
      },
    });

    // Return streaming response with CSV headers
    return new Response(stream, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="operations_export_${
          new Date().toISOString().split("T")[0]
        }.csv"`,
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return new Response("Failed to export operations", { status: 500 });
  }
}

// Helper functions
function parseDecimal(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value) || 0;

  // Handle Prisma Decimal object
  if (typeof value === "object" && "d" in value && Array.isArray(value.d)) {
    try {
      const sign = value.s === -1 ? "-" : "";
      const digits = value.d as number[];
      const exponent = typeof value.e === "number" ? value.e : 0;

      if (digits.length === 0) return 0;

      let coefficient = digits[0].toString();
      for (let i = 1; i < digits.length; i++) {
        coefficient += digits[i].toString().padStart(7, "0");
      }

      const decimalPosition = exponent + 1;

      let numStr: string;
      if (decimalPosition <= 0) {
        numStr = "0." + "0".repeat(-decimalPosition) + coefficient;
      } else if (decimalPosition >= coefficient.length) {
        numStr = coefficient + "0".repeat(decimalPosition - coefficient.length);
      } else {
        numStr =
          coefficient.slice(0, decimalPosition) +
          "." +
          coefficient.slice(decimalPosition);
      }

      return parseFloat(sign + numStr);
    } catch (error) {
      console.error("Error parsing Decimal:", error, value);
      return 0;
    }
  }
  return 0;
}

function escapeCSV(value: string): string {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (
    stringValue.includes(",") ||
    stringValue.includes("\n") ||
    stringValue.includes('"')
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

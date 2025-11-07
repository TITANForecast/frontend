import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin, unauthorizedResponse } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma-admin-data";
import { jsonResponse } from "@/lib/utils/bigint-json";

/**
 * GET /api/admin/warranty-rules/filter-values
 * Get unique values for filters (makes, categories) and autocomplete suggestions
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "makes", "states", "categories", or "suggestions"
    const query = searchParams.get("query") || ""; // For autocomplete suggestions

    if (type === "makes") {
      const makesQuery = `
        SELECT DISTINCT oem_make as "make"
        FROM warranty_rules
        WHERE oem_make IS NOT NULL AND oem_make != ''
        ORDER BY oem_make ASC
      `;
      const makes = await prisma.$queryRawUnsafe<{ make: string }[]>(makesQuery);
      return jsonResponse({
        values: makes.map((m) => m.make).filter(Boolean),
      });
    }

    if (type === "states") {
      const statesQuery = `
        SELECT DISTINCT state
        FROM warranty_rules
        WHERE state IS NOT NULL AND state != ''
        ORDER BY state ASC
      `;
      const states = await prisma.$queryRawUnsafe<{ state: string }[]>(
        statesQuery
      );
      return jsonResponse({
        values: states.map((s) => s.state).filter(Boolean),
      });
    }

    if (type === "categories") {
      const categoriesQuery = `
        SELECT DISTINCT category
        FROM warranty_rules
        WHERE category IS NOT NULL AND category != ''
        ORDER BY category ASC
      `;
      const categories = await prisma.$queryRawUnsafe<{ category: string }[]>(
        categoriesQuery
      );
      return jsonResponse({
        values: categories.map((c) => c.category).filter(Boolean),
      });
    }

    if (type === "suggestions") {
      if (!query.trim()) {
        return jsonResponse({ suggestions: [] });
      }

      const escapedQuery = query.trim().replace(/'/g, "''");
      const suggestionsQuery = `
        SELECT DISTINCT keyword_pattern as "pattern"
        FROM warranty_rules
        WHERE keyword_pattern ILIKE '%${escapedQuery}%'
        ORDER BY keyword_pattern ASC
        LIMIT 10
      `;
      const suggestions = await prisma.$queryRawUnsafe<{ pattern: string }[]>(
        suggestionsQuery
      );
      return jsonResponse({
        suggestions: suggestions.map((s) => s.pattern).filter(Boolean),
      });
    }

    return NextResponse.json(
      { error: "Invalid type parameter. Must be: makes, states, categories, or suggestions" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error fetching filter values:", error);
    return NextResponse.json(
      { error: "Failed to fetch filter values" },
      { status: 500 }
    );
  }
}


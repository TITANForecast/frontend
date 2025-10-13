import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

// In-memory cache to avoid reading files on every request
let cachedData: {
  dmsData: any;
  kpiData: any;
  source: string;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 60 * 1000; // Cache for 60 seconds

export async function GET() {
  try {
    // Return cached data if available and not expired
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        source: cachedData.source + " (cached)",
        data: cachedData.dmsData,
        kpis: cachedData.kpiData,
      });
    }

    // Load both files in parallel for faster loading
    const [dmsResult, kpiResult] = await Promise.allSettled([
      // Try to load DMS data
      (async () => {
        try {
          const filePath = join(process.cwd(), "SV500.json");
          const fileContent = await readFile(filePath, "utf-8");
          return { data: JSON.parse(fileContent), source: "local-SV500" };
        } catch (error) {
          // Fallback to SV50.json
          const filePath = join(process.cwd(), "SV50.json");
          const fileContent = await readFile(filePath, "utf-8");
          return { data: JSON.parse(fileContent), source: "local-SV50" };
        }
      })(),
      // Try to load KPI data
      (async () => {
        try {
          const kpiFilePath = join(process.cwd(), "kpi_results.json");
          const kpiFileContent = await readFile(kpiFilePath, "utf-8");
          return JSON.parse(kpiFileContent);
        } catch (error) {
          console.log("kpi_results.json not available, will calculate KPIs from raw data");
          return null;
        }
      })(),
    ]);

    // Handle DMS data result
    if (dmsResult.status === "rejected") {
      return NextResponse.json(
        { error: "No data source available" },
        { status: 503 }
      );
    }

    const { data: dmsData, source } = dmsResult.value;
    const kpiData = kpiResult.status === "fulfilled" ? kpiResult.value : null;

    // Cache the results
    cachedData = {
      dmsData,
      kpiData,
      source,
      timestamp: Date.now(),
    };

    return NextResponse.json({
      source,
      data: dmsData,
      kpis: kpiData,
    });
  } catch (error) {
    console.error("Error fetching DMS data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  try {
    let dmsData = null;
    let kpiData = null;
    let source = "";

    // Try to fetch DMS data from backend API
    const backendUrl = "http://localhost:8000/api/v1/dms/delivery/parsed";
    
    try {
      const response = await fetch(backendUrl, {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        dmsData = await response.json();
        source = "api";
      }
    } catch (apiError) {
      console.log("Backend API not available, using fallback data");
    }

    // Fallback to SV500.json if API is not available
    if (!dmsData) {
      try {
        const filePath = join(process.cwd(), "SV500.json");
        const fileContent = await readFile(filePath, "utf-8");
        dmsData = JSON.parse(fileContent);
        source = "fallback-SV500";
      } catch (fileError) {
        console.error("Error reading SV500.json:", fileError);
        
        // If SV500 fails, try SV50.json as final fallback
        try {
          const filePath = join(process.cwd(), "SV50.json");
          const fileContent = await readFile(filePath, "utf-8");
          dmsData = JSON.parse(fileContent);
          source = "fallback-SV50";
        } catch (sv50Error) {
          return NextResponse.json(
            { error: "No data source available" },
            { status: 503 }
          );
        }
      }
    }

    // Try to load KPI data (pre-calculated KPIs)
    try {
      const kpiFilePath = join(process.cwd(), "kpi_results.json");
      const kpiFileContent = await readFile(kpiFilePath, "utf-8");
      kpiData = JSON.parse(kpiFileContent);
    } catch (kpiError) {
      console.log("kpi_results.json not available, will calculate KPIs from raw data");
    }

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


# RO Performance Summary Report

## Overview

The RO Performance Summary report provides a comprehensive analysis of repair orders (ROs) with key labor and parts KPIs. It features flexible grouping capabilities allowing users to analyze performance patterns across different dimensions.

## Features

### 1. Default View
- **Ungrouped list**: One row per RO showing all metrics
- **All groupable columns visible**: Opcode, Make, Model, Advisor, Mileage Band

### 2. Flexible Grouping
- **Drag-and-drop grouping**: Users can drag column headers to create pivot-style grouped views
- **Multi-level grouping**: Support for multiple grouping levels (e.g., Advisor → Make → Model)
- **Automatic aggregation**: Numeric columns automatically aggregate when grouped

### 3. Filters

#### Date Range
- **Start Date**: Filter ROs from a specific date
- **End Date**: Filter ROs up to a specific date
- **Default**: Last 3 months

#### Pay Type (Multi-select)
- **Customer Pay (C)**: Customer-paid operations
- **Warranty (W)**: Warranty operations
- **Internal (I)**: Internal operations
- **Default**: All types selected

#### Warranty Eligibility
- **All**: Show all ROs regardless of warranty eligibility
- **Eligible**: Only show ROs with warranty-eligible operations
- **Not Eligible**: Only show ROs without warranty-eligible operations
- **Unset**: Only show ROs where warranty eligibility is not determined
- **Default**: All

### 4. Metrics & Columns

#### Non-Groupable Columns
- **RO Number**: Unique repair order identifier
- **RO Date**: Date the repair order was opened

#### Groupable Columns (Enable Row Grouping)
- **Opcode**: Operation code
- **Make**: Vehicle make
- **Model**: Vehicle model
- **Advisor**: Service advisor name
- **Mileage Band**: Banded mileage ranges (1-10k, 10-20k, etc.)

#### Metrics (with Aggregation)

**RO Count**
- Definition: Number of unique ROs
- Aggregation: Sum
- Display: Integer

**Sales %**
- Definition: Percentage of operations that resulted in a sale
- Calculation: (Operations with sales / Total operations) × 100
- Aggregation: Average
- Display: Percentage (1 decimal)

**Labor Hours**
- Definition: Total billed labor hours
- Aggregation: Sum
- Display: Decimal (2 places)

**Labor Revenue**
- Definition: Total labor sales amount
- Aggregation: Sum
- Display: Currency ($)

**Labor Rev/RO**
- Definition: Labor Revenue ÷ RO Count
- Calculation: For grouped rows, calculated from aggregated values
- Display: Currency ($)

**Labor GP %**
- Definition: (Labor Revenue − Labor Cost) ÷ Labor Revenue × 100
- Aggregation: Average
- Display: Percentage (1 decimal)

**Parts Revenue**
- Definition: Total parts sales amount
- Aggregation: Sum
- Display: Currency ($)

**Parts GP %**
- Definition: (Parts Revenue − Parts Cost) ÷ Parts Revenue × 100
- Aggregation: Average
- Display: Percentage (1 decimal)

**ELR (Effective Labor Rate)**
- Definition: Labor Revenue ÷ Labor Hours
- Calculation: For grouped rows, calculated from aggregated values
- Display: Currency ($)

**Discount %**
- Definition: Percentage discount from standard rate (assumed $150/hr)
- Calculation: 100 - ((Labor Revenue / Labor Hours) / 150 × 100)
- Aggregation: Average
- Display: Percentage (1 decimal)

### 5. Mileage Banding

Vehicles are automatically assigned to mileage bands based on their odometer reading:

- **1-10k**: 0 to 9,999 miles
- **10-20k**: 10,000 to 19,999 miles
- **20-30k**: 20,000 to 29,999 miles
- **30-40k**: 30,000 to 39,999 miles
- **40-50k**: 40,000 to 49,999 miles
- **50-60k**: 50,000 to 59,999 miles
- **60-70k**: 60,000 to 69,999 miles
- **70-80k**: 70,000 to 79,999 miles
- **80-90k**: 80,000 to 89,999 miles
- **90-100k**: 90,000 to 99,999 miles
- **100-110k**: 100,000 to 109,999 miles
- **110-120k**: 110,000 to 119,999 miles
- **120-130k**: 120,000 to 129,999 miles
- **130-140k**: 130,000 to 139,999 miles
- **140-150k**: 140,000 to 149,999 miles
- **150k+**: 150,000+ miles
- **Unknown**: No mileage data available

### 6. Export Capabilities

- **Export CSV**: Export current view (with grouping) to CSV
- **Export Excel**: Export current view (with grouping) to Excel

### 7. Grid Controls

- **Expand All**: Expand all grouped rows
- **Collapse All**: Collapse all grouped rows
- **Sidebar**: Access columns and filters panels
  - **Columns Panel**: Show/hide columns, manage grouping
  - **Filters Panel**: Advanced filtering options

## How to Use

### Accessing the Report

1. Navigate to **Reports** in the sidebar
2. Click on **RO Performance Summary**

### Basic Usage

1. **Set Filters**: Adjust date range, pay types, and warranty eligibility
2. **Click "Apply Filters"**: Load data based on selected filters
3. **View Data**: Browse the ungrouped list of ROs

### Grouping Data

1. **Drag Column Header**: Drag any groupable column (Opcode, Make, Model, Advisor, Mileage Band) to the "Row Groups" area at the top of the grid
2. **Multi-level Grouping**: Drag additional columns to create nested groups
3. **Reorder Groups**: Drag groups within the Row Groups area to change hierarchy
4. **Remove Grouping**: Click the X on a group chip to remove it

### Example Grouping Scenarios

**Scenario 1: Analyze by Advisor**
- Drag "Advisor" to Row Groups
- View aggregated metrics per advisor
- Expand to see individual ROs

**Scenario 2: Analyze by Make and Model**
- Drag "Make" to Row Groups
- Drag "Model" to Row Groups (creates nested grouping)
- View metrics by make, then drill down by model

**Scenario 3: Analyze by Mileage Band**
- Drag "Mileage Band" to Row Groups
- Identify which mileage ranges generate most revenue

**Scenario 4: Complex Analysis**
- Drag "Advisor" → "Make" → "Mileage Band"
- Analyze which advisors are most effective with specific makes at different mileage ranges

### Summary Statistics

At the bottom of the page, view overall statistics:
- Total ROs
- Total Labor Revenue
- Total Parts Revenue
- Total Labor Hours
- Average ELR
- Average Labor GP %

## Technical Details

### API Endpoint
```
GET /api/reports/ro-performance-summary
```

**Query Parameters:**
- `dealerId` (required): Dealer identifier
- `startDate`: ISO date string (YYYY-MM-DD)
- `endDate`: ISO date string (YYYY-MM-DD)
- `payTypes`: Comma-separated pay types (C,W,I)
- `warrantyEligibility`: yes, no, unset, all

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "service_record_id": "...",
      "ro_number": "...",
      "ro_date": "...",
      "advisor": "...",
      "ro_mileage": 45000,
      "make": "Toyota",
      "model": "Camry",
      "opcode": "A1234",
      "mileage_band": "40-50k",
      "ro_count": 1,
      "sales_percent": 85.5,
      "labor_hours": 3.5,
      "labor_revenue": 525.00,
      "labor_rev_per_ro": 525.00,
      "labor_gp_percent": 72.5,
      "parts_revenue": 250.00,
      "parts_gp_percent": 45.0,
      "elr": 150.00,
      "discount_percent": 0.0
    }
  ],
  "total": 1
}
```

### Database Tables Used
- `service_record`: Main RO data
- `vehicle`: Vehicle information (make, model, mileage)
- `operation`: Operation details (opcode, pay type, warranty eligibility)
- `labor_line`: Labor hours, costs, and revenue
- `parts_line`: Parts costs and revenue

### Performance Considerations
- Query limit: 10,000 ROs per request
- Recommended date range: 3-6 months for optimal performance
- Aggregations are performed client-side by AG Grid

## Troubleshooting

### No Data Displayed
- Check filter settings (date range, pay types)
- Ensure dealer has RO data in the selected date range
- Check browser console for API errors

### Grouping Not Working
- Ensure you're dragging to the "Row Groups" area (appears at top of grid)
- Check that AG Grid Enterprise license is active
- Try refreshing the page

### Export Issues
- For large datasets, export may take a few seconds
- Excel export requires AG Grid Enterprise features
- Check browser's download settings

## Future Enhancements

Potential improvements for future versions:
- Server-side aggregation for better performance with large datasets
- Save/load custom grouping configurations
- Additional metrics (e.g., parts per RO, operations per RO)
- Drill-down to individual operation details
- Comparison views (period over period)
- Custom mileage band configuration

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify API endpoint is accessible
3. Contact TitanForecast support with:
   - Browser version
   - Filter settings used
   - Error messages (if any)
   - Screenshots of the issue




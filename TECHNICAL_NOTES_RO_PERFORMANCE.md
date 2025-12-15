# RO Performance Summary - Technical Notes for Developers

## Database Schema Reference

### Tables Used

#### service_record
Primary table for RO data
```sql
Columns used:
- id (primary key)
- dealer_id (filter)
- ro_number (display)
- open_date (filter, sort, display)
- service_advisor_name (grouping, display)
- ro_mileage (mileage banding)
- vehicle_id (join to vehicle)
```

#### vehicle
Vehicle information
```sql
Columns used:
- id (primary key)
- make (grouping, display)
- model (grouping, display)
```

#### operation
Operation-level details
```sql
Columns used:
- id (primary key)
- service_record_id (join to service_record)
- operation_code (grouping, display)
- pay_type (filter) -- Values: 'C', 'W', 'I'
- is_warranty_eligible (filter) -- Values: true, false, null
```

#### labor_line
Labor costs and revenue
```sql
Columns used:
- id (primary key)
- operation_id (join to operation)
- labor_bill_hours (sum for Labor Hours)
- labor_sale (sum for Labor Revenue)
- labor_cost (for GP% calculation)
```

#### parts_line
Parts costs and revenue
```sql
Columns used:
- id (primary key)
- operation_id (join to operation)
- parts_unit_sale (multiply by part_quantity)
- parts_unit_cost (multiply by part_quantity)
- part_quantity (multiplier)
```

## SQL Query Structure

### Query Overview
The query uses a Common Table Expression (CTE) to aggregate data at the RO level:

```sql
WITH ro_aggregates AS (
  -- Step 1: Aggregate all operations within each RO
  SELECT 
    sr.id as service_record_id,
    sr.ro_number,
    sr.open_date as ro_date,
    sr.service_advisor_name as advisor,
    sr.ro_mileage,
    v.make,
    v.model,
    MIN(o.operation_code) as opcode,  -- First opcode alphabetically
    
    -- Labor metrics
    SUM(COALESCE(l.labor_bill_hours, 0)) as total_labor_hours,
    SUM(COALESCE(l.labor_sale, 0)) as total_labor_sale,
    SUM(COALESCE(l.labor_cost, 0)) as total_labor_cost,
    
    -- Parts metrics
    SUM(COALESCE(p.parts_unit_sale * p.part_quantity, 0)) as total_parts_sale,
    SUM(COALESCE(p.parts_unit_cost * p.part_quantity, 0)) as total_parts_cost,
    
    -- Sales % calculation
    COUNT(DISTINCT o.id) as total_operations,
    COUNT(DISTINCT CASE 
      WHEN COALESCE(l.labor_sale, 0) > 0 OR COALESCE(p.parts_unit_sale * p.part_quantity, 0) > 0 
      THEN o.id 
    END) as sold_operations
    
  FROM service_record sr
  LEFT JOIN vehicle v ON sr.vehicle_id = v.id
  LEFT JOIN operation o ON o.service_record_id = sr.id
  LEFT JOIN labor_line l ON o.id = l.operation_id
  LEFT JOIN parts_line p ON o.id = p.operation_id
  WHERE [filters]
  GROUP BY sr.id, sr.ro_number, sr.open_date, sr.service_advisor_name, sr.ro_mileage, v.make, v.model
  HAVING COUNT(DISTINCT o.id) > 0
)
SELECT 
  -- All fields from CTE
  -- Calculated metrics
  -- Mileage band CASE statement
FROM ro_aggregates
ORDER BY ro_date DESC, ro_number DESC
LIMIT 10000;
```

### Filter Implementation

#### Date Range
```sql
WHERE sr.open_date >= '${startDate}' 
  AND sr.open_date <= '${endDate}'
```

#### Pay Type (Multi-select)
```sql
WHERE o.pay_type IN ('C', 'W', 'I')
```

#### Warranty Eligibility
```sql
-- For "yes"
WHERE o.is_warranty_eligible = true

-- For "no"
WHERE o.is_warranty_eligible = false

-- For "unset"
WHERE o.is_warranty_eligible IS NULL

-- For "all"
-- No WHERE clause added
```

### Metric Calculations

#### Sales %
```sql
-- In CTE:
COUNT(DISTINCT o.id) as total_operations,
COUNT(DISTINCT CASE 
  WHEN COALESCE(l.labor_sale, 0) > 0 OR COALESCE(p.parts_unit_sale * p.part_quantity, 0) > 0 
  THEN o.id 
END) as sold_operations

-- In SELECT:
CASE 
  WHEN total_operations > 0 
  THEN (sold_operations::numeric / total_operations::numeric) * 100
  ELSE 0
END as sales_percent
```

#### Labor GP %
```sql
CASE 
  WHEN total_labor_sale > 0
  THEN ((total_labor_sale - total_labor_cost) / total_labor_sale) * 100
  ELSE 0
END as labor_gp_percent
```

#### Parts GP %
```sql
CASE 
  WHEN total_parts_sale > 0
  THEN ((total_parts_sale - total_parts_cost) / total_parts_sale) * 100
  ELSE 0
END as parts_gp_percent
```

#### ELR (Effective Labor Rate)
```sql
CASE 
  WHEN total_labor_hours > 0
  THEN total_labor_sale / total_labor_hours
  ELSE 0
END as elr
```

#### Discount %
Assumes standard rate of $150/hr
```sql
CASE 
  WHEN total_labor_hours > 0 AND total_labor_sale > 0
  THEN 100.0 - ((total_labor_sale / total_labor_hours) / 150.0 * 100.0)
  ELSE 0
END as discount_percent
```

#### Mileage Band
```sql
CASE 
  WHEN ro_mileage IS NULL THEN 'Unknown'
  WHEN ro_mileage >= 0 AND ro_mileage < 10000 THEN '1-10k'
  WHEN ro_mileage >= 10000 AND ro_mileage < 20000 THEN '10-20k'
  -- ... (continues for all bands)
  ELSE '150k+'
END as mileage_band
```

## AG Grid Configuration

### Column Definitions

```typescript
const columnDefs: ColDef<ROPerformanceData>[] = [
  // Non-groupable columns
  {
    field: "ro_number",
    headerName: "RO Number",
    pinned: "left",  // Keep visible when scrolling
  },
  
  // Groupable columns
  {
    field: "opcode",
    headerName: "Opcode",
    enableRowGroup: true,  // Enable drag-to-group
    filter: "agSetColumnFilter",  // Dropdown filter
  },
  
  // Metrics with aggregation
  {
    field: "labor_revenue",
    headerName: "Labor Revenue",
    aggFunc: "sum",  // Aggregate function
    valueFormatter: currencyFormatter,
    cellStyle: { textAlign: "right" },
  },
  
  // Calculated metrics (custom valueGetter)
  {
    field: "labor_rev_per_ro",
    headerName: "Labor Rev/RO",
    valueGetter: (params: ValueGetterParams) => {
      if (params.node?.group) {
        // For grouped rows, calculate from aggregated values
        const laborRevenue = params.node.aggData?.labor_revenue || 0;
        const roCount = params.node.aggData?.ro_count || 1;
        return laborRevenue / roCount;
      }
      // For detail rows, use pre-calculated value
      return params.data?.labor_rev_per_ro || 0;
    },
    valueFormatter: currencyFormatter,
  },
];
```

### Aggregation Functions

AG Grid supports these built-in aggregation functions:
- `sum`: Add all values
- `avg`: Average of all values
- `min`: Minimum value
- `max`: Maximum value
- `count`: Count of values
- `first`: First value
- `last`: Last value

Custom aggregations are handled via `valueGetter` functions.

### Row Grouping Configuration

```typescript
<AgGridReact
  rowData={data}
  columnDefs={columnDefs}
  rowGroupPanelShow="always"  // Always show grouping panel
  groupDefaultExpanded={0}    // Start with groups collapsed
  autoGroupColumnDef={{
    headerName: "Group",
    minWidth: 250,
    cellRenderer: "agGroupCellRenderer",
  }}
  sideBar={{
    toolPanels: [
      {
        id: "columns",
        toolPanel: "agColumnsToolPanel",
        toolPanelParams: {
          suppressRowGroups: false,  // Show row groups section
          suppressValues: false,     // Show values section
        },
      },
    ],
  }}
/>
```

## API Endpoint Details

### Request
```
GET /api/reports/ro-performance-summary
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| dealerId | string | Yes | Dealer identifier |
| startDate | string | No | ISO date (YYYY-MM-DD) |
| endDate | string | No | ISO date (YYYY-MM-DD) |
| payTypes | string | No | Comma-separated: C,W,I |
| warrantyEligibility | string | No | yes, no, unset, all |

### Response
```typescript
interface APIResponse {
  success: boolean;
  data: ROPerformanceData[];
  total: number;
}

interface ROPerformanceData {
  service_record_id: string;
  ro_number: string;
  ro_date: string;
  advisor: string;
  ro_mileage: number;
  make: string;
  model: string;
  opcode: string;
  mileage_band: string;
  ro_count: number;
  sales_percent: number;
  labor_hours: number;
  labor_revenue: number;
  labor_rev_per_ro: number;
  labor_gp_percent: number;
  parts_revenue: number;
  parts_gp_percent: number;
  elr: number;
  discount_percent: number;
}
```

### Error Handling
```typescript
try {
  const results = await prisma.$queryRawUnsafe<any[]>(query);
  return jsonResponse({ success: true, data: results, total: results.length });
} catch (error: any) {
  console.error("Error fetching RO Performance Summary:", error);
  return NextResponse.json(
    { error: "Failed to fetch RO Performance Summary", details: error.message },
    { status: 500 }
  );
}
```

## Performance Optimization

### Current Optimizations
1. **Single Query**: All data fetched in one query (no N+1 problem)
2. **Database Aggregation**: Aggregation done in SQL, not application code
3. **Limit**: 10,000 row limit to prevent memory issues
4. **Indexes**: Relies on existing indexes on dealer_id, open_date

### Recommended Indexes
```sql
-- If not already present
CREATE INDEX idx_service_record_dealer_date ON service_record(dealer_id, open_date);
CREATE INDEX idx_operation_pay_type ON operation(pay_type);
CREATE INDEX idx_operation_warranty_eligible ON operation(is_warranty_eligible);
CREATE INDEX idx_labor_line_operation ON labor_line(operation_id);
CREATE INDEX idx_parts_line_operation ON parts_line(operation_id);
```

### Performance Monitoring
Monitor these metrics:
- API response time (target: < 2 seconds)
- Database query execution time
- Memory usage on client (large datasets)
- Grid rendering time

### Scaling Considerations
For dealerships with >10,000 ROs in typical date ranges:
1. Implement pagination
2. Move aggregation to server-side
3. Consider materialized views for common queries
4. Add caching layer (Redis)

## Security

### Authentication
- Uses `requireDealerAccess` middleware
- Validates dealer access before returning data
- JWT token required in Authorization header

### SQL Injection Prevention
- Uses parameterized queries via Prisma
- Manual escaping for dynamic SQL (dealer_id, dates)
```typescript
const escapedDealerId = dealerId.replace(/'/g, "''");
```

### Authorization
- Users can only access data for dealers they have access to
- Enforced by `requireDealerAccess` middleware

## Testing

### Unit Tests (Recommended)
```typescript
// Test metric calculations
describe('RO Performance Metrics', () => {
  it('should calculate Labor Rev/RO correctly', () => {
    const laborRevenue = 1000;
    const roCount = 5;
    expect(laborRevenue / roCount).toBe(200);
  });
  
  it('should calculate ELR correctly', () => {
    const laborRevenue = 1500;
    const laborHours = 10;
    expect(laborRevenue / laborHours).toBe(150);
  });
});
```

### Integration Tests (Recommended)
```typescript
describe('RO Performance API', () => {
  it('should return data for valid dealer', async () => {
    const response = await fetch('/api/reports/ro-performance-summary?dealerId=test123');
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
  
  it('should filter by date range', async () => {
    const response = await fetch('/api/reports/ro-performance-summary?dealerId=test123&startDate=2024-01-01&endDate=2024-12-31');
    const data = await response.json();
    // Verify all dates are within range
  });
});
```

## Troubleshooting

### Common Issues

**Issue**: No data returned
- Check filter parameters
- Verify dealer has data in date range
- Check database connectivity
- Review WHERE clause in logs

**Issue**: Slow performance
- Check database query execution plan
- Verify indexes exist
- Reduce date range
- Consider pagination

**Issue**: Incorrect aggregations
- Verify AG Grid aggFunc configuration
- Check valueGetter logic for calculated fields
- Review SQL aggregation logic

**Issue**: Grouping not working
- Verify AG Grid Enterprise license
- Check enableRowGroup on columns
- Ensure rowGroupPanelShow="always"

## Maintenance

### Updating Metrics
To add a new metric:
1. Add calculation to SQL query
2. Add field to TypeScript interface
3. Add column definition to AG Grid
4. Add aggregation function if needed
5. Update documentation

### Updating Filters
To add a new filter:
1. Add state variable in page component
2. Add UI control in filters section
3. Add query parameter to API call
4. Add WHERE clause logic in API route
5. Update documentation

### Updating Mileage Bands
To change mileage band ranges:
1. Update CASE statement in SQL query
2. Update documentation
3. Consider backward compatibility

## Dependencies

### Required Packages
```json
{
  "ag-grid-react": "^31.x.x",
  "ag-grid-community": "^31.x.x",
  "ag-grid-enterprise": "^31.x.x",
  "@prisma/client": "^5.x.x",
  "next": "^14.x.x",
  "react": "^18.x.x"
}
```

### AG Grid License
Requires AG Grid Enterprise license for:
- Row Grouping
- Excel Export
- Set Filters
- Column Tool Panel

## Future Improvements

### Short-term
1. Add loading skeleton
2. Add error boundary
3. Improve mobile responsiveness
4. Add keyboard shortcuts

### Medium-term
1. Server-side grouping/aggregation
2. Saved view configurations
3. Drill-down to operation details
4. Comparison views

### Long-term
1. Real-time updates
2. Custom metric builder
3. Advanced analytics/charts
4. Export to PDF with charts

---

**Last Updated**: December 9, 2025
**Version**: 1.0.0
**Maintainer**: TitanForecast Development Team





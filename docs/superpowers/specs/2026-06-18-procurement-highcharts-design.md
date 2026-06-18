# Procurement Highcharts Redesign

## Goal

Redesign only the "จัดซื้อจัดจ้าง" tab using Highcharts. Preserve the existing
`procurementData` source and all other dashboard tabs.

## Layout

Use the second reference image as the primary direction:

- A compact summary rail showing the current week range and total procurement.
- A large weekly procurement panel with a Highcharts donut chart.
- A large procurement-status panel with a Highcharts column chart.
- A compact data table below each chart so exact values remain easy to scan.
- On narrower screens, panels stack vertically without clipping chart labels.

The visual treatment should remain compatible with the existing EGAT dashboard:
light blue-gray page background, restrained tinted chart panels, dark navy text,
small radii, thin borders, and clear spacing. Avoid nested cards and decorative
effects that do not communicate data.

## Charts

### Weekly Procurement

- Render `procurementData.weeklyTotals` as a Highcharts donut.
- Use stable colors for W11-W14.
- Show week, count, and percentage in labels and tooltips.
- Show the total in the donut center.
- Render a one-row summary table beneath the chart with each week and the total.

### Procurement Status

- Render `procurementData.statusSummary` as a Highcharts column chart.
- Preserve the current status order and status colors.
- Show the count above each column.
- Keep zero-value statuses visible.
- Render a one-row summary table beneath the chart with each status and the total.

## Components

- Reuse `HighchartsBarChart.vue` as the chart renderer because it accepts generic
  Highcharts options.
- Define dedicated computed chart options in `pages/index.vue`.
- Remove the custom SVG donut path helpers and manual HTML status bars when they
  are no longer used.
- Keep changes scoped to the procurement report section and shared chart sizing
  needed for responsive rendering.

## Data And Empty States

- Read only from the existing normalized `procurementData`.
- Treat missing arrays as empty arrays and missing counts as zero.
- Avoid division by zero when calculating percentages.
- If there is no procurement data, retain a clear empty state rather than
  rendering a broken chart.

## Verification

- Add focused tests for chart option presence and removal of the legacy custom
  SVG/manual bar implementation.
- Run the production build.
- Validate the report tab in the in-app browser at desktop and mobile widths.
- Compare the rendered screen against the second reference image for hierarchy,
  chart proportions, table alignment, color balance, and responsive behavior.

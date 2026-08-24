## Problem to solve

The AnalyticsView charts (Bar for category breakdown, Line for monthly trend)
are functional but visually underdeveloped:

1. **No data labels on bars**: The bar chart shows colored bars but no amounts.
   Users must hover or read the tooltip to know exact values per category.
2. **No reference line**: The monthly trend line chart has no baseline, making
   it hard to see if amounts are above/below a threshold.
3. **Tooltip is minimal**: The tooltip shows data but no context (e.g.,
   "32% of total" or "vs. previous month").

Per the fintech-ui-2026 skill: "Data storytelling (not just visualization)" —
"Charts that tell a narrative about the user's money — not just display
numbers." The chart's job is to answer "where did my money go?" The current
chart requires the user to hover every bar to answer that question.

Per the research: "Click-to-filter — clicking a category bar filters the
transaction table." This feature already exists in `AnalyticsView.tsx`
(see `barChartOptions.onClick`), so it doesn't need reimplementation — but
it should be polished.

## Options

### Option 1: No chart enhancement (keep as-is)

Leave the charts with no data labels, no reference lines, basic tooltips.

- **How it feels**: Functional but requires hovering for data. The charts
  are "data display" not "data storytelling."
- **When it works**: When the table is the primary interface and the charts
  are just context.
- **Source**: Current state — no chart.js datalabels or annotation plugins
  are installed.

### Option 2: Add Chart.js Data Labels plugin

Install `chartjs-plugin-datalabels` and add value labels above each bar.
Optionally add a total label or percentage.

```bash
npm install chartjs-plugin-datalabels
```

```tsx
import { Chart as ChartJS, ..., plugins } from "chart.js"
import { Bar, Line } from "react-chartjs"
import { ChartJSDataLabels }

ChartJS.register(...DataLabels, ChartJSDataLabels)

const barChartData = {
  datasets: [{
    data: categoryData.map((c) => c.total),
    datalabels: {
      anchor: "end",
      align: "top",
      formatter: (value: number) => formatCurrency(value),
      color: "#e5e5e5",
      font: { family: "monospace", size: 10 },
    },
  }],
}
```

- **How it feels**: Each bar now shows its value — users can read the chart
  at a glance without hovering. This is the primary improvement.
- **When it works**: When screen real estate allows labels on every bar,
  and the data values fit in the bar width.
- **Source**: Chart.js Data Labels is the standard plugin for this.

### Option 3: Add reference line on the trend chart

Use `chartjs-plugin-annotation` to add a horizontal reference line on the
monthly trend chart — e.g., the average monthly spend:

```bash
npm install chartjs-plugin-annotation
```

```tsx
import Annotation, { LineAnnotation } from "chartjs-plugin-annotation"

ChartJS.register(Annotation)

const lineChartOptions = {
  ...chartOptions,
  plugins: {
    annotation: {
      annotations: {
        avgLine: {
          type: "line",
          yMin: avgMonthly,
          yMax: avgMonthly,
          borderColor: "#555",
          borderWidth: 1,
          borderDash: [4, 4],
        },
      },
    },
  },
}
```

- **How it feels**: The solid gold trend line is shown against a dashed
  gray reference line — users can immediately see which months are above/below
  average. This adds narrative context.
- **When it works**: When the average is a meaningful benchmark for the user.
- **Source**: Chart.js Annotation plugin is the standard for reference lines.

### Option 4: Enhanced tooltips with context

Add `external` tooltip rendering or enrich the built-in tooltip with
percentage-of-total and month-over-month change:

```tsx
tooltip: {
  callbacks: {
    label: (context) => {
      const total = context.dataset.data.reduce((a, b) => a + b, 0)
      const pct = (context.parsed.y / total * 100).toFixed(1)
      return `${formatCurrency(context.parsed.y)} (${pct}%)`
    },
  },
},
```

- **How it feels**: Tooltips now show both the raw value and the percentage.
  Users get more context when they do hover.
- **When it works**: When the chart has limited space for permanent labels
  but users still need rich context on hover.
- **Source**: Chart.js built-in callback system — no additional packages needed.

## Reasoning

**Option 2 (add Chart.js Data Labels plugin) is the best choice for the bar chart,
and Option 3 (reference line via Annotation plugin) for the line chart.**

### Why data labels on bars

1. **Data storytelling**: Per the fintech-ui-2026 skill, charts should
   "tell a narrative about the user's money — not just display numbers."
   Data labels on bars let users read the chart at a glance: "Food is
   ₹12,000, Transport is ₹8,500." No hovering required.

2. **Raw Aesthetics alignment**: Data labels in monospaced font, right-
   aligned above each bar, fit the "schematic" aesthetic. The label IS
   a data point, not decoration. Per the skill: "Every visual element
   serves a data or interaction purpose."

3. **Dark-mode-friendly**: `color: "#e5e5e5"` (text token) on the dark
   chart background. The label respects the theme.

4. **Minimal overhead**: The `chartjs-plugin-datalabels` package is small
   (~10KB) and well-maintained. It's the standard Chart.js plugin for
   this use case.

### Why reference line on the trend chart

1. **Narrative context**: A dashed reference line at the average monthly
   spend turns the trend chart from "here's the data" to "here's what
   matters: months above/below average." This is data storytelling.

2. **Monochrome reference**: The dashed gray line (#555 or text-secondary)
   at the average doesn't compete with the gold trend line. Per "Anti-
   Liquid Glass: subtle depth" — the reference line is a subtle structural
   aid, not a visual flourish.

3. **Annotation plugin**: `chartjs-plugin-annotation` is the standard
   Chart.js plugin for reference lines, bands, and labels. It's actively
   maintained and works with Chart.js 4.

### Implementation priorities

1. **Bar chart data labels first**: This is the highest-value enhancement.
   Users scan the "Spend by Category" chart first — showing values on
   each bar eliminates the need to hover.

2. **Line chart reference line second**: The monthly trend chart benefits
   from a reference line showing the average, but this is secondary to
   the bar chart labels.

3. **Tooltip enhancement is optional**: The tooltips already work. Adding
   percentage context is nice-to-have but not critical. Per "Spend your
   boldness in one place" — the signature visual enhancement is the data
   labels, not richer tooltips.

## Implementation

```tsx
// 1. Install dependencies

npm install chartjs-plugin-datalabels chartjs-plugin-annotation

// 2. Register plugins in AnalyticsView.tsx

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import { Bar, Line } from "react-chartjs"
import { ChartJSDataLabels } from "chartjs-plugin-datalabels"
import Annotation from "chartjs-plugin-annotation"

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartJSDataLabels,
  Annotation,
)

// 3. Add currency formatter (or import from a shared util)

const formatCurrencyCompact = (amount: number): string => {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`
  }
  return `₹${amount}`
}

// 4. Update bar chart data with datalabels config

const barChartData = {
  labels: categoryData.map((c) => c.category),
  datasets: [
    {
      label: "Total Amount",
      data: categoryData.map((c) => c.total),
      backgroundColor: barBgs,
      borderRadius: 0,
      borderWidth: 0,
      barThickness: 24,
      // Data labels above each bar
      datalabels: {
        anchor: "end",
        align: "top",
        formatter: (value: number) => formatCurrencyCompact(value),
        color: "#e5e5e5",           // text token
        font: { family: "monospace", size: 10 },
        offset: 4,
      },
    },
  ],
}

// 5. Add reference line to line chart

const avgMonthly = monthlyData.length > 0
  ? monthlyData.reduce((sum, m) => sum + m.total, 0) / monthlyData.length
  : 0

const lineChartOptions = {
  ...chartOptions,
  plugins: {
    ...chartOptions.plugins,
    annotation: {
      annotations: {
        avgLine: {
          type: "line",
          yMin: avgMonthly,
          yMax: avgMonthly,
          borderColor: "#555555",
          borderWidth: 1,
          borderDash: [4, 4],
          // Optional: add a label for the reference line
          label: {
            content: "Avg",
            enabled: true,
            position: "end",
            color: "#9a9a9a",
            font: { family: "monospace", size: 9 },
          },
        },
      },
    },
  },
}
```

- **No changes to theme.ts**: Uses existing color tokens via hex values
  that match the theme.

- **No changes to globals.css**: Plugins handle rendering.

- **Currency formatter**: A local helper that formats compactly (₹12.5K,
  ₹1.5L) to fit within narrow bars. Falls back to full amount for
  readability.

- **Reference line**: Dashed at average monthly spend, neutral gray.
  The gold trend line still dominates — the reference is a structural aid.

- **Data labels**: Render above each bar, monospaced, 10px font. The
  `offset: 4` adds 4px clearance above the bar. Labels auto-hide when
  bars are too narrow (the plugin handles this).

## Tradeoffs

- **Package bloat**: Adding two Chart.js plugins increases bundle size.
  `chartjs-plugin-datalabels` is ~10KB, `chartjs-plugin-annotation` is
  ~15KB. For a fintech dashboard, this is acceptable.

- **Mobile layout**: On small screens, data labels may overlap. The
  DataLabels plugin has an `overflow` option that can hide labels that
  don't fit. On mobile, we may disable datalabels and rely on tooltips.

- **Label precision**: The compact formatter (₹12.5K) loses precision.
  This is a tradeoff — exact values are in the tooltip. For financial
  contexts, some apps show full amounts. We use compact for scanability;
  users can hover for exact values.

- **Color token coupling**: The datalabels color (`#e5e5e5`) must match
  the theme's `text` token. If the theme changes, the datalabels color
  must be updated. Using a CSS variable would be more maintainable, but
  Chart.js datalabels don't read CSS variables by default — they need
  a function: `color: () => getComputedStyle(document.documentElement)
  .getPropertyValue('--text')`.

## Notes

- **Global plugin registration gotcha (found in verification)**: registering
  `ChartJSDataLabels` via `ChartJS.register(...)` enables it for EVERY chart.
  The monthly trend Line chart must explicitly set
  `plugins.datalabels: { display: false }` — otherwise a currency figure is
  drawn above every monthly point and the figures overflow the chart bounds.
- The existing click-to-filter on the bar chart already works (see
  `barChartOptions.onClick` in AnalyticsView.tsx). The data labels
  enhance visibility; the click interaction remains unchanged.
- Per the fintech-ui-2026 skill: "Calm is credibility." Data labels
  in monospaced font, positioned above bars, add information without
  visual noise. The reference line is a subtle structural aid, not a
  decorative element.
- The compact currency formatter should be shared between the bar chart
  datalabels and any tooltip formatting for consistency.
- Referenced in: `docs/table-and-website-visual-enhancement/intro.md`

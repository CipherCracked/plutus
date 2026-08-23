## Problem to solve

The spend analytics view must give users insight into their spending patterns through charts. At minimum, one chart (category breakdown or monthly trend) is required, with cross-filtering so clicking a chart element filters the transaction table. Two-way filtering (table filters also reshape charts) is a bonus. The chart library, interaction model, and which chart to prioritize all need early decisions.

## Options

### Option 1: Bar chart for category breakdown (primary), line chart for monthly trend (secondary)
Use a simple bar chart showing total spend per category as the primary view, with a line chart for monthly trend as secondary. Libraries: Recharts or Chart.js (both explicitly allowed).

- *How it feels:* Direct comparison of categories via bar length. Monthly trend via line shows direction over time. Clicking a bar filters the table to that category.
- *When it makes sense:* Categories are the most actionable dimension — users want to see "where did my money go" first. Monthly trend is a secondary lens for spotting seasonal patterns.

### Option 2: Pie/donut chart for category breakdown, bar chart for monthly trend
Use a pie chart for category breakdown (each slice = one category), and a bar chart for monthly trend.

- *How it feels:* Pie charts are intuitive for "what portion" questions but harder to read precisely compared to bars. Donut charts with labels are a common middle ground.
- *When it makes sense:* When there are few categories (5–7) and the primary question is proportion. With many small categories, pie slices become unreadable.

### Option 3: Single combined view — stacked area chart for monthly trend by category
One chart showing monthly spending over time, with each category as a stacked area. Click a category in the legend to filter.

- *How it feels:* Shows both time trend and category composition simultaneously. Dense but information-rich.
- *When it makes sense:* When the user's primary question is "how has my spending by category changed over time." Less useful for exact category comparison.

## Reasoning

The assignment says "at minimum, clicking a slice of a chart should filter the transaction table" — implying a pie/donut chart is the expected default ("slice" is pie terminology). However, bar charts are generally superior for accurate value comparison, and Recharts/Chart.js both handle them well.

For the **foundation decision**:

- **Category bar chart as primary** is recommended. It's more readable than pie for >5 categories, sorts naturally by amount, and clicking a bar to filter the table is a clean interaction.
- **Monthly trend line chart as secondary** provides the time dimension. A line chart is the standard choice for trend-over-time visualization.
- Both charts should support click-to-filter: clicking a bar/slice in the category chart filters the table to that category; clicking a point or area in the trend chart could filter to that month.

The **cross-filtering architecture** needs to be decided as part of the foundation:

- **One-way (chart → table)**: Clicking a chart element updates the table's filter state. Easier to implement.
- **Two-way (chart ↔ table)**: When the user filters the table by category, the chart re-renders to show only the filtered subset. Requires shared state (React context or a state management approach).

Given the 70–75% frontend time budget, starting with **one-way chart-to-table filtering** is the pragmatic foundation. Two-way becomes a documented enhancement.

## Tradeoffs

- **Pie chart**: Visually familiar, matches the assignment's "slice" language, but poor for >7 categories and imprecise for value comparison.
- **Bar chart**: Better data density and precision, but less immediately intuitive for "proportion" questions.
- **One-way filtering**: Simpler state model, less code, but feels less integrated.
- **Two-way filtering**: More satisfying UX, but requires careful state management and re-rendering logic that could add complexity.

## Notes

Library choice (Recharts vs Chart.js vs D3) is likely an **ITD** decision, as it affects bundle size, learning curve, and customization freedom. For the foundation, the chart *type* and *interaction model* are the IPD-level concerns.

This decision is coupled with the **transaction table UX** — both need to agree on how filter state is shared (e.g., a shared `FilterContext` or similar).

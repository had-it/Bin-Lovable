

# PharmWaste Dashboard — MVP Plan

## Overview
Build a professional, clinical dashboard for visualizing pharmaceutical waste data using realistic seed data. Single admin view, no backend, desktop-first.

---

## 1. Seed Data Layer
Create a mock data module with:
- 3 hospitals, 5 departments each (e.g., Oncology, ICU, Surgery, Pediatrics, Emergency)
- 20+ drugs with realistic names and unit costs
- ~200 waste events spanning 6 months with fields: date, drug, department, hospital, volume, cost, disposal reason
- Disposal reasons: Expired, Contaminated, Patient Refusal, Preparation Surplus, Damaged

## 2. Dashboard Page
Replace the current Index page with a full analytics dashboard:

### KPI Cards Row
Four summary cards at the top:
- Total Wasted Volume (mL/units)
- Total Estimated Cost (€/currency)
- Number of Waste Events
- Most Wasted Drug

### Charts Section
- **Time Trend Chart** — Area/line chart showing waste volume over time with a daily/weekly/monthly toggle
- **Department Breakdown** — Bar chart comparing waste across departments
- **Top Drugs** — Horizontal bar chart of the top 10 most wasted drugs by volume or cost
- **Disposal Reasons** — Donut/pie chart of waste reasons

### Filters
- Dropdowns for: Hospital, Department, Drug
- Date range picker for time filtering
- All filters dynamically update KPIs and charts
- "Clear filters" reset button

## 3. Layout Shell
- **Header**: Placeholder company logo (left), "PharmWaste" platform name (right), admin user avatar
- **Sidebar**: Minimal navigation with Dashboard active, plus placeholder links for "Waste Events" and "Settings" (non-functional)
- Collapsible sidebar with icons in mini mode

## 4. Design
- White/light gray backgrounds, navy blue primary accents
- Soft muted chart colors (accessible palette)
- Clean sans-serif typography with clear hierarchy
- Cards with subtle shadows and rounded corners
- Professional, clinical healthcare aesthetic


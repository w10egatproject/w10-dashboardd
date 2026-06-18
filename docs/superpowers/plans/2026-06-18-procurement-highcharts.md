# Procurement Highcharts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the custom procurement donut and manual status bars with a polished, responsive Highcharts dashboard based on the approved second reference image.

**Architecture:** Keep the existing `procurementData` API contract and generic `HighchartsBarChart` renderer. Add computed Highcharts options and small presentation helpers in `pages/index.vue`, then replace only the procurement summary markup while preserving the project list below it.

**Tech Stack:** Nuxt 4, Vue 3 Composition API, TypeScript, Tailwind CSS, Highcharts 13, Node test runner

---

## File Map

- Modify `pages/index.vue`: procurement data helpers, Highcharts options, responsive procurement layout, exact-value tables, and empty state.
- Modify `components/HighchartsBarChart.vue`: allow chart-specific minimum height without duplicating chart components.
- Create `tests/procurement-highcharts.test.cjs`: regression checks for both Highcharts configurations and removal of the legacy SVG/manual bars.

### Task 1: Add A Failing Procurement Chart Regression Test

**Files:**
- Create: `tests/procurement-highcharts.test.cjs`
- Test: `tests/procurement-highcharts.test.cjs`

- [ ] **Step 1: Write the failing test**

```js
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('pages/index.vue', 'utf8');

assert.match(source, /procurementWeeklyChartOptions/);
assert.match(source, /procurementStatusChartOptions/);
assert.match(source, /type:\s*'pie'/);
assert.match(source, /innerSize:\s*'58%'/);
assert.match(source, /type:\s*'column'/);
assert.match(source, /currentProcurementTotal/);
assert.doesNotMatch(source, /getDonutPath/);
assert.doesNotMatch(source, /getLabelPosition/);
assert.doesNotMatch(source, /SVG Donut Chart/);
assert.doesNotMatch(source, /height:\s*`\$\{\(item\.count/);
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
node --test tests\procurement-highcharts.test.cjs
```

Expected: FAIL because `procurementWeeklyChartOptions` and `procurementStatusChartOptions` do not exist.

- [ ] **Step 3: Commit the test**

```powershell
git add tests/procurement-highcharts.test.cjs
git commit -m "test: define procurement Highcharts redesign"
```

### Task 2: Add Responsive Highcharts Options

**Files:**
- Modify: `pages/index.vue` near the existing `equipmentChartOptions`
- Test: `tests/procurement-highcharts.test.cjs`

- [ ] **Step 1: Add normalized procurement computed values**

```ts
const procurementWeeklyTotals = computed(() => data.value?.procurementData.weeklyTotals || []);
const procurementStatusSummary = computed(() => data.value?.procurementData.statusSummary || []);
const currentProcurementTotal = computed(() =>
  data.value?.procurementData.totalProcurement ||
  procurementWeeklyTotals.value.reduce((sum, item) => sum + item.amount, 0)
);
const procurementStatusTotal = computed(() =>
  procurementStatusSummary.value.reduce((sum, item) => sum + item.count, 0)
);
```

- [ ] **Step 2: Add stable chart colors**

```ts
const procurementWeekColors = ['#f8dc75', '#f7b56a', '#75c8ef', '#7eb2ee'];
const procurementStatusColors = [
  '#f2c94c', '#f2994a', '#56a8e8', '#65d68a',
  '#a991ee', '#e78ac3', '#45c7d8', '#f58f96',
];
```

- [ ] **Step 3: Add weekly donut options**

Create `procurementWeeklyChartOptions` with:

```ts
const procurementWeeklyChartOptions = computed((): Highcharts.Options => ({
  accessibility: { enabled: false },
  chart: {
    type: 'pie',
    height: 300,
    backgroundColor: 'transparent',
    spacing: [8, 8, 8, 8],
  },
  title: {
    text: currentProcurementTotal.value.toLocaleString('th-TH'),
    align: 'center',
    verticalAlign: 'middle',
    y: 18,
    style: { color: '#0f172a', fontSize: '28px', fontWeight: '800' },
  },
  subtitle: {
    text: 'รวมทั้งหมด',
    align: 'center',
    verticalAlign: 'middle',
    y: 42,
    style: { color: '#64748b', fontSize: '11px', fontWeight: '700' },
  },
  credits: { enabled: false },
  tooltip: {
    pointFormat: '<b>{point.y}</b> รายการ ({point.percentage:.1f}%)',
  },
  plotOptions: {
    pie: {
      innerSize: '58%',
      borderWidth: 3,
      borderColor: '#e8f4fb',
      dataLabels: {
        enabled: true,
        distance: 18,
        connectorWidth: 1,
        format: '<b>{point.name}</b>: {point.percentage:.0f}%',
        style: { color: '#334155', fontSize: '10px', fontWeight: '700', textOutline: 'none' },
      },
    },
  },
  series: [{
    type: 'pie',
    name: 'ปริมาณจัดซื้อจัดจ้าง',
    data: procurementWeeklyTotals.value.map((item, index) => ({
      name: item.week,
      y: item.amount,
      color: procurementWeekColors[index % procurementWeekColors.length],
    })),
  }],
}));
```

- [ ] **Step 4: Add status column options**

Create `procurementStatusChartOptions` using the original status order:

```ts
const procurementStatusChartOptions = computed((): Highcharts.Options => ({
  accessibility: { enabled: false },
  chart: { type: 'column', height: 300, backgroundColor: 'transparent', spacing: [12, 8, 4, 8] },
  title: { text: '' },
  credits: { enabled: false },
  legend: { enabled: false },
  xAxis: {
    categories: procurementStatusSummary.value.map(item => item.status),
    lineColor: '#cbd5e1',
    tickLength: 0,
    labels: {
      rotation: -24,
      style: { color: '#475569', fontSize: '9px', fontWeight: '700' },
    },
  },
  yAxis: {
    min: 0,
    allowDecimals: false,
    title: { text: '' },
    gridLineColor: '#d7e3ef',
    labels: { style: { color: '#64748b', fontSize: '9px' } },
  },
  tooltip: { pointFormat: '<b>{point.y}</b> รายการ' },
  plotOptions: {
    column: {
      borderWidth: 0,
      borderRadius: 3,
      maxPointWidth: 42,
      dataLabels: {
        enabled: true,
        style: { color: '#1e293b', fontSize: '11px', fontWeight: '800', textOutline: 'none' },
      },
    },
  },
  series: [{
    type: 'column',
    name: 'สถานะ',
    data: procurementStatusSummary.value.map((item, index) => ({
      y: item.count,
      color: procurementStatusColors[index % procurementStatusColors.length],
    })),
  }],
}));
```

- [ ] **Step 5: Remove obsolete helpers**

Delete `getProcurementColor`, `getStatusColor`, `getDonutPath`, and `getLabelPosition` after the new template no longer references them.

- [ ] **Step 6: Run the regression test**

Run:

```powershell
node --test tests\procurement-highcharts.test.cjs
```

Expected: the chart-option checks pass; legacy-markup checks may still fail until Task 3.

### Task 3: Replace The Procurement Summary UI

**Files:**
- Modify: `pages/index.vue` inside `activeTab === 'report'`
- Modify: `components/HighchartsBarChart.vue`
- Test: `tests/procurement-highcharts.test.cjs`

- [ ] **Step 1: Allow chart height overrides**

Update the renderer:

```vue
<template>
  <div
    ref="chartContainer"
    class="w-full h-full"
    :style="{ minHeight: `${minHeight}px` }"
  ></div>
</template>
```

```ts
const props = withDefaults(defineProps<{
  options: Highcharts.Options;
  minHeight?: number;
}>(), {
  minHeight: 250,
});
```

- [ ] **Step 2: Build the approved responsive summary grid**

Replace the current top donut and two summary cards with:

```vue
<div
  v-if="procurementWeeklyTotals.length || procurementStatusSummary.length"
  class="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)]"
>
  <aside class="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
    <section class="rounded-xl border border-amber-200 bg-amber-50 p-5">
      <p class="text-xs font-black text-slate-600">
        {{ procurementWeeklyTotals[0]?.week || 'สัปดาห์' }}
        -
        {{ procurementWeeklyTotals[procurementWeeklyTotals.length - 1]?.week || 'ล่าสุด' }}
      </p>
      <p class="mt-6 text-center text-5xl font-black text-slate-800">
        {{ currentProcurementTotal }}
      </p>
      <p class="mt-2 text-center text-xs font-bold text-slate-500">รายการทั้งหมด</p>
    </section>

    <section class="rounded-xl border border-slate-200 bg-white p-5">
      <p class="text-xs font-black text-slate-600">สถานะที่ดำเนินการแล้ว</p>
      <p class="mt-4 text-3xl font-black text-emerald-600">
        {{ procurementStatusTotal }}
      </p>
      <p class="mt-1 text-xs font-bold text-slate-500">รวมทุกสถานะ</p>
    </section>
  </aside>

  <section class="rounded-xl border border-sky-200 bg-sky-50/70 p-5">
    <h2 class="text-xl font-black text-slate-950">ปริมาณการซื้อ/จ้างหมวด</h2>
    <HighchartsBarChart :options="procurementWeeklyChartOptions" :min-height="300" />
    <!-- exact-value table -->
  </section>

  <section class="rounded-xl border border-indigo-200 bg-indigo-50/60 p-5">
    <h2 class="text-xl font-black text-slate-950">สถานะการซื้อจ้าง</h2>
    <HighchartsBarChart :options="procurementStatusChartOptions" :min-height="300" />
    <!-- exact-value table -->
  </section>
</div>
```

The completed markup must include semantic tables beneath both charts, horizontally scrollable on small screens, with `scope="col"` headers and a final total column.

- [ ] **Step 3: Add the procurement empty state**

```vue
<div
  v-else
  class="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center text-sm font-bold text-slate-500"
>
  ไม่พบข้อมูลจัดซื้อจัดจ้าง
</div>
```

- [ ] **Step 4: Run the regression test and verify GREEN**

Run:

```powershell
node --test tests\procurement-highcharts.test.cjs
```

Expected: PASS with zero failures.

- [ ] **Step 5: Commit the implementation**

```powershell
git add pages/index.vue components/HighchartsBarChart.vue tests/procurement-highcharts.test.cjs
git commit -m "feat: redesign procurement report with Highcharts"
```

### Task 4: Build And Browser QA

**Files:**
- Verify: `pages/index.vue`
- Verify: `components/HighchartsBarChart.vue`

- [ ] **Step 1: Run all focused tests**

```powershell
node --test tests\employee-sheet-fallback.test.cjs tests\procurement-highcharts.test.cjs
```

Expected: 2 tests pass, 0 fail.

- [ ] **Step 2: Run the production build**

```powershell
npm.cmd run build
```

Expected: exit code 0. Existing bundle-size and sourcemap warnings are acceptable; no compilation errors.

- [ ] **Step 3: Start the local app**

```powershell
npm.cmd run dev
```

Expected: Nuxt reports a local URL such as `http://127.0.0.1:3000`.

- [ ] **Step 4: Verify desktop in the in-app browser**

Test flow:

```text
app loads -> click "จัดซื้อจัดจ้าง" -> donut and status column chart render ->
weekly and status tables show exact values -> project list remains below
```

Check page identity, nonblank DOM, console errors, chart SVG presence, labels, table values, and a screenshot at approximately 1440x900.

- [ ] **Step 5: Verify mobile layout**

Set an approximately 390x844 viewport, reload, and verify:

- Summary panels stack without overlap.
- Charts remain visible and labels are not clipped.
- Exact-value tables scroll horizontally inside their own sections.
- The page has no unintended horizontal overflow.

- [ ] **Step 6: Compare implementation with the approved reference**

Use `view_image` on:

- `C:\Users\MMM-user\AppData\Local\Temp\codex-clipboard-0b1209cc-f5f0-4e28-8b1e-18c84814acc2.png`
- The latest desktop browser screenshot.

Inspect hierarchy, panel proportions, donut size, status-column spacing, table alignment, restrained color balance, typography, and mobile collapse. Fix visible mismatches before completion.

- [ ] **Step 7: Commit QA refinements**

```powershell
git add pages/index.vue components/HighchartsBarChart.vue tests/procurement-highcharts.test.cjs
git commit -m "fix: polish responsive procurement charts"
```

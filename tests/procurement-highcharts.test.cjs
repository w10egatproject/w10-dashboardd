const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('pages/index.vue', 'utf8');

assert.match(source, /procurementWeeklyChartOptions/);
assert.match(source, /procurementStatusChartOptions/);
assert.match(source, /type:\s*'pie'/);
assert.match(source, /innerSize:\s*'58%'/);
assert.match(source, /type:\s*'column'/);
assert.match(source, /currentProcurementTotal/);
assert.match(source, /ไม่พบข้อมูลจัดซื้อจัดจ้าง/);
assert.doesNotMatch(source, /getDonutPath/);
assert.doesNotMatch(source, /getLabelPosition/);
assert.doesNotMatch(source, /SVG Donut Chart/);
assert.doesNotMatch(source, /height:\s*`\$\{\(item\.count/);

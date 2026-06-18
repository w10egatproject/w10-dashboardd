const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(
  new URL('../server/utils/googleSheet.ts', `file://${__filename.replace(/\\/g, '/')}`),
  'utf8',
);
const declaration = source.match(
  /const OT_EMPLOYEE_SPREADSHEET_ID = (.+);/,
);

assert.ok(declaration, 'employee spreadsheet configuration must exist');

const employeeSheetId = vm.runInNewContext(declaration[1], {
  process: { env: {} },
});

assert.equal(
  employeeSheetId,
  '1__JtmwYd3xmL6XL-VkEU1E53NyaySwcT7dQY3OQ4aCA',
  'production must retain the employee OT sheet when the optional env variable is absent',
);

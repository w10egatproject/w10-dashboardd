type SheetRows = string[][];

const weeks = ['W11', 'W12', 'W13', 'W14'] as const;

function text(value: unknown) {
  return String(value ?? '').trim();
}

function numberAt(rows: SheetRows, rowIndex: number, columnIndex: number) {
  const value = rows[rowIndex]?.[columnIndex];
  if (!value) return 0;
  return parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0;
}

function isTrue(value: unknown) {
  return text(value).toUpperCase() === 'TRUE';
}

function projectFromRow(row: string[], index: number, source = 'Main') {
  return {
    id: text(row[3]) || text(row[0]) || `${source}-${index}`,
    item: text(row[0]),
    sequence: text(row[1]),
    ecm: text(row[2]) || '-',
    order: text(row[3]) || '-',
    name: text(row[4]) || '-',
    description: text(row[4]) || '-',
    equipGroup: text(row[5]) || 'General',
    date: text(row[6]) || '-',
    department: text(row[8]) || 'N/A',
    status: text(row[11]) || 'รอดำเนินการ',
    sheetSource: source,
  };
}

function buildProjects(infoRows: SheetRows) {
  const tableRows = infoRows.slice(11);
  const projects = tableRows
    .filter(row => text(row[2]) || text(row[3]) || text(row[4]))
    .map((row, index) => projectFromRow(row, index));

  const weeklyProjects = {
    W11: tableRows.filter(row => isTrue(row[12])).map((row, index) => projectFromRow(row, index, 'W11')),
    W12: tableRows.filter(row => isTrue(row[13])).map((row, index) => projectFromRow(row, index, 'W12')),
    W13: tableRows.filter(row => isTrue(row[14])).map((row, index) => projectFromRow(row, index, 'W13')),
    W14: tableRows.filter(row => isTrue(row[15])).map((row, index) => projectFromRow(row, index, 'W14')),
  };

  return { projects, weeklyProjects };
}

function buildGroupStats(infoRows: SheetRows) {
  const groupStats = {
    W11: { entrance: numberAt(infoRows, 0, 23), left: numberAt(infoRows, 1, 23), finish: numberAt(infoRows, 2, 23), otherFinish: numberAt(infoRows, 3, 23), out: numberAt(infoRows, 4, 23) },
    W12: { entrance: numberAt(infoRows, 0, 27), left: numberAt(infoRows, 1, 27), finish: numberAt(infoRows, 2, 27), otherFinish: numberAt(infoRows, 3, 27), out: numberAt(infoRows, 4, 27) },
    W13: { entrance: numberAt(infoRows, 0, 31), left: numberAt(infoRows, 1, 31), finish: numberAt(infoRows, 2, 31), otherFinish: numberAt(infoRows, 3, 31), out: numberAt(infoRows, 4, 31) },
    W14: { entrance: numberAt(infoRows, 0, 35), left: numberAt(infoRows, 1, 35), finish: numberAt(infoRows, 2, 35), otherFinish: numberAt(infoRows, 3, 35), out: numberAt(infoRows, 4, 35) },
  };

  return {
    ...groupStats,
    W_all: weeks.reduce((total, week) => ({
      entrance: total.entrance + groupStats[week].entrance,
      left: total.left + groupStats[week].left,
      finish: total.finish + groupStats[week].finish,
      otherFinish: total.otherFinish + groupStats[week].otherFinish,
      out: total.out + groupStats[week].out,
    }), { entrance: 0, left: 0, finish: 0, otherFinish: 0, out: 0 }),
  };
}

function buildEquipmentData(infoRows: SheetRows) {
  return Array.from({ length: 7 }, (_, index) => {
    const rowIndex = index + 1;
    return {
      name: text(infoRows[rowIndex]?.[5]),
      values: [
        numberAt(infoRows, rowIndex, 12),
        numberAt(infoRows, rowIndex, 13),
        numberAt(infoRows, rowIndex, 14),
        numberAt(infoRows, rowIndex, 15),
      ],
      total: numberAt(infoRows, rowIndex, 16),
    };
  }).filter(item => item.name);
}

function buildStatusData(infoRows: SheetRows) {
  const sap = numberAt(infoRows, 5, 11);
  const pending = numberAt(infoRows, 6, 11);
  const finish = numberAt(infoRows, 7, 11);
  const totalWorkOrders = numberAt(infoRows, 7, 16);
  return { sap, pending, finish, total: sap + pending + finish, totalWorkOrders };
}

function buildWGauges(infoRows: SheetRows) {
  return {
    W11: { empNorm: numberAt(infoRows, 1, 81), conNorm: numberAt(infoRows, 1, 82), empOT: numberAt(infoRows, 2, 81), conOT: numberAt(infoRows, 2, 82) },
    W12: { empNorm: numberAt(infoRows, 5, 81), conNorm: numberAt(infoRows, 5, 82), empOT: numberAt(infoRows, 6, 81), conOT: numberAt(infoRows, 6, 82) },
    W13: { empNorm: numberAt(infoRows, 7, 81), conNorm: numberAt(infoRows, 7, 82), empOT: numberAt(infoRows, 8, 81), conOT: numberAt(infoRows, 8, 82) },
    W14: { empNorm: numberAt(infoRows, 9, 81), conNorm: numberAt(infoRows, 9, 82), empOT: numberAt(infoRows, 10, 81), conOT: numberAt(infoRows, 10, 82) },
  };
}

export function normalizeDashboard(rawSheets: { dashboard: SheetRows; info: SheetRows }, filters: { year?: string; month?: string } = {}) {
  const infoRows = rawSheets.info || [];
  const { projects, weeklyProjects } = buildProjects(infoRows);
  const groupStats = buildGroupStats(infoRows);
  const statusData = buildStatusData(infoRows);
  const sheetYearRaw = text(infoRows[1]?.[2]) || '2025';
  const sheetMonthRaw = text(infoRows[2]?.[2]) || 'all';

  return {
    raw: rawSheets,
    projects,
    weeklyData: weeks.map(week => ({ week, ...groupStats[week] })),
    weeklyProjects,
    statusSummary: { total: { entrance: groupStats.W_all.entrance } },
    groupStats,
    wGauges: buildWGauges(infoRows),
    w_all: { entrance: groupStats.W_all.entrance },
    statusData,
    equipmentData: buildEquipmentData(infoRows),
    currentYear: filters.year || (sheetYearRaw === 'All' ? 'all' : sheetYearRaw),
    currentMonth: filters.month || (sheetMonthRaw === 'รวมทุกเดือน' ? 'all' : sheetMonthRaw),
    debugInfo: {
      dashboardRows: rawSheets.dashboard?.length || 0,
      infoRows: infoRows.length,
    },
    timestamp: new Date().toISOString(),
  };
}

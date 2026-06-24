type SheetRows = string[][];

const weeks = ['W11', 'W12', 'W13', 'W14'] as const;

function text(value: unknown) {
  return String(value ?? '').trim();
}

function normalizePersonName(value: unknown) {
  return text(value).replace(/\s+/g, '').toLowerCase();
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
    detailItem: text(row[0]) || '-',
    ecmProcurement: text(row[2]),
    ecm: text(row[2]),
    order: text(row[3]) || '-',
    name: text(row[4]) || '-',
    equipGroup: text(row[5]) || 'General',
    date: text(row[6]) || '-',
    startDate: text(row[28]) || '-',
    endDate: text(row[29]) || '-',
    status: text(row[11]) || 'รอดำเนินการ',
    action: text(row[21]) || '-',
    department: text(row[8]) || 'N/A',
    normal11: text(row[22]) || '-',
    ot: text(row[23]) || '-',
    contractorNormal11: text(row[24]) || '-',
    contractorOt11: text(row[25]) || '-',
    weekFlags: {
      W11: isTrue(row[12]),
      W12: isTrue(row[13]),
      W13: isTrue(row[14]),
      W14: isTrue(row[15]),
    },
  };
}

function procurementProjectFromDetailRow(row: string[], index: number) {
  const detailItem = text(row[0]);
  const ecmProcurement = text(row[1]);
  const ecm = text(row[1]);
  const order = text(row[2]);

  return {
    id: `${ecmProcurement || order || detailItem || 'PROC'}-${index}`,
    detailItem: detailItem || '-',
    ecmProcurement: ecmProcurement || '-',
    ecm: ecm || '-',
    order: order || '-',
    name: text(row[3]) || '-',
    equipGroup: text(row[4]) || '-',
    date: text(row[5]) || '-',
    startDate: text(row[6]) || '-',
    endDate: text(row[7]) || '-',
    status: text(row[8]) || '-',
    action: text(row[17]) || '-',
    department: 'Procurement',
    normal11: text(row[9]) || '-',
    ot: text(row[10]) || '-',
    contractorNormal11: text(row[11]) || '-',
    contractorOt11: text(row[12]) || '-',
    weekFlags: {
      W11: isTrue(row[13]),
      W12: isTrue(row[14]),
      W13: isTrue(row[15]),
      W14: isTrue(row[16]),
    },
  };
}

function procurementProjectFromDashboardRow(row: string[], index: number) {
  const ecmProcurement = text(row[5]);
  const ecm = text(row[6]);
  const order = text(row[7]);

  return {
    id: `PROC-REPORT-${ecmProcurement || ecm || order || index}-${index}`,
    detailItem: ecmProcurement || '-',
    ecmProcurement: ecmProcurement || '-',
    ecm: ecm || '-',
    order: order || '-',
    name: text(row[8]) || '-',
    equipGroup: text(row[9]) || '-',
    date: text(row[10]) || '-',
    startDate: text(row[11]) || '-',
    endDate: text(row[12]) || '-',
    status: text(row[13]) || '-',
    action: text(row[14]) || '-',
    department: 'Procurement',
    normal11: '-',
    ot: '-',
    contractorNormal11: '-',
    contractorOt11: '-',
    weekFlags: {
      W11: false,
      W12: false,
      W13: false,
      W14: false,
    },
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

function buildProcurementProjects(procurementRows: SheetRows) {
  return procurementRows
    .filter(row => [1, 2, 3, 4, 5, 6, 7, 8, 17].some(columnIndex => text(row[columnIndex])))
    .filter(row => !['ecm', 'w/o', 'order'].includes(text(row[2]).toLowerCase()))
    .filter(row => !['ecm ซื้อจ้าง', 'ecm'].includes(text(row[1]).toLowerCase()))
    .map((row, index) => procurementProjectFromDetailRow(row, index));
}

function buildProcurementReportProjects(dashboardRows: SheetRows) {
  return dashboardRows
    .slice(31)
    .filter(row => [5, 6, 7, 8, 9, 10, 11, 12, 13, 14].some(columnIndex => text(row[columnIndex])))
    .filter(row => !['ecmซื้อจ้าง', 'ecm'].includes(text(row[5]).toLowerCase()))
    .filter(row => !['ecm', 'w/o'].includes(text(row[6]).toLowerCase()))
    .map((row, index) => procurementProjectFromDashboardRow(row, index));
}

function buildGroupStats(infoRows: SheetRows, weeklyProjects: Record<string, any[]>) {
  const buildWeeklyStat = (columnIndex: number) => {
    const entrance = numberAt(infoRows, 0, columnIndex);
    const left = numberAt(infoRows, 1, columnIndex);
    const sheetFinish = numberAt(infoRows, 2, columnIndex);
    const otherFinish = numberAt(infoRows, 3, columnIndex);
    const finish = sheetFinish || Math.max(entrance - left, 0);
    const sheetOut = numberAt(infoRows, 4, columnIndex);
    const out = sheetOut || (finish + otherFinish);

    return { entrance, left, finish, otherFinish, out };
  };

  const groupStats = {
    W11: buildWeeklyStat(23),
    W12: buildWeeklyStat(27),
    W13: buildWeeklyStat(31),
    W14: buildWeeklyStat(35),
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

function buildOTSummary(otRows: SheetRows) {
  const headerRow = otRows[2] || [];
  const days = Array.from({ length: 31 }, (_, index) => text(headerRow[index + 4]) || String(index + 1));
  const summaryHeaders = {
    holidayHours: text(headerRow[35]) || 'ชม.วันหยุด',
    totalOnePointFiveHours: text(headerRow[36]) || 'รวมชม1.5',
    oneTimesAmount: text(otRows[1]?.[37]) || '1เท่า',
    onePointFiveAmount: text(otRows[1]?.[38]) || '1.5เท่า',
    totalPay: text(otRows[1]?.[39]) || 'ยอดจ่าย',
    threeTimesAmount: text(otRows[1]?.[40]) || '3เท่า',
  };

  const rateLabels = {
    oneTimes: text(headerRow[37]),
    onePointFive: text(headerRow[38]),
    totalPay: text(headerRow[39]),
    threeTimes: text(headerRow[40]),
  };

  const bodyRows = otRows.slice(3);
  const totalRow = bodyRows.find(row => text(row[34]).includes('ยอดรวมสุทธิ'));
  const rows = bodyRows
    .filter(row => text(row[1]) && text(row[2]) && text(row[3]))
    .filter(row => !text(row[34]).includes('ยอดรวมสุทธิ'))
    .map((row, index) => ({
      id: `${text(row[2]) || 'OT'}-${text(row[1]) || index}-${text(row[3]) || index}`,
      sequence: text(row[1]),
      group: text(row[2]),
      name: text(row[3]),
      days: days.map((_, dayIndex) => text(row[dayIndex + 4]) || '-'),
      holidayHours: text(row[35]) || '0.00',
      totalOnePointFiveHours: text(row[36]) || '0.00',
      oneTimesAmount: text(row[37]) || '0.00',
      onePointFiveAmount: text(row[38]) || '0.00',
      totalPay: text(row[39]) || '0.00',
      threeTimesAmount: text(row[40]) || '0.00',
    }));

  return {
    title: text(otRows[1]?.[2]) || 'ตารางสรุป OT',
    days,
    summaryHeaders,
    rateLabels,
    rows,
    totals: totalRow ? {
      label: text(totalRow[34]) || 'ยอดรวมสุทธิ',
      holidayHours: text(totalRow[35]) || '0.00',
      totalOnePointFiveHours: text(totalRow[36]) || '0.00',
      oneTimesAmount: text(totalRow[37]) || '0.00',
      onePointFiveAmount: text(totalRow[38]) || '0.00',
      totalPay: text(totalRow[39]) || '0.00',
      threeTimesAmount: text(totalRow[40]) || '0.00',
    } : null,
  };
}

function employeeGroupFromIndex(index: number) {
  if (index < 6) return 'W11';
  if (index < 10) return 'W12';
  if (index < 13) return 'W13';
  return 'W14';
}

function compactNumberText(value: unknown) {
  const raw = text(value);
  return raw.replace(/\.0$/, '') || '-';
}

function buildEmployeeOTSummary(otRows: SheetRows) {
  const headerRow = otRows[2] || [];
  const days = Array.from({ length: 31 }, (_, index) => text(headerRow[index + 5]) || String(index + 1));
  const bodyRows = otRows.slice(3).filter(row => text(row[1]) && text(row[2]) && text(row[3]));

  const rows = bodyRows.map((row, index) => {
    const regularTotal = compactNumberText(row[36]);
    const threeTimesTotal = compactNumberText(row[37]);

    return {
      id: `EMP-OT-${text(row[2]) || index}-${text(row[3]) || index}`,
      sequence: text(row[1]),
      group: employeeGroupFromIndex(index),
      employeeId: text(row[2]),
      name: text(row[3]),
      position: text(row[4]),
      days: days.map((_, dayIndex) => compactNumberText(row[dayIndex + 5])),
      holidayHours: regularTotal,
      totalOnePointFiveHours: threeTimesTotal,
      oneTimesAmount: '0',
      onePointFiveAmount: '0',
      totalPay: regularTotal,
      threeTimesAmount: threeTimesTotal,
      regularTotal,
      threeTimesTotal,
    };
  });

  const regularTotal = rows.reduce((sum, row) => sum + numericText(row.regularTotal), 0);
  const threeTimesTotal = rows.reduce((sum, row) => sum + numericText(row.threeTimesTotal), 0);

  return {
    title: text(otRows[1]?.[2]) || 'ตารางสรุป OT พนักงาน',
    days,
    summaryHeaders: {
      holidayHours: 'รวม',
      totalOnePointFiveHours: 'รวมx3',
      oneTimesAmount: '1เท่า',
      onePointFiveAmount: '1.5เท่า',
      totalPay: 'ยอดจ่าย',
      threeTimesAmount: '3เท่า',
    },
    rateLabels: {
      oneTimes: '',
      onePointFive: '',
      totalPay: 'รวม',
      threeTimes: 'รวมx3',
    },
    rows,
    totals: {
      label: 'ยอดรวมสุทธิ',
      holidayHours: String(regularTotal),
      totalOnePointFiveHours: String(threeTimesTotal),
      oneTimesAmount: '0',
      onePointFiveAmount: '0',
      totalPay: String(regularTotal),
      threeTimesAmount: String(threeTimesTotal),
    },
  };
}

function numericText(value: unknown) {
  return parseFloat(String(value ?? '').replace(/,/g, '')) || 0;
}

function buildEmployeeOTCheckError(checkRows: SheetRows) {
  const headerRow = checkRows[2] || [];
  const days = Array.from({ length: 31 }, (_, index) => text(headerRow[index + 5]) || String(index + 1));
  const rows = checkRows
    .slice(3)
    .filter(row => text(row[1]) && text(row[2]) && text(row[3]))
    .map((row, index) => {
      const checks = days.map((_, dayIndex) => text(row[dayIndex + 5]).toUpperCase() !== 'FALSE');
      const errorCount = compactNumberText(row[36]) || String(checks.filter(value => !value).length);

      return {
        id: `EMP-OT-CHECK-${text(row[1]) || index}-${text(row[2]) || index}`,
        sequence: text(row[1]),
        employeeId: text(row[2]),
        name: text(row[3]),
        position: text(row[4]),
        group: employeeGroupFromIndex(index),
        checks,
        errorCount,
      };
    });

  return {
    title: 'CHECK OT ERROR พนักงาน',
    days,
    rows,
  };
}

function buildOTCheckError(checkRows: SheetRows, summaryRows: ReturnType<typeof buildOTSummary>['rows']) {
  const headerRow = checkRows[2] || [];
  const days = Array.from({ length: 31 }, (_, index) => text(headerRow[index + 4]) || String(index + 1));
  const groupByName = new Map<string, string>();

  for (const row of summaryRows) {
    const key = normalizePersonName(row.name);
    if (key && !groupByName.has(key)) {
      groupByName.set(key, row.group);
    }
  }

  const rows = checkRows
    .slice(3)
    .filter(row => text(row[1]) && text(row[3]))
    .map((row, index) => {
      const name = text(row[3]);
      const checks = days.map((_, dayIndex) => text(row[dayIndex + 4]).toUpperCase() !== 'FALSE');
      const errorCount = text(row[35]) || String(checks.filter(value => !value).length);

      return {
        id: `OT-CHECK-${text(row[1]) || index}-${name || index}`,
        sequence: text(row[1]),
        employeeId: text(row[2]),
        name,
        group: groupByName.get(normalizePersonName(name)) || '',
        checks,
        errorCount,
      };
    });

  return {
    title: 'CHECK OT ERROR ลูกจ้าง',
    days,
    rows,
  };
}

function buildProcurementData(infoRows: SheetRows) {
  const statusSummary = Array.from({ length: 8 }, (_, i) => ({
    status: infoRows[1 + i][73],
    count: numberAt(infoRows, 1 + i, 74)
  }));

  const weeklyTotals = Array.from({ length: 4 }, (_, i) => ({
    week: infoRows[11 + i][73],
    amount: numberAt(infoRows, 11 + i, 74)
  }));

  const totalProcurement = numberAt(infoRows, 15, 74); // Total row BV16

  return { statusSummary, weeklyTotals, totalProcurement };
}

export function normalizeDashboard(rawSheets: { dashboard: SheetRows; info: SheetRows; procurementDetail?: SheetRows; otSummary?: SheetRows; otEmployeeSummary?: SheetRows; otCheckError?: SheetRows; otEmployeeCheckError?: SheetRows }, filters: { year?: string; month?: string } = {}) {
  const infoRows = rawSheets.info || [];
  const procurementRows = rawSheets.procurementDetail?.length ? rawSheets.procurementDetail : infoRows.slice(10);
  const { projects, weeklyProjects } = buildProjects(infoRows);
  const groupStats = buildGroupStats(infoRows, weeklyProjects);
  const statusData = buildStatusData(infoRows);
  const procurementData = buildProcurementData(infoRows);
  const otSummary = buildOTSummary(rawSheets.otSummary || []);
  const otEmployeeSummary = buildEmployeeOTSummary(rawSheets.otEmployeeSummary || []);
  const sheetYearRaw = text(infoRows[1]?.[2]) || '2025';
  const sheetMonthRaw = text(infoRows[2]?.[2]) || 'all';

  return {
    raw: rawSheets,
    projects,
    procurementReportProjects: buildProcurementReportProjects(rawSheets.dashboard || []),
    procurementProjects: buildProcurementProjects(procurementRows),
    weeklyData: weeks.map(week => ({ week, ...groupStats[week] })),
    weeklyProjects,
    statusSummary: { total: { entrance: groupStats.W_all.entrance } },
    groupStats,
    wGauges: buildWGauges(infoRows),
    otEmployeeSummary,
    otSummary,
    otEmployeeCheckError: buildEmployeeOTCheckError(rawSheets.otEmployeeCheckError || []),
    otCheckError: buildOTCheckError(rawSheets.otCheckError || [], otSummary.rows),
    w_all: { entrance: groupStats.W_all.entrance },
    statusData,
    equipmentData: buildEquipmentData(infoRows),
    procurementData,
    currentYear: filters.year || (sheetYearRaw === 'All' ? 'all' : sheetYearRaw),
    currentMonth: filters.month || (sheetMonthRaw === 'รวมทุกเดือน' ? 'all' : sheetMonthRaw),
    debugInfo: {
      dashboardRows: rawSheets.dashboard?.length || 0,
      infoRows: infoRows.length,
      otEmployeeSummaryRows: rawSheets.otEmployeeSummary?.length || 0,
      otEmployeeCheckErrorRows: rawSheets.otEmployeeCheckError?.length || 0,
      otSummaryRows: rawSheets.otSummary?.length || 0,
      otCheckErrorRows: rawSheets.otCheckError?.length || 0,
    },
    timestamp: new Date().toISOString(),
  };
}

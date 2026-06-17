<script setup lang="ts">
type WeekKey = 'W11' | 'W12' | 'W13' | 'W14';

interface DashboardProject {
  id: string;
  ecmProcurement: string; // ECM ซื้อจ้าง
  ecm: string; // ECM
  order: string; // W/O
  name: string; // รายการ
  equipGroup: string; // Equip
  date: string; // Date เข้า
  startDate: string; // Date เริ่มงาน
  endDate: string; // Date ออกงาน
  status: string; // สถานะ
  action: string; // การดำเนินการ
  department: string;
}

interface OTSummary {
  title: string;
  days: string[];
  summaryHeaders: {
    holidayHours: string;
    totalOnePointFiveHours: string;
    oneTimesAmount: string;
    onePointFiveAmount: string;
    totalPay: string;
    threeTimesAmount: string;
  };
  rateLabels: {
    oneTimes: string;
    onePointFive: string;
    totalPay: string;
    threeTimes: string;
  };
  rows: Array<{
    id: string;
    sequence: string;
    group: string;
    employeeId?: string;
    name: string;
    position?: string;
    days: string[];
    holidayHours: string;
    totalOnePointFiveHours: string;
    oneTimesAmount: string;
    onePointFiveAmount: string;
    totalPay: string;
    threeTimesAmount: string;
    regularTotal?: string;
    threeTimesTotal?: string;
  }>;
  totals: null | {
    label: string;
    holidayHours: string;
    totalOnePointFiveHours: string;
    oneTimesAmount: string;
    onePointFiveAmount: string;
    totalPay: string;
    threeTimesAmount: string;
  };
}

interface DashboardData {
  projects: DashboardProject[];
  groupStats: Record<WeekKey, { entrance: number; left: number; finish: number; otherFinish: number; out: number }> & {
    W_all: { entrance: number; left: number; finish: number; otherFinish: number; out: number };
  };
  statusData: {
    sap: number;
    pending: number;
    finish: number;
    total: number;
    totalWorkOrders: number;
  };
  wGauges: Record<WeekKey, { empNorm: number; conNorm: number; empOT: number; conOT: number }>;
  otEmployeeSummary: OTSummary;
  otSummary: OTSummary;
  otEmployeeCheckError: {
    title: string;
    days: string[];
    rows: Array<{
      id: string;
      sequence: string;
      employeeId: string;
      name: string;
      position?: string;
      group: string;
      checks: boolean[];
      errorCount: string;
    }>;
  };
  otCheckError: {
    title: string;
    days: string[];
    rows: Array<{
      id: string;
      sequence: string;
      employeeId: string;
      name: string;
      position?: string;
      group: string;
      checks: boolean[];
      errorCount: string;
    }>;
  };
  equipmentData: Array<{
    name: string;
    values: number[];
    total: number;
  }>;
  procurementData: {
    statusSummary: Array<{ status: string; count: number }>;
    weeklyTotals: Array<{ week: string; amount: number }>;
    totalProcurement: number;
  };
  currentYear: string;
  currentMonth: string;
  timestamp: string;
}

const weeks: WeekKey[] = ['W11', 'W12', 'W13', 'W14'];
const months = [
  { label: 'ม.ค.', value: '1' },
  { label: 'ก.พ.', value: '2' },
  { label: 'มี.ค.', value: '3' },
  { label: 'เม.ย.', value: '4' },
  { label: 'พ.ค.', value: '5' },
  { label: 'มิ.ย.', value: '6' },
  { label: 'ก.ค.', value: '7' },
  { label: 'ส.ค.', value: '8' },
  { label: 'ก.ย.', value: '9' },
  { label: 'ต.ค.', value: '10' },
  { label: 'พ.ย.', value: '11' },
  { label: 'ธ.ค.', value: '12' },
];
const years = Array.from({ length: 10 }, (_, index) => String(2020 + index));

const searchTerm = ref('');
const activeTab = ref<'dashboard' | 'report' | 'otEmployee' | 'ot'>('dashboard');
const selectedMonth = ref('');
const selectedYear = ref('');
const isApplyingFilters = ref(false);
const employeeOTSheetLinks = [
  {
    label: 'เปิด Google Sheet สรุปOTประจำเดือนปี2569_กบย-ช_กสบ-ช',
    url: 'https://docs.google.com/spreadsheets/d/1__JtmwYd3xmL6XL-VkEU1E53NyaySwcT7dQY3OQ4aCA/edit?gid=1501422016#gid=1501422016',
    classes: 'bg-amber-500 text-slate-950 ring-amber-600/20 hover:bg-amber-400 focus:ring-amber-500',
  },
  {
    label: 'เปิด Google Sheet ETAS_data',
    url: 'https://docs.google.com/spreadsheets/d/1__JtmwYd3xmL6XL-VkEU1E53NyaySwcT7dQY3OQ4aCA/edit?gid=560056512#gid=560056512',
    classes: 'bg-sky-600 text-white ring-sky-700/20 hover:bg-sky-500 focus:ring-sky-500',
  },
  {
    label: 'เปิด Google Sheet Check OT Error',
    url: 'https://docs.google.com/spreadsheets/d/1__JtmwYd3xmL6XL-VkEU1E53NyaySwcT7dQY3OQ4aCA/edit?gid=803186817#gid=803186817',
    classes: 'bg-red-600 text-white ring-red-700/20 hover:bg-red-500 focus:ring-red-500',
  },
];
const contractorOTSheetLinks = [
  {
    label: 'เปิด Google Sheet สรุปOT',
    url: 'https://docs.google.com/spreadsheets/d/1ucCTBZBLF8tkTWyuIE46_aRx0vUwen382wWokuR55UQ/edit?gid=2120946153#gid=2120946153',
    classes: 'bg-amber-500 text-slate-950 ring-amber-600/20 hover:bg-amber-400 focus:ring-amber-500',
  },
  {
    label: 'เปิด Google Sheet ETAS_dataลจ',
    url: 'https://docs.google.com/spreadsheets/d/1ucCTBZBLF8tkTWyuIE46_aRx0vUwen382wWokuR55UQ/edit?gid=560156838#gid=560156838',
    classes: 'bg-sky-600 text-white ring-sky-700/20 hover:bg-sky-500 focus:ring-sky-500',
  },
  {
    label: 'เปิด Google Sheet Check OT Error',
    url: 'https://docs.google.com/spreadsheets/d/1ucCTBZBLF8tkTWyuIE46_aRx0vUwen382wWokuR55UQ/edit?gid=803186817#gid=803186817',
    classes: 'bg-red-600 text-white ring-red-700/20 hover:bg-red-500 focus:ring-red-500',
  },
];

const { data, pending, error, refresh } = useFetch<DashboardData>('/api/dashboard', {
  server: false,
  watch: false,
});

watch(data, (value) => {
  if (!value) return;
  selectedYear.value = value.currentYear || 'all';
  selectedMonth.value = value.currentMonth || 'all';
}, { immediate: true });

const total = computed(() => data.value?.statusData.total || 0);
const sap = computed(() => data.value?.statusData.sap || 0);
const pendingCount = computed(() => data.value?.statusData.pending || 0);
const finish = computed(() => data.value?.statusData.finish || 0);
const allProjects = computed(() => data.value?.projects || []);
const equipmentItems = computed(() => data.value?.equipmentData || []);
const pendingOT = computed(() => pending.value && !data.value);
const errorOT = computed(() => error.value);
const otEmployeeSummary = computed(() => data.value?.otEmployeeSummary);
const otSummary = computed(() => data.value?.otSummary);
const otEmployeeCheckError = computed(() => data.value?.otEmployeeCheckError);
const otCheckError = computed(() => data.value?.otCheckError);
const currentOTSummary = computed(() => activeTab.value === 'otEmployee' ? otEmployeeSummary.value : otSummary.value);
const currentOTCheckError = computed(() => activeTab.value === 'otEmployee' ? otEmployeeCheckError.value : otCheckError.value);
const currentOTPersonLabel = computed(() => activeTab.value === 'otEmployee' ? 'พนักงาน' : 'ลูกจ้าง');
const currentOTSheetTitle = computed(() => activeTab.value === 'otEmployee' ? 'ชีท OT พนักงาน' : 'ชีท OT ลูกจ้าง');
const currentOTSheetLinks = computed(() => activeTab.value === 'otEmployee' ? employeeOTSheetLinks : contractorOTSheetLinks);
const showOTCheckError = computed(() => activeTab.value === 'ot' || activeTab.value === 'otEmployee');

function buildOTGroups(summary?: OTSummary, includeCheckRows = false) {
  if (!summary) return [];

  const weekGroups = weeks.filter(group => summary.rows.some(row => row.group === group));
  const sourceGroups = weekGroups.length > 0
    ? weekGroups
    : Array.from(new Set(summary.rows.map(row => row.group).filter(Boolean)));

  const groups = sourceGroups.map(group => buildOTGroupDetail(
    group,
    summary.rows.filter(row => row.group === group),
    includeCheckRows ? (currentOTCheckError.value?.rows.filter(row => row.group === group) || []) : [],
  )).filter(group => group.rows.length > 0);

  if (activeTab.value === 'otEmployee' && summary.rows.length > 0) {
    groups.push(buildOTGroupDetail(
      'รวมทั้งหมด',
      summary.rows,
      includeCheckRows ? (currentOTCheckError.value?.rows || []) : [],
      true,
    ));
  }

  return groups;
}

function buildOTGroupDetail(group: string, rows: OTSummary['rows'], checkRows: NonNullable<DashboardData['otCheckError']>['rows'], isAllGroup = false) {
  const summaryTotals = {
    label: 'ยอดรวมสุทธิ',
    holidayHours: rows.reduce((sum, row) => sum + numericValue(row.holidayHours), 0),
    totalOnePointFiveHours: rows.reduce((sum, row) => sum + numericValue(row.totalOnePointFiveHours), 0),
    oneTimesAmount: rows.reduce((sum, row) => sum + numericValue(row.oneTimesAmount), 0),
    onePointFiveAmount: rows.reduce((sum, row) => sum + numericValue(row.onePointFiveAmount), 0),
    totalPay: rows.reduce((sum, row) => sum + numericValue(row.totalPay), 0),
    threeTimesAmount: rows.reduce((sum, row) => sum + numericValue(row.threeTimesAmount), 0),
  };
  const totalPay = rows.reduce((sum, row) => sum + numericValue(row.totalPay), 0);
  const errorTotal = checkRows.reduce((sum, row) => sum + numericValue(row.errorCount), 0);

  return {
    group,
    rows,
    checkRows,
    errorTotal,
    isAllGroup,
    summaryTotals,
    totalPay: totalPay.toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  };
}

const otGroups = computed(() => buildOTGroups(currentOTSummary.value, showOTCheckError.value));
const currentOTGroups = computed(() => otGroups.value);
const maxWeekEntrance = computed(() => Math.max(...weeks.map(week => data.value?.groupStats[week].entrance || 0), 1));
const maxEquipmentWeekValue = computed(() => Math.max(...equipmentItems.value.flatMap(item => item.values || []), 1));
const equipmentChartOptions = computed((): Highcharts.Options => {
  return {
    accessibility: { enabled: false }, // Disable accessibility module to remove warning
    chart: {
      type: 'column',
      height: 250,
      backgroundColor: 'transparent'
    },
    title: { text: '' },
    credits: { enabled: false },
    xAxis: {
      categories: weeks,
      labels: {
        style: {
          fontSize: '10px',
          fontWeight: 'bold',
          color: '#334155'
        }
      }
    },
    yAxis: {
      title: { text: '' },
      gridLineDashStyle: 'Dash',
      labels: {
        style: {
          fontSize: '9px',
          fontWeight: 'bold',
          color: '#334155'
        }
      }
    },
    plotOptions: {
      column: {
        borderRadius: 2,
        groupPadding: 0.1,
      }
    },
    series: equipmentItems.value.map((item, index) => ({
      type: 'column',
      name: item.name,
      data: item.values,
      color: equipmentColors[index % equipmentColors.length]
    }))
  };
});
const equipmentColors = ['#0284c7', '#ef4444', '#f59e0b', '#16a34a', '#6366f1', '#14b8a6', '#64748b'];
const lastUpdated = computed(() => {
  if (!data.value?.timestamp) return '-';
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(data.value.timestamp));
});

const filteredProjects = computed(() => {
  const term = searchTerm.value.trim().toLowerCase();
  const projects = allProjects.value;
  if (!term) return projects.slice(0, 25);

  return projects
    .filter(project =>
      [project.ecm, project.order, project.name, project.equipGroup, project.department, project.status]
        .join(' ')
        .toLowerCase()
        .includes(term),
    )
    .slice(0, 25);
});

const statusCards = computed(() => [
  {
    title: 'Pending',
    subtitle: 'รอดำเนินการ',
    value: pendingCount.value,
    percent: percent(pendingCount.value, total.value),
    accent: 'bg-amber-500',
    text: 'text-amber-700',
    soft: 'bg-amber-50/50',
    icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    description: 'งานที่กำลังดำเนินการ'
  },
  {
    title: 'Finish',
    subtitle: 'งานเสร็จแล้ว',
    value: finish.value,
    percent: percent(finish.value, total.value),
    accent: 'bg-emerald-600',
    text: 'text-emerald-700',
    soft: 'bg-emerald-50/50',
    icon: '<path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/>',
    description: 'รอการตรวจสอบขั้นสุดท้าย'
  },
  {
    title: 'SAP Comp',
    subtitle: 'บันทึกปิดงานในระบบ',
    value: sap.value,
    percent: percent(sap.value, total.value),
    accent: 'bg-blue-600',
    text: 'text-blue-700',
    soft: 'bg-blue-50/50',
    icon: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    description: 'งานที่สมบูรณ์ 100%'
  },
]);

function percent(value: number, base: number) {
  if (!base) return '0.0';
  return ((value / base) * 100).toFixed(1);
}

function numericValue(value: string) {
  return Number(String(value || '').replace(/,/g, '')) || 0;
}

function formatOTNumber(value: number, fractionDigits = 2) {
  return value.toLocaleString('th-TH', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

function weekHeight(week: WeekKey) {
  const value = data.value?.groupStats[week].entrance || 0;
  return `${Math.max((value / maxWeekEntrance.value) * 100, value ? 8 : 0)}%`;
}

function equipmentWeekBarHeight(value: number) {
  return `${Math.max((value / maxEquipmentWeekValue.value) * 100, value ? 7 : 0)}%`;
}

function equipmentColor(index: number) {
  return equipmentColors[index % equipmentColors.length];
}

function statusBadge(status: string) {
  const lower = status.toLowerCase();
  if (lower.includes('finish') || lower.includes('เสร็จ')) 
    return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20';
  if (lower.includes('pending') || lower.includes('รอ')) 
    return 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20';
  if (lower.includes('sap')) 
    return 'bg-sky-50 text-sky-700 ring-1 ring-sky-600/20';
  return 'bg-slate-50 text-slate-600 ring-1 ring-slate-600/20';
}

function getProcurementColor(index: number) {
  const colors = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444'];
  return colors[index % colors.length];
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    'ดำเนินการ': '#a855f7',
    '1.รอซื้อจ้าง': '#991b1b',
    '2.กบย-ช': '#3b82f6',
    '3.หซ,หจ': '#a3e635',
    '4.เสนอราคา': '#fb923c',
    '5.ติดตามPO': '#4d7c0f',
    '6.ส่งของ': '#3b82f6',
    'เสร็จ': '#22c55e'
  };
  return colors[status] || '#64748b';
}

function getDonutPath(index: number, items: any[]) {
  const total = items.reduce((acc, curr) => acc + curr.amount, 0);
  let startAngle = 0;
  for (let i = 0; i < index; i++) {
    startAngle += (items[i].amount / total) * 360;
  }
  const endAngle = startAngle + (items[index].amount / total) * 360;

  const x1 = 18 + 18 * Math.cos((startAngle - 90) * Math.PI / 180);
  const y1 = 18 + 18 * Math.sin((startAngle - 90) * Math.PI / 180);
  const x2 = 18 + 18 * Math.cos((endAngle - 90) * Math.PI / 180);
  const y2 = 18 + 18 * Math.sin((endAngle - 90) * Math.PI / 180);

  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return `M 18 18 L ${x1} ${y1} A 18 18 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
}

function getLabelPosition(index: number, items: any[]) {
  // Fixed positions based on the 4 possible sectors (top, right, bottom, left)
  const positions = [
    { top: '-20px', left: '110px' },  // Top
    { top: '100px', left: '220px' },  // Right
    { top: '220px', left: '110px' },  // Bottom
    { top: '100px', left: '-20px' },  // Left
  ];
  return positions[index % positions.length];
}

async function applyFilters() {
  isApplyingFilters.value = true;
  try {
    data.value = await $fetch<DashboardData>('/api/dashboard', {
      query: {
        applyFilters: 'true',
        year: selectedYear.value || 'all',
        month: selectedMonth.value || 'all',
      },
    });
  } finally {
    isApplyingFilters.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#edf3f8] font-sans text-slate-900">
    <header class="sticky top-0 z-30 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-xl">
      <div class="mx-auto flex max-w-[1540px] flex-col gap-3 px-3 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex min-w-0 items-center gap-3">
          <img src="/LogoEGATE.jpg" alt="EGAT" class="h-11 w-24 shrink-0 rounded-md bg-white object-contain p-1 ring-1 ring-slate-200 sm:h-12 sm:w-28" />
          <div class="min-w-0">
            <p class="text-[11px] font-bold uppercase text-sky-700">Main W10</p>
            <h1 class="break-words text-xl font-extrabold leading-tight text-slate-950 sm:text-2xl">
              Maintenance Dashboard
            </h1>
          </div>
        </div>

        <div class="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[1fr_auto] lg:w-auto lg:grid-cols-[auto_auto]">
          <div class="min-w-0 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <span class="block sm:inline font-semibold">อัปเดตล่าสุด </span>
            <span class="break-words font-black text-slate-900">{{ lastUpdated }}</span>
          </div>
          <button class="btn btn-sm min-h-9 px-4 font-black tracking-tight text-slate-950 bg-white border border-slate-300 shadow-sm hover:bg-slate-50" :disabled="pending" @click="refresh()">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-slate-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
            <span class="text-slate-950">อ่านข้อมูลใหม่</span>
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-[1540px] px-3 py-4 sm:px-5">
      <div class="mb-6 flex p-1 bg-white rounded-xl border border-slate-200 shadow-sm w-fit">
        <button
          class="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all"
          :class="activeTab === 'dashboard' ? 'bg-sky-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'"
          @click="activeTab = 'dashboard'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
          แดชบอร์ด
        </button>
        <button
          class="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all"
          :class="activeTab === 'report' ? 'bg-sky-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'"
          @click="activeTab = 'report'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
          จัดซื้อจัดจ้าง
        </button>
        <button
          class="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all"
          :class="activeTab === 'otEmployee' ? 'bg-sky-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'"
          @click="activeTab = 'otEmployee'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          สรุปโอที พนักงาน
        </button>
        <button
          class="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all"
          :class="activeTab === 'ot' ? 'bg-sky-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'"
          @click="activeTab = 'ot'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          สรุปโอที ลูกจ้าง
        </button>
      </div>

      <div v-if="activeTab !== 'ot' && activeTab !== 'otEmployee'" class="filter-panel rounded-xl p-5 mb-6 border-sky-200 shadow-lg shadow-sky-900/5 bg-white">
          <div class="flex flex-col lg:flex-row lg:items-center gap-4">
            <div class="flex items-center gap-3 shrink-0">
              <div class="p-2 bg-sky-600 rounded-lg text-white">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              </div>
              <div>
                <p class="text-sm font-extrabold text-sky-950 uppercase tracking-wider">ตัวกรองข้อมูล</p>
                <p class="text-[10px] font-bold text-sky-700 uppercase">เลือกเดือน/ปีเพื่อกรองข้อมูลในตาราง</p>
              </div>
            </div>
            
            <div class="grid grid-cols-2 lg:flex lg:items-center gap-3 flex-1">
              <div class="flex-1 space-y-1">
                <select v-model="selectedMonth" class="select select-bordered select-sm w-full h-10 font-bold bg-slate-50 text-slate-900 border-slate-200 focus:border-sky-500 focus:ring-sky-500">
                  <option value="all">ทุกเดือน</option>
                  <option v-for="month in months" :key="month.value" :value="month.value">{{ month.label }}</option>
                </select>
              </div>
              <div class="flex-1 space-y-1">
                <select v-model="selectedYear" class="select select-bordered select-sm w-full h-10 font-bold bg-slate-50 text-slate-900 border-slate-200 focus:border-sky-500 focus:ring-sky-500">
                  <option value="all">ทุกปี</option>
                  <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
                </select>
              </div>
              
              <button 
                class="btn btn-sm h-10 px-6 bg-sky-600 text-white border-none hover:bg-sky-700"
                :disabled="isApplyingFilters || pending"
                @click="applyFilters"
              >
                <span v-if="isApplyingFilters" class="loading loading-spinner loading-xs"></span>
                <span>กรองข้อมูล</span>
              </button>
            </div>
          </div>
        </div>
      
      <div v-if="pending && !data" class="mb-6 rounded-xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm font-bold text-sky-800 flex items-center gap-3 animate-pulse">
        <div class="w-4 h-4 border-2 border-sky-800 border-t-transparent rounded-full animate-spin"></div>
        กำลังอ่านข้อมูลจาก Google Sheet...
      </div>

      <template v-if="activeTab === 'dashboard'">
      <section class="mb-4 grid gap-3 grid-cols-1">
        <div class="dashboard-card rounded-xl p-4 sm:p-5">
          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <!-- Total W/O Card -->
            <div class="min-h-[170px] rounded-xl bg-slate-900 p-6 text-white relative overflow-hidden group border border-slate-800 shadow-xl">
              <div class="absolute -right-2 -bottom-2 w-32 h-32 text-white/5 group-hover:text-white/10 transition-colors pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M9 14h6"/><path d="M9 18h6"/><path d="M9 10h6"/></svg>
              </div>
              <div class="relative z-10 flex flex-col h-full">
                <div class="flex items-center justify-between mb-2">
                  <p class="text-xs font-black uppercase tracking-widest text-slate-400">W/O</p>
                  <div class="p-1.5 bg-white/10 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-sky-400"><path d="M12 2v20"/><path d="m17 17-5 5-5-5"/><path d="m7 7 5-5 5 5"/></svg>
                  </div>
                </div>
                <p class="text-5xl font-black tracking-tighter">{{ total.toLocaleString() }}</p>
                <div class="mt-auto pt-4 flex items-center justify-between border-t border-white/5">
                  <span class="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    ACTIVE DATA
                  </span>
                  <span class="text-[10px] font-black text-slate-400">ALL UNITS</span>
                </div>
              </div>
            </div>

            <!-- Status Cards -->
            <div v-for="card in statusCards" :key="card.title" class="min-h-[170px] rounded-xl border border-slate-200 p-6 flex flex-col relative overflow-hidden group hover:shadow-xl transition-all cursor-pointer hover:-translate-y-1" :class="card.soft">
              <div class="absolute top-0 left-0 w-full h-1.5" :class="card.accent"></div>
              
              <div class="flex items-start justify-between mb-3">
                <div class="min-w-0">
                  <p class="text-xs font-black uppercase tracking-widest text-slate-500 mb-0.5">{{ card.title }}</p>
                  <p class="text-[11px] font-bold text-slate-400 truncate">{{ card.description }}</p>
                </div>
                <div class="p-2 rounded-xl bg-white shadow-sm border border-slate-100 group-hover:scale-110 transition-transform" :class="card.text">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" v-html="card.icon"></svg>
                </div>
              </div>

              <div class="flex items-end justify-between gap-2 mt-auto">
                <div class="min-w-0">
                  <p class="text-4xl font-black tracking-tighter" :class="card.text">{{ card.value.toLocaleString() }}</p>
                  <p class="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{{ card.subtitle }}</p>
                </div>
                <div class="text-right">
                  <div class="text-[14px] font-black text-slate-700">{{ card.percent }}%</div>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="mt-4 w-full h-1.5 bg-slate-200/50 rounded-full overflow-hidden">
                <div 
                  class="h-full rounded-full transition-all duration-1000" 
                  :class="card.accent"
                  :style="{ width: card.percent + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <div v-if="error" class="alert alert-error mb-6 rounded-xl shadow-md border-none text-white font-bold">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span>โหลดข้อมูลไม่สำเร็จ: {{ error.message }}</span>
      </div>

      <section class="grid gap-4 grid-cols-1">
        <div class="dashboard-card rounded-xl p-5 sm:p-6 flex flex-col h-full relative overflow-hidden">
          <div class="absolute top-0 left-0 w-1.5 h-full bg-sky-600"></div>
          <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
            <div class="min-w-0">
              <h2 class="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <div class="w-1.5 h-6 bg-sky-600 rounded-full"></div>
                W/O เข้าตามหมวด
              </h2>
              <p class="text-sm font-semibold text-slate-500 mt-0.5">รายละเอียดความคืบหน้างานรายสัปดาห์ (W11-W14)</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 justify-items-center">
            <!-- Weekly Compact Cards 1-4 -->
            <div 
              v-for="(week, index) in weeks" 
              :key="`wo-card-${week}`" 
              class="w-full max-w-sm rounded-2xl p-5 border flex flex-col relative overflow-hidden group hover:shadow-xl transition-all"
              :class="[
                index === 0 ? 'bg-sky-50/50 border-sky-100' : 
                index === 1 ? 'bg-emerald-50/50 border-emerald-100' : 
                index === 2 ? 'bg-indigo-50/50 border-indigo-100' : 
                'bg-amber-50/50 border-amber-100'
              ]"
            >
              <div 
                class="absolute top-0 right-0 px-3 py-1 text-[10px] font-black uppercase rounded-bl-xl tracking-tighter"
                :class="[
                  index === 0 ? 'bg-sky-200 text-sky-600' : 
                  index === 1 ? 'bg-emerald-200 text-emerald-600' : 
                  index === 2 ? 'bg-indigo-200 text-indigo-600' : 
                  'bg-amber-200 text-amber-600'
                ]"
              >
                {{ week }}
              </div>
              
              <div class="flex items-center gap-4 mb-6">
                <!-- User Image -->
                <div class="relative shrink-0">
                  <img 
                    :src="index === 0 ? '/images/chanwit-Photoroom.png' : index === 1 ? '/images/saman-Photoroom.png' : index === 2 ? '/images/sitiporn-Photoroom.png' : '/images/wutisak-Photoroom.png'" 
                    class="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm"
                    alt="User"
                  />
                  <div 
                    class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-white"
                    :class="index === 0 ? 'bg-sky-500' : index === 1 ? 'bg-emerald-500' : index === 2 ? 'bg-indigo-500' : 'bg-amber-500'"
                  ></div>
                </div>
                <div class="flex flex-col">
                  <span class="text-base font-black text-slate-900">{{ week }} เข้า {{ data?.groupStats[week]?.entrance || 0 }}</span>
                </div>
              </div>
              
              <div class="grid grid-cols-2 gap-y-4 gap-x-3">
                <!-- Finished -->
                <div class="flex flex-col">
                  <p class="text-[11px] font-black uppercase text-emerald-600 leading-tight">เสร็จ</p>
                  <p class="text-2xl font-black text-slate-950 leading-none">{{ data?.groupStats[week]?.finish || 0 }}</p>
                </div>
                <!-- Pending/Carried Over -->
                <div class="flex flex-col">
                  <p class="text-[11px] font-black uppercase text-blue-600 leading-tight">ยังไม่เสร็จ</p>
                  <p class="text-2xl font-black text-slate-950 leading-none">{{ data?.groupStats[week]?.left || 0 }}</p>
                </div>
                <!-- Other Finished -->
                <div class="flex flex-col">
                  <p class="text-[11px] font-black uppercase text-amber-600 leading-tight">เดือนอื่น</p>
                  <p class="text-2xl font-black text-slate-950 leading-none">{{ data?.groupStats[week]?.otherFinish || 0 }}</p>
                </div>
                <!-- Outflow -->
                <div class="flex flex-col col-span-2 pt-3 mt-1 border-t border-slate-200/50">
                  <p class="text-[11px] font-black uppercase text-slate-500 leading-tight">งานออกทั้งหมด</p>
                  <p class="text-3xl font-black text-slate-950 leading-none mt-1">{{ data?.groupStats[week]?.out || 0 }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="flex justify-center mt-6 p-4 bg-slate-900 rounded-2xl">
             <span class="text-sm font-black text-white px-8 py-2">
                  รวม W/O ทั้งหมด: {{ data?.statusData.totalWorkOrders || 0 }}
             </span>
          </div>
        </div>
      </section>

      <section class="mt-4 grid gap-4 xl:grid-cols-2">
        <!-- Card 1: Bar Chart -->
        <div class="dashboard-card rounded-xl p-5 sm:p-6 shadow-lg bg-white border-none relative overflow-hidden flex flex-col h-full">
          <div class="absolute top-0 left-0 w-1.5 h-full bg-cyan-600"></div>
          
          <div class="mb-6">
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2 py-0.5 rounded bg-cyan-100 text-cyan-700 text-[10px] font-black uppercase tracking-widest">Visual</span>
              <h2 class="text-xl font-black text-slate-900 tracking-tight">กราฟเปรียบเทียบกลุ่มงาน</h2>
            </div>
            <p class="text-xs font-semibold text-slate-500">ปริมาณงานแยกตามอุปกรณ์รายสัปดาห์</p>
          </div>

          <!-- Legend moved inside -->
          <div class="mb-6 flex flex-wrap gap-2 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100 shadow-sm">
            <div v-for="(item, index) in equipmentItems" :key="`leg-compact-${item.name}`" class="flex items-center gap-1.5 px-1.5 py-0.5">
              <div class="w-2.5 h-2.5 rounded-sm" :style="{ backgroundColor: equipmentColor(index) }"></div>
              <span class="text-[10px] font-bold text-slate-600 truncate max-w-[80px]">{{ item.name || '-' }}</span>
            </div>
          </div>

          <HighchartsBarChart :options="equipmentChartOptions" class="h-full" />
        </div>

        <!-- Card 2: Data Table -->
        <div class="dashboard-card rounded-xl shadow-lg bg-white border-none relative overflow-hidden flex flex-col">
          <div class="absolute top-0 left-0 w-1.5 h-full bg-slate-800"></div>
          <div class="p-5 sm:p-6 flex flex-col h-full">
            <div class="mb-6">
              <div class="flex items-center gap-2 mb-1">
                <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest">Details</span>
                <h2 class="text-xl font-black text-slate-900 tracking-tight">ตารางสรุปกลุ่มงาน</h2>
              </div>
              <p class="text-xs font-semibold text-slate-500">ข้อมูลตัวเลขแยกตามประเภทอุปกรณ์</p>
            </div>

            <div class="overflow-x-auto rounded-xl border border-slate-100 shadow-sm flex-1">
              <table class="table table-xs w-full border-collapse">
                <thead>
                  <tr class="bg-slate-900 text-white">
                    <th class="py-3 px-3 text-[10px] font-black uppercase tracking-widest border-none first:rounded-tl-lg">Equipment</th>
                    <th v-for="week in weeks" :key="`tab-head-${week}`" class="py-3 px-1 text-center text-[10px] font-black uppercase tracking-widest border-none">{{ week }}</th>
                    <th class="py-3 px-3 text-center text-[10px] font-black uppercase tracking-widest border-none last:rounded-tr-lg">รวม</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="(item, index) in equipmentItems" :key="`tab-row-${item.name}`" class="hover:bg-slate-50 transition-colors">
                    <td class="px-3 py-2.5 font-bold text-slate-800 text-[11px] max-w-[120px] truncate">{{ item.name || '-' }}</td>
                    <td v-for="(value, vIdx) in item.values" :key="`tab-val-${vIdx}`" class="px-1 py-2.5 text-center text-[11px] font-semibold text-slate-600">{{ value }}</td>
                    <td class="px-3 py-2.5 text-center text-[11px] font-black text-sky-700 bg-sky-50/30">{{ item.total }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="mt-4 pt-4 border-t border-slate-50 text-right">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Groups: {{ equipmentItems.length }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- New Dedicated Gauge Section -->
      <section class="mt-4">
        <div class="dashboard-card rounded-xl p-6 bg-white border border-slate-200 shadow-sm">
          <h2 class="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
            <div class="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
            LOAD FACTOR / MAN
          </h2>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div v-for="week in weeks" :key="`gauge-container-${week}`" class="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <p class="text-base font-black text-slate-900 border-b border-slate-200 pb-2">{{ week }}</p>

              <!-- MAN -->
              <div class="flex flex-col items-center">
                <p class="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-wider">MAN</p>
                <div class="flex gap-2">
                   <GaugeChart :value="data?.wGauges[week]?.empNorm || 0" label="Emp" class="scale-90" />
                   <GaugeChart :value="data?.wGauges[week]?.conNorm || 0" label="Con" class="scale-90" />
                </div>
              </div>

              <!-- LOAD FACTOR -->
              <div class="flex flex-col items-center">
                <p class="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-wider">LOAD FACTOR</p>
                <div class="flex gap-2">
                   <GaugeChart :value="data?.wGauges[week]?.empOT || 0" label="Emp OT" class="scale-90" />
                   <GaugeChart :value="data?.wGauges[week]?.conOT || 0" label="Con OT" class="scale-90" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </template>

      <template v-else-if="activeTab === 'report'">
      <section class="space-y-4">
        <!-- Procurement Chart Card (MOVED TO TOP) -->
        <div class="dashboard-card rounded-xl shadow-xl overflow-hidden border-none bg-white p-6 mb-6">
          <h3 class="text-lg font-black text-slate-900 mb-6 text-center">กราฟสรุปปริมาณซื้อจ้างรายสัปดาห์</h3>
          <div class="flex items-center justify-center">
            <div class="relative w-64 h-64">
              <!-- SVG Donut Chart -->
              <svg viewBox="0 0 36 36" class="w-full h-full">
                <path
                  v-for="(item, index) in data?.procurementData.weeklyTotals"
                  :key="item.week"
                  :d="getDonutPath(index, data?.procurementData.weeklyTotals)"
                  :fill="getProcurementColor(index)"
                  stroke="white"
                  stroke-width="0.5"
                />
                <circle cx="18" cy="18" r="8" fill="white" />
              </svg>
              <!-- Labels placed in boxes around the chart -->
              <div v-for="(item, index) in data?.procurementData.weeklyTotals" :key="`label-${item.week}`" class="absolute" :style="getLabelPosition(index, data?.procurementData.weeklyTotals)">
                 <div class="text-[10px] font-black text-slate-800 bg-white px-2 py-1 rounded shadow border border-slate-200 text-center pointer-events-none">
                   {{ item.week }}<br/>{{ item.amount }} ({{ ((item.amount / data!.procurementData.totalProcurement) * 100).toFixed(1) }}%)
                 </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Procurement Data Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <!-- Weekly Totals Card -->
          <div class="dashboard-card rounded-xl shadow-xl border-none bg-white p-6">
            <h3 class="text-lg font-black text-slate-900 mb-4">ปริมาณการซื้อ/จ้างรายสัปดาห์</h3>
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div v-for="item in data?.procurementData.weeklyTotals" :key="item.week" class="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p class="text-xs font-bold text-slate-500 uppercase">{{ item.week }}</p>
                <p class="text-2xl font-black text-sky-700">{{ item.amount }}</p>
              </div>
            </div>
            <div class="mt-6 p-4 bg-slate-900 rounded-2xl text-center">
              <p class="text-sm font-black text-white">รวมทั้งหมด: {{ data?.procurementData.totalProcurement }}</p>
            </div>
          </div>
          
          <!-- Status Summary Card -->
          <div class="dashboard-card rounded-xl shadow-xl border-none bg-white p-6">
            <h3 class="text-lg font-black text-slate-900 mb-6 text-center">สถานะงานซื้อจ้าง</h3>
            <div class="flex items-end justify-between h-48 gap-3 pt-10 px-4">
              <div v-for="item in data?.procurementData.statusSummary" :key="item.status" class="flex flex-col items-center flex-1 group h-full">
                <div class="relative w-10 flex justify-center items-end bg-slate-100 rounded-t-xl h-full shadow-inner">
                   <!-- Bar with gradient and shadow -->
                   <div 
                     class="w-full transition-all duration-700 ease-out rounded-t-xl shadow-lg group-hover:brightness-110" 
                     :style="{ 
                       height: `${(item.count / Math.max(...data!.procurementData.statusSummary.map(s => s.count), 1)) * 100}%`, 
                       background: `linear-gradient(to top, ${getStatusColor(item.status)}, ${getStatusColor(item.status)}cc)` 
                     }"
                   ></div>
                   <!-- Value Label on top of bar -->
                   <span class="absolute -top-7 text-xs font-black drop-shadow-sm" :style="{ color: getStatusColor(item.status) }">{{ item.count }}</span>
                </div>
                <span class="text-[10px] font-black text-slate-500 mt-3 text-center rotate-45 origin-top-left uppercase tracking-tighter">{{ item.status }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="dashboard-card rounded-xl shadow-xl overflow-hidden border-none bg-white">
        <div class="p-6">
          <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div class="min-w-0">
              <h2 class="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <div class="p-2 bg-sky-100 text-sky-700 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
                </div>
                รายการงานทั้งหมด
              </h2>
              <p class="text-sm font-semibold text-slate-500 mt-1">แสดงผลล่าสุด 25 รายการ จากฐานข้อมูลหลัก</p>
            </div>
            
            <div class="relative group lg:w-96">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <input 
                v-model="searchTerm" 
                class="input input-bordered w-full h-12 pl-11 pr-4 rounded-xl font-bold bg-slate-50 border-slate-200 focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all placeholder:text-slate-400" 
                placeholder="ค้นหา ECM, W/O หรือรายละเอียด..." 
              />
            </div>
          </div>

          <div class="relative overflow-x-auto rounded-xl border border-slate-100 shadow-sm">
            <table class="table table-md table-pin-rows min-w-[1000px] border-collapse">
              <thead>
                <tr class="bg-slate-50/80 backdrop-blur-sm">
                  <th class="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-none">ECM ซื้อจ้าง</th>
                  <th class="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-500 border-none">ECM</th>
                  <th class="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-500 border-none">W/O</th>
                  <th class="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-500 border-none">รายการ</th>
                  <th class="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-500 border-none">Equip</th>
                  <th class="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-500 border-none">Date เข้า</th>
                  <th class="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-500 border-none">Date เริ่มงาน</th>
                  <th class="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-500 border-none">Date ออกงาน</th>
                  <th class="py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-500 border-none">สถานะ</th>
                  <th class="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-none">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr v-for="project in filteredProjects" :key="project.id" class="hover:bg-sky-50/50 transition-colors group">
                  <td class="px-4 py-4 font-black text-sky-700 text-[12px]">{{ project.ecmProcurement }}</td>
                  <td class="px-2 py-4 font-black text-sky-700 text-[12px]">{{ project.ecm }}</td>
                  <td class="px-2 py-4 font-bold text-slate-900 tracking-tight text-[12px]">{{ project.order }}</td>
                  <td class="px-2 py-4 text-[12px] font-bold text-slate-800">{{ project.name }}</td>
                  <td class="px-2 py-4 text-[12px] font-bold text-slate-600">{{ project.equipGroup }}</td>
                  <td class="px-2 py-4 text-[12px] font-bold text-slate-600 text-center">{{ project.date }}</td>
                  <td class="px-2 py-4 text-[12px] font-bold text-slate-600 text-center">{{ project.startDate }}</td>
                  <td class="px-2 py-4 text-[12px] font-bold text-slate-600 text-center">{{ project.endDate }}</td>
                  <td class="px-2 py-4 text-center">
                    <span class="inline-flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-black tracking-tight leading-none" :class="statusBadge(project.status)">
                      {{ project.status }}
                    </span>
                  </td>
                  <td class="px-4 py-4 text-[12px] font-bold text-slate-700">{{ project.action }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </section>
      </template>

      <template v-else-if="activeTab === 'ot' || activeTab === 'otEmployee'">
      <section class="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex min-w-0 items-center gap-3">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 ring-1 ring-sky-100">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5"/><path d="M9 13h6"/><path d="M9 17h6"/><path d="M9 9h1"/></svg>
            </div>
            <div class="min-w-0">
              <h3 class="text-sm font-black text-slate-950">{{ currentOTSheetTitle }}</h3>
              <p class="text-[11px] font-bold text-slate-600">เปิดแท็บต้นทางใน Google Sheet</p>
            </div>
          </div>

          <div class="flex max-w-full flex-wrap justify-start gap-2 lg:justify-end">
            <a
              v-for="sheetLink in currentOTSheetLinks"
              :key="sheetLink.url"
              :href="sheetLink.url"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex min-h-10 max-w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-black shadow-sm ring-1 transition focus:outline-none focus:ring-2 focus:ring-offset-2"
              :class="sheetLink.classes"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
              <span class="break-words text-center leading-tight">{{ sheetLink.label }}</span>
            </a>
          </div>
        </div>
      </section>

      <section class="dashboard-card ot-fit-section rounded-xl bg-white p-2 sm:p-3">
        <div v-if="pendingOT" class="text-slate-500 font-bold">กำลังโหลดข้อมูลโอที...</div>
        <div v-else-if="errorOT" class="text-red-500 font-bold">โหลดข้อมูลไม่สำเร็จ</div>
        <div v-else-if="currentOTSummary && currentOTSummary.rows.length > 0">
          <div class="mb-2 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h3 class="text-lg font-black text-slate-900">{{ currentOTSummary.title }}</h3>
              <p class="mt-0.5 text-[10px] font-semibold text-slate-500">ข้อมูลจากชีตสรุป OT {{ currentOTPersonLabel }} แสดงรายคน รายวัน และยอดจ่ายรวม</p>
            </div>
            <div class="flex flex-col gap-2 lg:items-end">
              <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div class="rounded-md bg-pink-50 px-2 py-1 text-right ring-1 ring-pink-100">
                <p class="text-[10px] font-black text-pink-700">1เท่า</p>
                <p class="text-sm font-black text-slate-900">{{ currentOTSummary.rateLabels.oneTimes || '-' }}</p>
              </div>
              <div class="rounded-md bg-amber-50 px-2 py-1 text-right ring-1 ring-amber-100">
                <p class="text-[10px] font-black text-amber-700">1.5เท่า</p>
                <p class="text-sm font-black text-slate-900">{{ currentOTSummary.rateLabels.onePointFive || '-' }}</p>
              </div>
              <div class="rounded-md bg-cyan-50 px-2 py-1 text-right ring-1 ring-cyan-100">
                <p class="text-[10px] font-black text-cyan-700">ยอดจ่าย</p>
                <p class="text-sm font-black text-slate-900">{{ currentOTSummary.totals?.totalPay || '-' }}</p>
              </div>
              <div class="rounded-md bg-orange-50 px-2 py-1 text-right ring-1 ring-orange-100">
                <p class="text-[10px] font-black text-orange-700">3เท่า</p>
                <p class="text-sm font-black text-slate-900">{{ currentOTSummary.rateLabels.threeTimes || '-' }}</p>
              </div>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <section v-for="group in currentOTGroups" :key="`ot-detail-${group.group}`" class="rounded-lg border border-pink-200 bg-pink-50/40 p-3">
              <template v-if="activeTab === 'ot'">
                <div class="contractor-ot-panel overflow-hidden rounded-xl border border-pink-200 bg-pink-50/70">
                  <div class="contractor-ot-header border-b border-pink-200 px-5 py-4">
                    <h4 class="flex items-center gap-3 text-3xl font-black text-slate-950">
                      <span class="h-11 w-3 rounded-full bg-pink-400"></span>
                      รายละเอียด OT ลูกจ้าง {{ group.group }}
                    </h4>
                    <p class="mt-2 text-sm font-black text-slate-700">{{ currentOTSummary.title }} · B2:AO34</p>
                  </div>

                  <div class="grid gap-4 p-4 xl:grid-cols-[360px_minmax(0,1fr)]">
                    <aside class="rounded-lg border border-pink-200 bg-white p-6 shadow-sm">
                      <p class="text-sm font-black text-pink-400">หมวด</p>
                      <p class="mt-2 text-4xl font-black text-slate-950">{{ group.group }}</p>

                      <div class="mt-7 space-y-3">
                        <div class="flex items-center justify-between rounded-lg bg-pink-50 px-4 py-3">
                          <span class="text-base font-black text-slate-800">จำนวนคน</span>
                          <span class="text-xl font-black text-slate-950">{{ group.rows.length }} คน</span>
                        </div>
                        <div class="flex items-center justify-between rounded-lg bg-yellow-50 px-4 py-3">
                          <span class="text-base font-black text-slate-800">ชม.วันหยุด</span>
                          <span class="text-xl font-black text-slate-950">{{ formatOTNumber(group.summaryTotals.holidayHours, 0) }} ชั่วโมง</span>
                        </div>
                        <div class="flex items-center justify-between rounded-lg bg-sky-50 px-4 py-3">
                          <span class="text-base font-black text-slate-800">ชม.วันปกติ</span>
                          <span class="text-xl font-black text-slate-950">{{ formatOTNumber(group.summaryTotals.totalOnePointFiveHours, 0) }} ชั่วโมง</span>
                        </div>
                      </div>
                    </aside>

                    <div class="min-w-0 space-y-5">
                      <div class="overflow-hidden border border-slate-700 bg-white">
                        <table class="contractor-detail-table w-full border-collapse">
                          <colgroup>
                            <col class="contractor-col-seq" />
                            <col class="contractor-col-group" />
                            <col class="contractor-col-name" />
                            <col v-for="day in currentOTSummary.days" :key="`contractor-detail-col-${group.group}-${day}`" class="contractor-col-day" />
                            <col class="contractor-col-summary" />
                            <col class="contractor-col-summary" />
                            <col class="contractor-col-money" />
                            <col class="contractor-col-money" />
                            <col class="contractor-col-money" />
                            <col class="contractor-col-summary" />
                          </colgroup>
                          <thead>
                            <tr>
                              <th colspan="3" class="border border-slate-700 bg-white px-2 py-2 text-center font-black text-slate-950">{{ currentOTSummary.title }}</th>
                              <th :colspan="currentOTSummary.days.length" class="border border-slate-700 bg-white px-2 py-2 text-center font-black text-slate-950">วันที่</th>
                              <th class="border border-slate-700 bg-white px-2 py-2 text-center font-black text-slate-950">1เท่า<br>{{ currentOTSummary.rateLabels.oneTimes || '-' }}</th>
                              <th class="border border-slate-700 bg-yellow-100 px-2 py-2 text-center font-black text-slate-950">1.5เท่า<br>{{ currentOTSummary.rateLabels.onePointFive || '-' }}</th>
                              <th class="border border-slate-700 bg-sky-50 px-2 py-2 text-center font-black text-slate-950">ยอดจ่าย<br>รวมเงิน</th>
                              <th class="border border-slate-700 bg-orange-50 px-2 py-2 text-center font-black text-slate-950">3เท่า<br>{{ currentOTSummary.rateLabels.threeTimes || '-' }}</th>
                            </tr>
                            <tr>
                              <th class="border border-slate-700 bg-slate-300 px-2 py-1.5 text-center font-black text-slate-950">ลำดับ</th>
                              <th class="border border-slate-700 bg-slate-300 px-2 py-1.5 text-center font-black text-slate-950">หมวด</th>
                              <th class="border border-slate-700 bg-slate-300 px-2 py-1.5 text-center font-black text-slate-950">ชื่อ</th>
                              <th v-for="day in currentOTSummary.days" :key="`contractor-detail-day-${group.group}-${day}`" class="border border-slate-700 bg-slate-300 px-1 py-1.5 text-center font-black text-slate-950">{{ day }}</th>
                              <th class="border border-slate-700 bg-rose-100 px-2 py-1.5 text-center font-black text-slate-950">ชม.วันหยุด</th>
                              <th class="border border-slate-700 bg-yellow-100 px-2 py-1.5 text-center font-black text-slate-950">รวมชม1.5</th>
                              <th class="border border-slate-700 bg-pink-100 px-2 py-1.5 text-center font-black text-slate-950">1เท่า</th>
                              <th class="border border-slate-700 bg-amber-100 px-2 py-1.5 text-center font-black text-slate-950">1.5เท่า</th>
                              <th class="border border-slate-700 bg-cyan-300 px-2 py-1.5 text-center font-black text-slate-950">ยอดจ่าย</th>
                              <th class="border border-slate-700 bg-orange-100 px-2 py-1.5 text-center font-black text-slate-950">3เท่า</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="row in group.rows" :key="`contractor-detail-${row.id}`" class="bg-sky-50/60">
                              <td class="border border-slate-700 px-2 py-1.5 text-center font-black text-slate-950">{{ row.sequence }}</td>
                              <td class="border border-slate-700 px-2 py-1.5 text-center font-black text-slate-950">{{ row.group }}</td>
                              <td class="border border-slate-700 px-2 py-1.5 text-left font-black text-slate-950">{{ row.name }}</td>
                              <td v-for="(dayValue, dayIndex) in row.days" :key="`${row.id}-contractor-detail-${dayIndex}`" class="border border-slate-700 px-1 py-1.5 text-center font-black text-slate-950">{{ dayValue }}</td>
                              <td class="border border-slate-700 bg-rose-100 px-2 py-1.5 text-center font-black text-red-700">{{ row.holidayHours }}</td>
                              <td class="border border-slate-700 bg-yellow-100 px-2 py-1.5 text-center font-black text-slate-950">{{ row.totalOnePointFiveHours }}</td>
                              <td class="border border-slate-700 bg-pink-100 px-2 py-1.5 text-center font-black text-red-700">{{ row.oneTimesAmount }}</td>
                              <td class="border border-slate-700 bg-amber-100 px-2 py-1.5 text-center font-black text-slate-950">{{ row.onePointFiveAmount }}</td>
                              <td class="border border-slate-700 bg-cyan-300 px-2 py-1.5 text-center font-black text-slate-950">{{ row.totalPay }}</td>
                              <td class="border border-slate-700 bg-orange-100 px-2 py-1.5 text-center font-black text-slate-950">{{ row.threeTimesAmount }}</td>
                            </tr>
                          </tbody>
                          <tfoot>
                            <tr>
                              <td :colspan="3 + currentOTSummary.days.length" class="border border-slate-700 bg-emerald-50 px-2 py-2 text-right font-black text-slate-950">ยอดรวมสุทธิ</td>
                              <td class="border border-slate-700 bg-rose-100 px-2 py-2 text-center font-black text-red-700">{{ formatOTNumber(group.summaryTotals.holidayHours, 0) }}</td>
                              <td class="border border-slate-700 bg-yellow-100 px-2 py-2 text-center font-black text-slate-950">{{ formatOTNumber(group.summaryTotals.totalOnePointFiveHours, 0) }}</td>
                              <td class="border border-slate-700 bg-pink-100 px-2 py-2 text-center font-black text-red-700">{{ formatOTNumber(group.summaryTotals.oneTimesAmount, 0) }}</td>
                              <td class="border border-slate-700 bg-amber-100 px-2 py-2 text-center font-black text-slate-950">{{ formatOTNumber(group.summaryTotals.onePointFiveAmount, 1) }}</td>
                              <td class="border border-slate-700 bg-cyan-300 px-2 py-2 text-center font-black text-slate-950">{{ formatOTNumber(group.summaryTotals.totalPay, 2) }}</td>
                              <td class="border border-slate-700 bg-orange-100 px-2 py-2 text-center font-black text-slate-950">{{ formatOTNumber(group.summaryTotals.threeTimesAmount, 0) }}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      <section>
                        <h5 class="mb-3 flex items-center gap-2 text-lg font-black text-slate-950">
                          <span class="h-5 w-2 rounded-full bg-sky-400"></span>
                          ข้อมูลสแกนลายนิ้วมือลูกจ้าง {{ group.group }}
                        </h5>
                        <div class="overflow-hidden border border-slate-700 bg-white">
                          <table class="contractor-scan-table w-full border-collapse">
                            <colgroup>
                              <col class="contractor-col-seq" />
                              <col class="contractor-scan-name" />
                              <col v-for="day in currentOTSummary.days" :key="`contractor-scan-col-${group.group}-${day}`" class="contractor-scan-day" />
                              <col class="contractor-scan-total" />
                            </colgroup>
                            <thead>
                              <tr>
                                <th colspan="2" class="border border-slate-700 bg-white px-2 py-2 text-center font-black text-slate-950">ข้อมูลสแกนลายนิ้วมือลูกจ้าง {{ group.group }}</th>
                                <th :colspan="currentOTSummary.days.length" class="border border-slate-700 bg-white px-2 py-2 text-center font-black text-slate-950">วันที่</th>
                                <th class="border border-slate-700 bg-white px-2 py-2 text-center font-black text-slate-950">รวม</th>
                              </tr>
                              <tr>
                                <th class="border border-slate-700 bg-slate-300 px-2 py-1.5 text-center font-black text-slate-950">ลำดับ</th>
                                <th class="border border-slate-700 bg-slate-300 px-2 py-1.5 text-center font-black text-slate-950">ชื่อ</th>
                                <th v-for="day in currentOTSummary.days" :key="`contractor-scan-day-${group.group}-${day}`" class="border border-slate-700 bg-slate-300 px-1 py-1.5 text-center font-black text-slate-950">{{ day }}</th>
                                <th class="border border-slate-700 bg-slate-300 px-2 py-1.5 text-center font-black text-slate-950">รวม</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="row in group.rows" :key="`contractor-scan-${row.id}`" class="bg-sky-50/60">
                                <td class="border border-slate-700 px-2 py-1.5 text-center font-black text-slate-950">{{ row.sequence }}</td>
                                <td class="border border-slate-700 px-2 py-1.5 text-left font-black text-slate-950">{{ row.name }}</td>
                                <td v-for="(dayValue, dayIndex) in row.days" :key="`${row.id}-contractor-scan-${dayIndex}`" class="border border-slate-700 px-1 py-1.5 text-center font-black text-slate-950">{{ dayValue }}</td>
                                <td class="border border-slate-700 bg-sky-200 px-2 py-1.5 text-center font-black text-slate-950">{{ formatOTNumber(row.days.reduce((sum, value) => sum + numericValue(value), 0), 0) }}</td>
                              </tr>
                            </tbody>
                            <tfoot>
                              <tr>
                                <td :colspan="2 + currentOTSummary.days.length" class="border border-slate-700 bg-sky-100 px-2 py-2 text-right font-black text-slate-950">ยอดรวมข้อมูลสแกน</td>
                                <td class="border border-slate-700 bg-sky-200 px-2 py-2 text-center font-black text-slate-950">{{ formatOTNumber(group.summaryTotals.holidayHours + group.summaryTotals.totalOnePointFiveHours, 0) }}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </section>

                      <section v-if="otCheckError && group.checkRows.length > 0">
                        <h5 class="mb-3 flex items-center gap-2 text-lg font-black text-slate-950">
                          <span class="h-5 w-2 rounded-full bg-red-500"></span>
                          ตรวจสอบข้อผิดพลาด OT ลูกจ้าง {{ group.group }}
                        </h5>
                        <div class="overflow-hidden border border-slate-700 bg-white">
                          <table class="contractor-error-table w-full border-collapse">
                            <colgroup>
                              <col class="contractor-col-seq" />
                              <col class="contractor-error-name" />
                              <col v-for="day in otCheckError.days" :key="`contractor-error-col-${group.group}-${day}`" class="contractor-error-day" />
                              <col class="contractor-error-total" />
                            </colgroup>
                            <thead>
                              <tr>
                                <th :colspan="2 + otCheckError.days.length + 1" class="border border-slate-700 bg-red-500 px-2 py-2 text-center font-black text-slate-950">CHECK OT ERROR ลูกจ้าง {{ group.group }}</th>
                              </tr>
                              <tr>
                                <th class="border border-slate-700 bg-slate-300 px-2 py-1.5 text-center font-black text-slate-950">ลำดับ</th>
                                <th class="border border-slate-700 bg-slate-300 px-2 py-1.5 text-center font-black text-slate-950">ชื่อ</th>
                                <th v-for="day in otCheckError.days" :key="`contractor-error-day-${group.group}-${day}`" class="border border-slate-700 bg-slate-300 px-1 py-1.5 text-center font-black text-slate-950">{{ day }}</th>
                                <th class="border border-slate-700 bg-slate-300 px-2 py-1.5 text-center font-black text-slate-950">รวม</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="row in group.checkRows" :key="`contractor-error-${row.id}`">
                                <td class="border border-slate-700 px-2 py-1.5 text-center font-black text-slate-950">{{ row.sequence }}</td>
                                <td class="border border-slate-700 px-2 py-1.5 text-left font-black text-slate-950">{{ row.name }}</td>
                                <td
                                  v-for="(isValid, dayIndex) in row.checks"
                                  :key="`${row.id}-contractor-error-${dayIndex}`"
                                  class="border border-slate-700 px-1 py-1.5 text-center font-black"
                                  :class="isValid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-600 text-white'"
                                >
                                  {{ isValid ? '✓' : '' }}
                                </td>
                                <td class="border border-slate-700 bg-red-600 px-2 py-1.5 text-center font-black text-white">{{ row.errorCount }}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </section>
                    </div>
                  </div>
                </div>
              </template>

              <template v-else-if="activeTab === 'otEmployee'">
                <div class="employee-ot-panel overflow-hidden rounded-xl border border-amber-200 bg-amber-50/70">
                  <div class="employee-ot-header border-b border-amber-200 px-5 py-4">
                    <h4 class="flex items-center gap-3 text-3xl font-black text-slate-950">
                      <span class="h-11 w-3 rounded-full bg-orange-400"></span>
                      รายละเอียด OT พนักงาน {{ group.group }}
                    </h4>
                    <p class="mt-2 text-sm font-black text-slate-700">
                      {{ currentOTSummary.title }} · {{ group.isAllGroup ? 'ตารางรวมหลัง W14' : 'B2:AL20' }}
                    </p>
                  </div>

                  <div class="grid gap-4 p-4 xl:grid-cols-[360px_minmax(0,1fr)]">
                    <aside class="rounded-lg border border-amber-200 bg-white p-6 shadow-sm">
                      <p class="text-sm font-black text-amber-500">หมวด</p>
                      <p class="mt-2 text-4xl font-black text-slate-950">{{ group.group }}</p>

                      <div class="mt-7 space-y-3">
                        <div class="flex items-center justify-between rounded-lg bg-yellow-50 px-4 py-3">
                          <span class="text-base font-black text-slate-800">จำนวนคน</span>
                          <span class="text-xl font-black text-slate-950">{{ group.rows.length }} คน</span>
                        </div>
                        <div class="flex items-center justify-between rounded-lg bg-pink-50 px-4 py-3">
                          <span class="text-base font-black text-slate-800">OT รวม</span>
                          <span class="text-xl font-black text-slate-950">{{ formatOTNumber(group.summaryTotals.holidayHours, 0) }} ชั่วโมง</span>
                        </div>
                      </div>
                    </aside>

                    <div class="min-w-0 space-y-5">
                      <div class="overflow-hidden border border-slate-700 bg-white">
                        <table class="employee-detail-table w-full border-collapse">
                          <colgroup>
                            <col class="employee-col-seq" />
                            <col class="employee-col-id" />
                            <col class="employee-col-name" />
                            <col class="employee-col-position" />
                            <col v-for="day in currentOTSummary.days" :key="`employee-detail-col-${group.group}-${day}`" class="employee-col-day" />
                            <col class="employee-col-total" />
                            <col class="employee-col-total" />
                          </colgroup>
                          <thead>
                            <tr>
                              <th colspan="4" class="border border-slate-700 bg-white px-2 py-2 text-center font-black text-slate-950">{{ currentOTSummary.title }}</th>
                              <th :colspan="currentOTSummary.days.length" class="border border-slate-700 bg-white px-2 py-2 text-center font-black text-slate-950">วันที่</th>
                              <th colspan="2" class="border border-slate-700 bg-white px-2 py-2 text-center font-black text-slate-950"></th>
                            </tr>
                            <tr>
                              <th class="border border-slate-700 bg-slate-300 px-2 py-1.5 text-center font-black text-slate-950">ลำดับ</th>
                              <th class="border border-slate-700 bg-slate-300 px-2 py-1.5 text-center font-black text-slate-950">เลขประจำตัว</th>
                              <th class="border border-slate-700 bg-slate-300 px-2 py-1.5 text-center font-black text-slate-950">ชื่อ</th>
                              <th class="border border-slate-700 bg-slate-300 px-2 py-1.5 text-center font-black text-slate-950">ตำแหน่ง</th>
                              <th v-for="day in currentOTSummary.days" :key="`employee-detail-day-${group.group}-${day}`" class="border border-slate-700 bg-slate-300 px-1 py-1.5 text-center font-black text-slate-950">{{ day }}</th>
                              <th class="border border-slate-700 bg-yellow-300 px-2 py-1.5 text-center font-black text-slate-950">รวม</th>
                              <th class="border border-slate-700 bg-yellow-300 px-2 py-1.5 text-center font-black text-slate-950">รวมx3</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="row in group.rows" :key="`employee-detail-${row.id}`" class="bg-sky-50/60">
                              <td class="border border-slate-700 px-2 py-1.5 text-center font-black text-slate-950">{{ row.sequence }}</td>
                              <td class="border border-slate-700 px-2 py-1.5 text-center font-black text-slate-950">{{ row.employeeId }}</td>
                              <td class="border border-slate-700 px-2 py-1.5 text-left font-black text-slate-950">{{ row.name }}</td>
                              <td class="border border-slate-700 px-2 py-1.5 text-center font-black text-slate-950">{{ row.position }}</td>
                              <td v-for="(dayValue, dayIndex) in row.days" :key="`${row.id}-employee-detail-${dayIndex}`" class="border border-slate-700 px-1 py-1.5 text-center font-black text-slate-950">{{ dayValue }}</td>
                              <td class="border border-slate-700 bg-yellow-300 px-2 py-1.5 text-center font-black text-slate-950">{{ row.regularTotal || row.holidayHours }}</td>
                              <td class="border border-slate-700 bg-yellow-300 px-2 py-1.5 text-center font-black text-slate-950">{{ row.threeTimesTotal || row.threeTimesAmount }}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <section>
                        <h5 class="mb-3 flex items-center gap-2 text-lg font-black text-slate-950">
                          <span class="h-5 w-2 rounded-full bg-sky-400"></span>
                          ข้อมูลสแกนลายนิ้วมือพนักงาน {{ group.group }}
                        </h5>
                        <div class="overflow-hidden border border-slate-700 bg-white">
                          <table class="employee-scan-table w-full border-collapse">
                            <colgroup>
                              <col class="employee-col-seq" />
                              <col class="employee-scan-name" />
                              <col class="employee-col-position" />
                              <col v-for="day in currentOTSummary.days" :key="`employee-scan-col-${group.group}-${day}`" class="employee-scan-day" />
                              <col class="employee-scan-total" />
                            </colgroup>
                            <thead>
                              <tr>
                                <th colspan="3" class="border border-slate-700 bg-white px-2 py-2 text-center font-black text-slate-950">ข้อมูลสแกนลายนิ้วมือพนักงาน {{ group.group }}</th>
                                <th :colspan="currentOTSummary.days.length" class="border border-slate-700 bg-white px-2 py-2 text-center font-black text-slate-950">วันที่</th>
                                <th class="border border-slate-700 bg-white px-2 py-2 text-center font-black text-slate-950">รวม</th>
                              </tr>
                              <tr>
                                <th class="border border-slate-700 bg-slate-300 px-2 py-1.5 text-center font-black text-slate-950">ลำดับ</th>
                                <th class="border border-slate-700 bg-slate-300 px-2 py-1.5 text-center font-black text-slate-950">ชื่อ</th>
                                <th class="border border-slate-700 bg-slate-300 px-2 py-1.5 text-center font-black text-slate-950">ตำแหน่ง</th>
                                <th v-for="day in currentOTSummary.days" :key="`employee-scan-day-${group.group}-${day}`" class="border border-slate-700 bg-slate-300 px-1 py-1.5 text-center font-black text-slate-950">{{ day }}</th>
                                <th class="border border-slate-700 bg-slate-300 px-2 py-1.5 text-center font-black text-slate-950">รวม</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="row in group.rows" :key="`employee-scan-${row.id}`" class="bg-sky-50/60">
                                <td class="border border-slate-700 px-2 py-1.5 text-center font-black text-slate-950">{{ row.sequence }}</td>
                                <td class="border border-slate-700 px-2 py-1.5 text-left font-black text-slate-950">{{ row.name }}</td>
                                <td class="border border-slate-700 px-2 py-1.5 text-center font-black text-slate-950">{{ row.position }}</td>
                                <td v-for="(dayValue, dayIndex) in row.days" :key="`${row.id}-employee-scan-${dayIndex}`" class="border border-slate-700 px-1 py-1.5 text-center font-black text-slate-950">{{ dayValue }}</td>
                                <td class="border border-slate-700 bg-sky-200 px-2 py-1.5 text-center font-black text-slate-950">{{ row.regularTotal || row.holidayHours }}</td>
                              </tr>
                            </tbody>
                            <tfoot>
                              <tr>
                                <td :colspan="3 + currentOTSummary.days.length" class="border border-slate-700 bg-sky-100 px-2 py-2 text-right font-black text-slate-950">ยอดรวมข้อมูลสแกน</td>
                                <td class="border border-slate-700 bg-sky-200 px-2 py-2 text-center font-black text-slate-950">{{ formatOTNumber(group.summaryTotals.holidayHours, 0) }}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </section>

                      <section v-if="currentOTCheckError && group.checkRows.length > 0">
                        <h5 class="mb-3 flex items-center gap-2 text-lg font-black text-slate-950">
                          <span class="h-5 w-2 rounded-full bg-red-500"></span>
                          ตรวจสอบข้อผิดพลาด OT พนักงาน {{ group.group }}
                        </h5>
                        <div class="overflow-hidden border border-slate-700 bg-white">
                          <table class="employee-error-table w-full border-collapse">
                            <colgroup>
                              <col class="employee-col-seq" />
                              <col class="employee-error-name" />
                              <col class="employee-col-position" />
                              <col v-for="day in currentOTCheckError.days" :key="`employee-error-col-${group.group}-${day}`" class="employee-error-day" />
                              <col class="employee-error-total" />
                            </colgroup>
                            <thead>
                              <tr>
                                <th :colspan="3 + currentOTCheckError.days.length + 1" class="border border-slate-700 bg-red-500 px-2 py-2 text-center font-black text-slate-950">CHECK OT ERROR พนักงาน</th>
                              </tr>
                              <tr>
                                <th class="border border-slate-700 bg-slate-300 px-2 py-1.5 text-center font-black text-slate-950">ลำดับ</th>
                                <th class="border border-slate-700 bg-slate-300 px-2 py-1.5 text-center font-black text-slate-950">ชื่อ</th>
                                <th class="border border-slate-700 bg-slate-300 px-2 py-1.5 text-center font-black text-slate-950">ตำแหน่ง</th>
                                <th v-for="day in currentOTCheckError.days" :key="`employee-error-day-${group.group}-${day}`" class="border border-slate-700 bg-slate-300 px-1 py-1.5 text-center font-black text-slate-950">{{ day }}</th>
                                <th class="border border-slate-700 bg-slate-300 px-2 py-1.5 text-center font-black text-slate-950">รวม</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="row in group.checkRows" :key="`employee-error-${row.id}`">
                                <td class="border border-slate-700 px-2 py-1.5 text-center font-black text-slate-950">{{ row.sequence }}</td>
                                <td class="border border-slate-700 px-2 py-1.5 text-left font-black text-slate-950">{{ row.name }}</td>
                                <td class="border border-slate-700 px-2 py-1.5 text-center font-black text-slate-950">{{ row.position }}</td>
                                <td
                                  v-for="(isValid, dayIndex) in row.checks"
                                  :key="`${row.id}-employee-error-${dayIndex}`"
                                  class="border border-slate-700 px-1 py-1.5 text-center font-black"
                                  :class="isValid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-600 text-white'"
                                >
                                  {{ isValid ? '✓' : '' }}
                                </td>
                                <td class="border border-slate-700 bg-red-600 px-2 py-1.5 text-center font-black text-white">{{ row.errorCount }}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </section>
                    </div>
                  </div>
                </div>
              </template>

              <template v-else>
              <div class="mb-2 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h4 class="border-l-8 border-pink-400 pl-3 text-base font-black text-slate-950">
                    รายละเอียด OT {{ currentOTPersonLabel }} {{ group.group }}
                  </h4>
                  <p class="mt-0.5 text-[11px] font-bold text-slate-500">
                    {{ currentOTSummary.title }} · {{ group.rows.length }} ราย
                  </p>
                </div>
                <div class="rounded-md bg-cyan-300 px-3 py-1 text-right text-slate-950">
                  <p class="text-[10px] font-black">ยอดจ่ายรวม</p>
                  <p class="text-sm font-black">{{ group.totalPay }}</p>
                </div>
              </div>

              <div class="ot-fit-shell rounded-md border border-slate-700 bg-white">
                <table class="ot-fit-table border-collapse">
                  <colgroup>
                    <col class="ot-col-seq" />
                    <col class="ot-col-group" />
                    <col class="ot-col-name" />
                    <col v-for="day in currentOTSummary.days" :key="`ot-detail-col-${group.group}-${day}`" class="ot-col-day" />
                    <col class="ot-col-summary" />
                    <col class="ot-col-summary" />
                    <col class="ot-col-summary" />
                    <col class="ot-col-summary-wide" />
                    <col class="ot-col-summary-wide" />
                    <col class="ot-col-summary" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th colspan="3" class="border border-slate-700 bg-slate-200 px-2 py-2 text-center font-black text-slate-900">ข้อมูล{{ currentOTPersonLabel }}</th>
                      <th :colspan="currentOTSummary.days.length" class="border border-slate-700 bg-slate-200 px-2 py-2 text-center font-black text-slate-900">วันที่</th>
                      <th class="border border-slate-700 bg-rose-100 px-2 py-2 text-center font-black text-red-600">{{ currentOTSummary.summaryHeaders.holidayHours }}</th>
                      <th class="border border-slate-700 bg-yellow-100 px-2 py-2 text-center font-black text-yellow-700">{{ currentOTSummary.summaryHeaders.totalOnePointFiveHours }}</th>
                      <th class="border border-slate-700 bg-pink-100 px-2 py-2 text-center font-black text-red-600">{{ currentOTSummary.summaryHeaders.oneTimesAmount }}</th>
                      <th class="border border-slate-700 bg-amber-100 px-2 py-2 text-center font-black text-yellow-700">{{ currentOTSummary.summaryHeaders.onePointFiveAmount }}</th>
                      <th class="border border-slate-700 bg-cyan-300 px-2 py-2 text-center font-black text-sky-900">{{ currentOTSummary.summaryHeaders.totalPay }}</th>
                      <th class="border border-slate-700 bg-orange-100 px-2 py-2 text-center font-black text-red-600">{{ currentOTSummary.summaryHeaders.threeTimesAmount }}</th>
                    </tr>
                    <tr>
                      <th class="w-12 border border-slate-700 bg-slate-300 px-2 py-1.5 text-center font-black text-slate-900">ลำดับ</th>
                      <th class="w-16 border border-slate-700 bg-slate-300 px-2 py-1.5 text-center font-black text-slate-900">หมวด</th>
                      <th class="w-56 border border-slate-700 bg-slate-300 px-2 py-1.5 text-center font-black text-slate-900">ชื่อ</th>
                      <th v-for="day in currentOTSummary.days" :key="`ot-detail-day-${group.group}-${day}`" class="w-7 border border-slate-700 bg-slate-300 px-1 py-1.5 text-center font-black text-slate-900">{{ day }}</th>
                      <th class="w-16 border border-slate-700 bg-rose-100 px-2 py-1.5 text-center font-black text-slate-900">{{ currentOTSummary.rateLabels.oneTimes || '-' }}</th>
                      <th class="w-16 border border-slate-700 bg-yellow-100 px-2 py-1.5 text-center font-black text-slate-900">{{ currentOTSummary.rateLabels.onePointFive || '-' }}</th>
                      <th class="w-16 border border-slate-700 bg-pink-100 px-2 py-1.5 text-center font-black text-slate-900">{{ currentOTSummary.rateLabels.oneTimes || '-' }}</th>
                      <th class="w-20 border border-slate-700 bg-amber-100 px-2 py-1.5 text-center font-black text-slate-900">{{ currentOTSummary.rateLabels.onePointFive || '-' }}</th>
                      <th class="w-20 border border-slate-700 bg-cyan-300 px-2 py-1.5 text-center font-black text-sky-900">{{ currentOTSummary.rateLabels.totalPay || '-' }}</th>
                      <th class="w-16 border border-slate-700 bg-orange-100 px-2 py-1.5 text-center font-black text-slate-900">{{ currentOTSummary.rateLabels.threeTimes || '-' }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, rowIndex) in group.rows" :key="row.id" :class="rowIndex % 2 === 0 ? 'bg-white' : 'bg-pink-50/60'">
                      <td class="border border-slate-700 px-2 py-1.5 text-center font-black text-slate-900">{{ row.sequence }}</td>
                      <td class="border border-slate-700 px-2 py-1.5 text-center font-black text-sky-800">{{ row.group }}</td>
                      <td class="border border-slate-700 px-2 py-1.5 text-left font-semibold text-slate-900">{{ row.name }}</td>
                      <td v-for="(dayValue, dayIndex) in row.days" :key="`${row.id}-detail-${dayIndex}`" class="border border-slate-700 px-1 py-1.5 text-center font-semibold text-slate-900">{{ dayValue }}</td>
                      <td class="border border-slate-700 bg-rose-50 px-2 py-1.5 text-right font-bold text-slate-900">{{ row.holidayHours }}</td>
                      <td class="border border-slate-700 bg-yellow-50 px-2 py-1.5 text-right font-bold text-slate-900">{{ row.totalOnePointFiveHours }}</td>
                      <td class="border border-slate-700 bg-pink-50 px-2 py-1.5 text-right font-bold text-slate-900">{{ row.oneTimesAmount }}</td>
                      <td class="border border-slate-700 bg-amber-50 px-2 py-1.5 text-right font-bold text-slate-900">{{ row.onePointFiveAmount }}</td>
                      <td class="border border-slate-700 bg-cyan-300 px-2 py-1.5 text-right font-black text-slate-900">{{ row.totalPay }}</td>
                      <td class="border border-slate-700 bg-orange-50 px-2 py-1.5 text-right font-bold text-slate-900">{{ row.threeTimesAmount }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td :colspan="3 + currentOTSummary.days.length" class="border border-slate-700 bg-emerald-50 px-2 py-2 text-right font-black text-slate-900">{{ group.summaryTotals.label }}</td>
                      <td class="border border-slate-700 bg-rose-50 px-2 py-2 text-right font-black text-slate-900">{{ formatOTNumber(group.summaryTotals.holidayHours) }}</td>
                      <td class="border border-slate-700 bg-yellow-50 px-2 py-2 text-right font-black text-slate-900">{{ formatOTNumber(group.summaryTotals.totalOnePointFiveHours) }}</td>
                      <td class="border border-slate-700 bg-pink-50 px-2 py-2 text-right font-black text-slate-900">{{ formatOTNumber(group.summaryTotals.oneTimesAmount) }}</td>
                      <td class="border border-slate-700 bg-amber-50 px-2 py-2 text-right font-black text-slate-900">{{ formatOTNumber(group.summaryTotals.onePointFiveAmount) }}</td>
                      <td class="border border-slate-700 bg-yellow-300 px-2 py-2 text-right font-black text-slate-900">{{ formatOTNumber(group.summaryTotals.totalPay) }}</td>
                      <td class="border border-slate-700 bg-orange-50 px-2 py-2 text-right font-black text-slate-900">{{ formatOTNumber(group.summaryTotals.threeTimesAmount) }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              </template>
            </section>
          </div>

          <div v-if="false" class="ot-fit-shell rounded-lg border border-slate-300 bg-white">
            <table class="ot-fit-table border-collapse">
              <colgroup>
                <col class="ot-col-seq" />
                <col class="ot-col-group" />
                <col class="ot-col-name" />
                <col v-for="day in otSummary.days" :key="`ot-col-${day}`" class="ot-col-day" />
                <col class="ot-col-summary" />
                <col class="ot-col-summary" />
                <col class="ot-col-summary" />
                <col class="ot-col-summary-wide" />
                <col class="ot-col-summary-wide" />
                <col class="ot-col-summary" />
              </colgroup>
              <thead class="sticky top-0 z-20">
                <tr>
                  <th colspan="3" class="border border-slate-700 bg-slate-200 px-2 py-2 text-center font-black text-slate-900">ข้อมูลลูกจ้าง</th>
                  <th :colspan="otSummary.days.length" class="border border-slate-700 bg-slate-200 px-2 py-2 text-center font-black text-slate-900">วันที่</th>
                  <th class="border border-slate-700 bg-rose-100 px-2 py-2 text-center font-black text-red-600">{{ otSummary.summaryHeaders.holidayHours }}</th>
                  <th class="border border-slate-700 bg-yellow-100 px-2 py-2 text-center font-black text-yellow-700">{{ otSummary.summaryHeaders.totalOnePointFiveHours }}</th>
                  <th class="border border-slate-700 bg-pink-100 px-2 py-2 text-center font-black text-red-600">{{ otSummary.summaryHeaders.oneTimesAmount }}</th>
                  <th class="border border-slate-700 bg-amber-100 px-2 py-2 text-center font-black text-yellow-700">{{ otSummary.summaryHeaders.onePointFiveAmount }}</th>
                  <th class="border border-slate-700 bg-cyan-300 px-2 py-2 text-center font-black text-sky-900">{{ otSummary.summaryHeaders.totalPay }}</th>
                  <th class="border border-slate-700 bg-orange-100 px-2 py-2 text-center font-black text-red-600">{{ otSummary.summaryHeaders.threeTimesAmount }}</th>
                </tr>
                <tr>
                  <th class="sticky left-0 z-30 w-12 border border-slate-700 bg-slate-300 px-2 py-1.5 text-center font-black text-slate-900">ลำดับ</th>
                  <th class="sticky left-12 z-30 w-16 border border-slate-700 bg-slate-300 px-2 py-1.5 text-center font-black text-slate-900">หมวด</th>
                  <th class="sticky left-28 z-30 w-56 border border-slate-700 bg-slate-300 px-2 py-1.5 text-center font-black text-slate-900">ชื่อ</th>
                  <th v-for="day in otSummary.days" :key="`ot-day-${day}`" class="w-7 border border-slate-700 bg-slate-300 px-1 py-1.5 text-center font-black text-slate-900">{{ day }}</th>
                  <th class="w-16 border border-slate-700 bg-rose-100 px-2 py-1.5 text-center font-black text-slate-900">{{ otSummary.rateLabels.oneTimes || '-' }}</th>
                  <th class="w-16 border border-slate-700 bg-yellow-100 px-2 py-1.5 text-center font-black text-slate-900">{{ otSummary.rateLabels.onePointFive || '-' }}</th>
                  <th class="w-16 border border-slate-700 bg-pink-100 px-2 py-1.5 text-center font-black text-slate-900">{{ otSummary.rateLabels.oneTimes || '-' }}</th>
                  <th class="w-20 border border-slate-700 bg-amber-100 px-2 py-1.5 text-center font-black text-slate-900">{{ otSummary.rateLabels.onePointFive || '-' }}</th>
                  <th class="w-20 border border-slate-700 bg-cyan-300 px-2 py-1.5 text-center font-black text-sky-900">{{ otSummary.rateLabels.totalPay || '-' }}</th>
                  <th class="w-16 border border-slate-700 bg-orange-100 px-2 py-1.5 text-center font-black text-slate-900">{{ otSummary.rateLabels.threeTimes || '-' }}</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="group in otGroups" :key="`ot-group-${group.group}`">
                  <tr class="ot-group-row">
                    <td :colspan="3 + otSummary.days.length" class="border border-slate-700 bg-sky-900 px-2 py-1 text-left font-black text-white">
                      {{ group.group }} · {{ group.rows.length }} ราย
                    </td>
                    <td colspan="6" class="border border-slate-700 bg-sky-900 px-2 py-1 text-right font-black text-white">
                      ยอดจ่ายรวม {{ group.totalPay }}
                    </td>
                  </tr>
                  <tr v-for="(row, rowIndex) in group.rows" :key="row.id" :class="rowIndex % 2 === 0 ? 'bg-emerald-50/60' : 'bg-white'">
                    <td class="sticky left-0 z-10 border border-slate-700 bg-inherit px-2 py-1.5 text-center font-black text-slate-900">{{ row.sequence }}</td>
                    <td class="sticky left-12 z-10 border border-slate-700 bg-inherit px-2 py-1.5 text-center font-black text-sky-800">{{ row.group }}</td>
                    <td class="sticky left-28 z-10 border border-slate-700 bg-inherit px-2 py-1.5 text-left font-semibold text-slate-900">{{ row.name }}</td>
                    <td v-for="(dayValue, dayIndex) in row.days" :key="`${row.id}-${dayIndex}`" class="border border-slate-700 px-1 py-1.5 text-center font-semibold text-slate-900">{{ dayValue }}</td>
                    <td class="border border-slate-700 bg-rose-50 px-2 py-1.5 text-right font-bold text-slate-900">{{ row.holidayHours }}</td>
                    <td class="border border-slate-700 bg-yellow-50 px-2 py-1.5 text-right font-bold text-slate-900">{{ row.totalOnePointFiveHours }}</td>
                    <td class="border border-slate-700 bg-pink-50 px-2 py-1.5 text-right font-bold text-slate-900">{{ row.oneTimesAmount }}</td>
                    <td class="border border-slate-700 bg-amber-50 px-2 py-1.5 text-right font-bold text-slate-900">{{ row.onePointFiveAmount }}</td>
                    <td class="border border-slate-700 bg-cyan-300 px-2 py-1.5 text-right font-black text-slate-900">{{ row.totalPay }}</td>
                    <td class="border border-slate-700 bg-orange-50 px-2 py-1.5 text-right font-bold text-slate-900">{{ row.threeTimesAmount }}</td>
                  </tr>
                </template>
              </tbody>
              <tfoot v-if="otSummary.totals" class="sticky bottom-0 z-20">
                <tr>
                  <td :colspan="3 + otSummary.days.length" class="border border-slate-700 bg-emerald-50 px-2 py-2 text-right font-black text-slate-900">{{ otSummary.totals.label }}</td>
                  <td class="border border-slate-700 bg-rose-50 px-2 py-2 text-right font-black text-slate-900">{{ otSummary.totals.holidayHours }}</td>
                  <td class="border border-slate-700 bg-yellow-50 px-2 py-2 text-right font-black text-slate-900">{{ otSummary.totals.totalOnePointFiveHours }}</td>
                  <td class="border border-slate-700 bg-pink-50 px-2 py-2 text-right font-black text-slate-900">{{ otSummary.totals.oneTimesAmount }}</td>
                  <td class="border border-slate-700 bg-amber-50 px-2 py-2 text-right font-black text-slate-900">{{ otSummary.totals.onePointFiveAmount }}</td>
                  <td class="border border-slate-700 bg-yellow-300 px-2 py-2 text-right font-black text-slate-900">{{ otSummary.totals.totalPay }}</td>
                  <td class="border border-slate-700 bg-orange-50 px-2 py-2 text-right font-black text-slate-900">{{ otSummary.totals.threeTimesAmount }}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div v-if="activeTab !== 'ot' && activeTab !== 'otEmployee' && showOTCheckError && otCheckError && otCheckError.rows.length > 0" class="mt-4 space-y-4">
            <section v-for="group in currentOTGroups" :key="`ot-check-${group.group}`" class="rounded-lg border border-pink-200 bg-pink-50/40 p-3">
              <div class="mb-2 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h4 class="border-l-8 border-red-500 pl-3 text-base font-black text-slate-950">
                    ตรวจสอบข้อผิดพลาด OT ลูกจ้าง {{ group.group }}
                  </h4>
                  <p class="mt-0.5 text-[11px] font-bold text-slate-500">
                    {{ otCheckError.title }} · {{ group.checkRows.length }} ราย
                  </p>
                </div>
                <div class="rounded-md bg-red-600 px-3 py-1 text-right text-white">
                  <p class="text-[10px] font-black">รวมข้อผิดพลาด</p>
                  <p class="text-sm font-black">{{ group.errorTotal }}</p>
                </div>
              </div>

              <div class="overflow-hidden rounded-md border border-slate-700 bg-white">
                <table class="ot-check-table w-full border-collapse">
                  <colgroup>
                    <col class="ot-check-col-seq" />
                    <col class="ot-check-col-id" />
                    <col class="ot-check-col-name" />
                    <col v-for="day in otCheckError.days" :key="`check-col-${group.group}-${day}`" class="ot-check-col-day" />
                    <col class="ot-check-col-total" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th :colspan="3 + otCheckError.days.length + 1" class="border border-slate-700 bg-red-600 px-2 py-1 text-center font-black text-slate-950">
                        CHECK OT ERROR ลูกจ้าง {{ group.group }}
                      </th>
                    </tr>
                    <tr>
                      <th class="w-10 border border-slate-700 bg-slate-300 px-2 py-1 text-center font-black text-slate-900">ลำดับ</th>
                      <th class="w-14 border border-slate-700 bg-slate-300 px-2 py-1 text-center font-black text-slate-900">รหัส</th>
                      <th class="ot-check-name-cell border border-slate-700 bg-slate-300 px-2 py-1 text-center font-black text-slate-900">ชื่อ</th>
                      <th v-for="day in otCheckError.days" :key="`check-${group.group}-${day}`" class="border border-slate-700 bg-slate-300 px-1 py-1 text-center font-black text-slate-900">
                        {{ day }}
                      </th>
                      <th class="w-14 border border-slate-700 bg-slate-300 px-2 py-1 text-center font-black text-slate-900">รวม</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, rowIndex) in group.checkRows" :key="row.id" :class="rowIndex % 2 === 0 ? 'bg-white' : 'bg-pink-50/60'">
                      <td class="border border-slate-700 px-2 py-1 text-center font-black text-slate-900">{{ row.sequence }}</td>
                      <td class="border border-slate-700 px-2 py-1 text-center font-bold text-slate-900">{{ row.employeeId }}</td>
                      <td class="ot-check-name-cell border border-slate-700 px-2 py-1 text-left font-bold text-slate-950">{{ row.name }}</td>
                      <td
                        v-for="(isValid, dayIndex) in row.checks"
                        :key="`${row.id}-check-${dayIndex}`"
                        class="border border-slate-700 px-1 py-1 text-center font-black"
                        :class="isValid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-600 text-white'"
                      >
                        {{ isValid ? '✓' : '' }}
                      </td>
                      <td class="border border-slate-700 bg-red-600 px-2 py-1 text-center font-black text-white">{{ row.errorCount }}</td>
                    </tr>
                    <tr v-if="group.checkRows.length === 0">
                      <td :colspan="3 + otCheckError.days.length + 1" class="border border-slate-700 bg-white px-2 py-4 text-center font-bold text-slate-500">
                        ไม่พบข้อมูลตรวจสอบของ {{ group.group }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
        <div v-else class="text-slate-500 font-bold text-center py-10">ไม่พบข้อมูล</div>
      </section>
      </template>

    </main>
  </div>
</template>

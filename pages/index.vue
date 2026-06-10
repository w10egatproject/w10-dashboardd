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
const activeTab = ref<'dashboard' | 'report' | 'ot'>('dashboard');
const selectedMonth = ref('');
const selectedYear = ref('');
const isApplyingFilters = ref(false);

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
const maxWeekEntrance = computed(() => Math.max(...weeks.map(week => data.value?.groupStats[week].entrance || 0), 1));
const maxEquipmentWeekValue = computed(() => Math.max(...equipmentItems.value.flatMap(item => item.values || []), 1));
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
          :class="activeTab === 'ot' ? 'bg-sky-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'"
          @click="activeTab = 'ot'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          สรุปโอที
        </button>
      </div>

      <div class="filter-panel rounded-xl p-5 mb-6 border-sky-200 shadow-lg shadow-sky-900/5 bg-white">
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
                  <span class="text-base font-black text-slate-900">{{ week }}</span>
                </div>
              </div>
              
              <div class="grid grid-cols-2 gap-y-4 gap-x-3">
                <!-- Entrance -->
                <div class="flex flex-col">
                  <p class="text-[11px] font-black uppercase text-slate-500 leading-tight">เข้า</p>
                  <p class="text-2xl font-black text-slate-950 leading-none">{{ data?.groupStats[week]?.entrance || 0 }}</p>
                </div>
                <!-- Finished -->
                <div class="flex flex-col">
                  <p class="text-[11px] font-black uppercase text-emerald-600 leading-tight">เสร็จ</p>
                  <p class="text-2xl font-black text-slate-950 leading-none">{{ data?.groupStats[week]?.finish || 0 }}</p>
                </div>
                <!-- Pending/Carried Over -->
                <div class="flex flex-col">
                  <p class="text-[11px] font-black uppercase text-blue-600 leading-tight">ค้าง</p>
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

          <!-- Removed Gauge Section from here -->
        </div>
      </section>

      <!-- New Dedicated Gauge Section -->
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

          <!-- Compact Chart Area -->
          <div class="relative flex-1 rounded-xl bg-slate-50/30 p-4 border border-slate-100">
            <div class="h-[280px] flex flex-col relative">
              <div class="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div v-for="i in 5" :key="`grid-sm-${i}`" class="w-full border-t border-slate-200/50 border-dashed relative">
                  <span class="absolute -left-7 -top-2 text-[9px] font-bold text-slate-400 w-6 text-right">
                    {{ Math.round((maxEquipmentWeekValue / 4) * (5 - i)) }}
                  </span>
                </div>
              </div>

              <div class="flex-1 flex items-end justify-between gap-3 pt-4 pb-1 relative z-10 px-2">
                <div v-for="(week, weekIndex) in weeks" :key="`chart-sm-week-${week}`" class="flex-1 flex flex-col h-full">
                  <div class="flex-1 flex items-end justify-center gap-0.5 lg:gap-1">
                    <div
                      v-for="(item, itemIndex) in equipmentItems"
                      :key="`bar-sm-${week}-${item.name}`"
                      class="relative flex-1 flex flex-col justify-end h-full max-w-[14px]"
                    >
                      <div
                        class="w-full rounded-t-[1px] transition-all duration-700 shadow-sm hover:brightness-110 cursor-pointer group/barsm"
                        :style="{
                          height: equipmentWeekBarHeight(item.values[weekIndex] || 0),
                          backgroundColor: equipmentColor(itemIndex),
                        }"
                      >
                        <div class="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/barsm:opacity-100 transition-all bg-slate-900 text-white px-1.5 py-1 rounded text-[9px] font-bold z-30 shadow-lg whitespace-nowrap pointer-events-none">
                          {{ item.name }}: {{ item.values[weekIndex] }}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="mt-2 pt-2 border-t border-slate-200 text-center">
                    <span class="text-[9px] font-black text-slate-500 uppercase tracking-tighter">{{ week }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
          
          <div class="flex justify-center mt-6 p-4 bg-slate-900 rounded-2xl">
             <span class="text-sm font-black text-white px-8 py-2">
                  รวม W/O ทั้งหมด: {{ data?.statusData.totalWorkOrders || 0 }}
             </span>
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
            <div class="mt-4 pt-4 border-t border-slate-100 text-right">
              <p class="text-sm font-bold text-slate-500">รวมทั้งหมด: <span class="text-xl font-black text-slate-950">{{ data?.procurementData.totalProcurement }}</span></p>
            </div>
          </div>
          
          <!-- Status Summary Card -->
          <div class="dashboard-card rounded-xl shadow-xl border-none bg-white p-6">
            <h3 class="text-lg font-black text-slate-900 mb-6 text-center">สถานะงานซื้อจ้าง</h3>
            <div class="flex items-end justify-between h-64 gap-2 pt-10">
              <div v-for="item in data?.procurementData.statusSummary" :key="item.status" class="flex flex-col items-center flex-1 group">
                <div class="relative w-full flex justify-center items-end bg-slate-100 rounded-t-sm h-full">
                   <!-- Bar with color based on status -->
                   <div class="w-full transition-all duration-500" :style="{ height: `${(item.count / Math.max(...data!.procurementData.statusSummary.map(s => s.count), 1)) * 100}%`, backgroundColor: getStatusColor(item.status) }"></div>
                   <!-- Value Label on top of bar -->
                   <span class="absolute -top-6 text-xs font-black" :style="{ color: getStatusColor(item.status) }">{{ item.count }}</span>
                </div>
                <span class="text-[10px] font-bold text-slate-600 mt-2 text-center rotate-45 origin-top-left whitespace-nowrap">{{ item.status }}</span>
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

      <template v-else-if="activeTab === 'ot'">
      <section class="min-h-[400px] flex items-center justify-center dashboard-card rounded-xl bg-white/50 border-dashed border-2 border-slate-200">
        <div class="text-center">
          <div class="p-4 bg-slate-100 rounded-full text-slate-400 mx-auto w-fit mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <h3 class="text-xl font-black text-slate-400">ยังไม่มีข้อมูลสรุปโอที</h3>
          <p class="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Waiting for data structure</p>
        </div>
      </section>
      </template>

    </main>
  </div>
</template>

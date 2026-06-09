import { getRawDashboardSheets, updateDashboardFilters } from '../utils/googleSheet';
import { normalizeDashboard } from '../utils/dashboardNormalizer';

type DashboardResponse = ReturnType<typeof normalizeDashboard>;

const cache = {
  data: null as DashboardResponse | null,
  expiresAt: 0,
};

const CACHE_MS = 2 * 60 * 1000;

const monthMap: Record<string, string> = {
  '1': 'มกราคม', '2': 'กุมภาพันธ์', '3': 'มีนาคม', '4': 'เมษายน',
  '5': 'พฤษภาคม', '6': 'มิถุนายน', '7': 'กรกฎาคม', '8': 'สิงหาคม',
  '9': 'กันยายน', '10': 'ตุลาคม', '11': 'พฤศจิกายน', '12': 'ธันวาคม'
};

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const year = typeof query.year === 'string' ? query.year : undefined;
  const month = typeof query.month === 'string' ? query.month : undefined;
  const shouldApplyFilters = query.applyFilters === 'true';
  const canUseCache = !shouldApplyFilters && !year && !month;

  if (canUseCache && cache.data && Date.now() < cache.expiresAt) {
    return cache.data;
  }

  if (shouldApplyFilters) {
    cache.data = null;
    cache.expiresAt = 0;

    const initialRaw = await getRawDashboardSheets();
    const initial = normalizeDashboard(initialRaw);

    const targetMonth = month && monthMap[month] ? monthMap[month] : (month === 'all' ? 'all' : month);

    if (year !== initial.currentYear || (targetMonth && targetMonth !== initial.currentMonth)) {
      await updateDashboardFilters(year || initial.currentYear || '2025', targetMonth || initial.currentMonth || 'all');
      await new Promise(resolve => setTimeout(resolve, 4000));
    }
  }

  const dashboard = normalizeDashboard(await getRawDashboardSheets(), { year, month: month && monthMap[month] ? monthMap[month] : month });

  if (canUseCache) {
    cache.data = dashboard;
    cache.expiresAt = Date.now() + CACHE_MS;
  }

  return dashboard;
});

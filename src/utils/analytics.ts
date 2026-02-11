import { Merchant } from '../types/merchant';

export interface DashboardStats {
  totalMerchants: number;
  activeMerchants: number;
  inactiveMerchants: number;
  unknownMerchants: number;
  merchantsByCluster: { name: string; count: number }[];
  merchantsByType: { name: string; count: number }[];
  merchantsByStatus: { name: string; count: number; color: string }[];
  merchantsByCountry: { name: string; count: number }[];
  recentMerchants: Merchant[];
  growthData: { month: string; count: number }[];
}

/**
 * Format date to "MMM YYYY" format
 */
const formatMonthYear = (date: Date): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

/**
 * Parse "MMM YYYY" format back to Date
 */
const parseMonthYear = (monthYear: string): Date => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [monthStr, yearStr] = monthYear.split(' ');
  const monthIndex = months.indexOf(monthStr);
  const year = parseInt(yearStr);
  return new Date(year, monthIndex, 1);
};

/**
 * Calculate merchant growth data by month
 */
const calculateGrowthData = (merchants: Merchant[]): { month: string; count: number }[] => {
  if (merchants.length === 0) {
    return [];
  }

  // Group merchants by month
  const monthsMap = new Map<string, number>();

  merchants.forEach(merchant => {
    const createdDate = new Date(merchant.createdAt);
    if (!isNaN(createdDate.getTime())) {
      const monthKey = formatMonthYear(createdDate);
      monthsMap.set(monthKey, (monthsMap.get(monthKey) || 0) + 1);
    }
  });

  // Sort by date and get the last 6 months with data
  const sortedMonths = Array.from(monthsMap.entries())
    .sort((a, b) => {
      const dateA = parseMonthYear(a[0]);
      const dateB = parseMonthYear(b[0]);
      return dateA.getTime() - dateB.getTime();
    })
    .slice(-6);

  return sortedMonths.map(([month, count]) => ({
    month,
    count,
  }));
};

/**
 * Calculate comprehensive analytics from merchant data
 */
export const calculateDashboardStats = (merchants: Merchant[]): DashboardStats => {
  const totalMerchants = merchants.length;

  console.log('calculateDashboardStats - Total merchants:', totalMerchants);
  console.log('calculateDashboardStats - Sample merchant:', merchants[0]);
  console.log('calculateDashboardStats - Merchant statuses:', merchants.map(m => m.status));

  // Case-insensitive status filtering
  const activeMerchants = merchants.filter(m => m.status?.toLowerCase() === 'active').length;
  const inactiveMerchants = merchants.filter(m => m.status?.toLowerCase() === 'inactive').length;
  const unknownMerchants = merchants.filter(m => {
    const status = m.status?.toLowerCase();
    return !status || (status !== 'active' && status !== 'inactive');
  }).length;

  console.log('Active:', activeMerchants, 'Inactive:', inactiveMerchants, 'Unknown:', unknownMerchants);

  // Group by cluster
  const clusterMap = new Map<string, number>();
  merchants.forEach(merchant => {
    const count = clusterMap.get(merchant.cluster) || 0;
    clusterMap.set(merchant.cluster, count + 1);
  });
  const merchantsByCluster = Array.from(clusterMap.entries()).map(([name, count]) => ({
    name,
    count,
  }));

  // Group by business type
  const typeMap = new Map<string, number>();
  merchants.forEach(merchant => {
    const type = merchant.businessType || merchant.cluster || 'Other';
    const count = typeMap.get(type) || 0;
    typeMap.set(type, count + 1);
  });
  const merchantsByType = Array.from(typeMap.entries()).map(([name, count]) => ({
    name,
    count,
  }));

  // Status distribution with refined colors matching Dashboard Stat Cards
  const merchantsByStatus = [
    { name: 'Active', count: activeMerchants, color: '#36b37e' },      // Success Green
    { name: 'Inactive', count: inactiveMerchants, color: '#ff5630' },  // Error Red
    { name: 'Unknown', count: unknownMerchants, color: '#ffab00' },    // Warning Orange
  ].filter(item => item.count > 0);

  // Group by country
  const countryMap = new Map<string, number>();
  merchants.forEach(merchant => {
    if (merchant.country) {
      const count = countryMap.get(merchant.country) || 0;
      countryMap.set(merchant.country, count + 1);
    }
  });
  const merchantsByCountry = Array.from(countryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 countries

  // Recent merchants (last 10) - taking the tail of the array and reversing it
  // This ensures the absolute latest items from the API response are shown first
  const recentMerchants = [...merchants].slice(-10).reverse();

  // Growth data by month (last 6 months)
  const growthData = calculateGrowthData(merchants);

  return {
    totalMerchants,
    activeMerchants,
    inactiveMerchants,
    unknownMerchants,
    merchantsByCluster,
    merchantsByType,
    merchantsByStatus,
    merchantsByCountry,
    recentMerchants,
    growthData,
  };
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (part: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
};

/**
 * Format number with commas
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

/**
 * Calculate growth rate
 */
export const calculateGrowthRate = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

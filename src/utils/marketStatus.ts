export interface MarketStatusInfo {
  isOpen: boolean;
  statusText: 'MARKET OPEN' | 'MARKET CLOSED' | 'PRE-OPEN' | 'POST-MARKET';
  textColor: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
  detailText: string;
}

export const getIndianMarketStatus = (): MarketStatusInfo => {
  const now = new Date();
  
  // Calculate Indian Standard Time (IST = UTC + 5h 30m)
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const istMs = utcMs + 5.5 * 3600000;
  const istDate = new Date(istMs);

  const dayOfWeek = istDate.getDay(); // 0 = Sun, 6 = Sat
  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // Weekend: Saturday or Sunday
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return {
      isOpen: false,
      statusText: 'MARKET CLOSED',
      textColor: 'text-[#8D99A8]',
      bgColor: 'bg-[#111820]',
      borderColor: 'border-[#202A35]',
      dotColor: 'bg-[#596574]',
      detailText: 'Weekend (NSE/BSE Closed)',
    };
  }

  // Pre-Open: 09:00 AM - 09:15 AM IST (540 - 555 mins)
  if (timeInMinutes >= 540 && timeInMinutes < 555) {
    return {
      isOpen: false,
      statusText: 'PRE-OPEN',
      textColor: 'text-[#F59E0B]',
      bgColor: 'bg-[#F59E0B]/10',
      borderColor: 'border-[#F59E0B]/30',
      dotColor: 'bg-[#F59E0B]',
      detailText: 'Pre-Market Session (09:00 - 09:15 IST)',
    };
  }

  // Normal Trading Session: 09:15 AM - 03:30 PM IST (555 - 930 mins)
  if (timeInMinutes >= 555 && timeInMinutes < 930) {
    return {
      isOpen: true,
      statusText: 'MARKET OPEN',
      textColor: 'text-[#22C55E]',
      bgColor: 'bg-[#22C55E]/10',
      borderColor: 'border-[#22C55E]/30',
      dotColor: 'bg-[#22C55E]',
      detailText: 'NSE/BSE Live (09:15 - 15:30 IST)',
    };
  }

  // Post-Market Session: 03:30 PM - 04:00 PM IST (930 - 960 mins)
  if (timeInMinutes >= 930 && timeInMinutes < 960) {
    return {
      isOpen: false,
      statusText: 'POST-MARKET',
      textColor: 'text-[#F59E0B]',
      bgColor: 'bg-[#F59E0B]/10',
      borderColor: 'border-[#F59E0B]/30',
      dotColor: 'bg-[#F59E0B]',
      detailText: 'Post-Market Session (15:30 - 16:00 IST)',
    };
  }

  // Market Closed: Before 09:00 AM or After 04:00 PM IST
  return {
    isOpen: false,
    statusText: 'MARKET CLOSED',
    textColor: 'text-[#EF4444]',
    bgColor: 'bg-[#EF4444]/10',
    borderColor: 'border-[#EF4444]/30',
    dotColor: 'bg-[#EF4444]',
    detailText: 'Closed (Opens 09:15 AM IST)',
  };
};

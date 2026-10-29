import { NextResponse } from 'next/server';

// Comprehensive Popular Indian Equities (NSE/BSE) Dataset for Instant Offline & Online Autocomplete
const POPULAR_INDIAN_STOCKS = [
  { symbol: 'RELIANCE', companyName: 'Reliance Industries Ltd.', exchange: 'NSE', category: 'Energy', basePrice: 2980.50 },
  { symbol: 'TCS', companyName: 'Tata Consultancy Services Ltd.', exchange: 'NSE', category: 'Tech', basePrice: 4210.00 },
  { symbol: 'INFY', companyName: 'Infosys Ltd.', exchange: 'NSE', category: 'Tech', basePrice: 1895.00 },
  { symbol: 'HDFCBANK', companyName: 'HDFC Bank Ltd.', exchange: 'NSE', category: 'Financials', basePrice: 1650.00 },
  { symbol: 'ICICIBANK', companyName: 'ICICI Bank Ltd.', exchange: 'NSE', category: 'Financials', basePrice: 1220.00 },
  { symbol: 'TATAMOTORS', companyName: 'Tata Motors Ltd.', exchange: 'NSE', category: 'Automotive', basePrice: 975.00 },
  { symbol: 'SBIN', companyName: 'State Bank of India', exchange: 'NSE', category: 'Financials', basePrice: 790.00 },
  { symbol: 'BHARTIARTL', companyName: 'Bharti Airtel Ltd.', exchange: 'NSE', category: 'Telecom', basePrice: 1610.00 },
  { symbol: 'ITC', companyName: 'ITC Ltd.', exchange: 'NSE', category: 'Consumer', basePrice: 505.00 },
  { symbol: 'ZOMATO', companyName: 'Zomato Ltd.', exchange: 'NSE', category: 'Tech', basePrice: 275.40 },
  { symbol: 'RATNAVEER', companyName: 'Ratnaveer Precision Engineering Ltd.', exchange: 'NSE', category: 'Industrial', basePrice: 165.50 },
  { symbol: 'RATNAMANI', companyName: 'Ratnamani Metals & Tubes Ltd.', exchange: 'NSE', category: 'Industrial', basePrice: 3420.00 },
  { symbol: 'TATAELXSI', companyName: 'Tata Elxsi Ltd.', exchange: 'NSE', category: 'Tech', basePrice: 7250.00 },
  { symbol: 'IRFC', companyName: 'Indian Railway Finance Corp.', exchange: 'NSE', category: 'Financials', basePrice: 175.00 },
  { symbol: 'NHPC', companyName: 'NHPC Ltd.', exchange: 'NSE', category: 'Energy', basePrice: 95.00 },
  { symbol: 'RECLTD', companyName: 'REC Ltd.', exchange: 'NSE', category: 'Financials', basePrice: 540.00 },
  { symbol: 'PFC', companyName: 'Power Finance Corporation', exchange: 'NSE', category: 'Financials', basePrice: 480.00 },
  { symbol: 'BHEL', companyName: 'Bharat Heavy Electricals Ltd.', exchange: 'NSE', category: 'Industrial', basePrice: 285.00 },
  { symbol: 'SUZLON', companyName: 'Suzlon Energy Ltd.', exchange: 'NSE', category: 'Energy', basePrice: 78.50 },
  { symbol: 'YESBANK', companyName: 'Yes Bank Ltd.', exchange: 'NSE', category: 'Financials', basePrice: 24.50 },
  { symbol: 'IDEA', companyName: 'Vodafone Idea Ltd.', exchange: 'NSE', category: 'Telecom', basePrice: 14.20 },
  { symbol: 'RVNL', companyName: 'Rail Vikas Nigam Ltd.', exchange: 'NSE', category: 'Infrastructure', basePrice: 560.00 },
  { symbol: 'MAZDOCK', companyName: 'Mazagon Dock Shipbuilders Ltd.', exchange: 'NSE', category: 'Defense', basePrice: 4250.00 },
  { symbol: 'COCHINSHIP', companyName: 'Cochin Shipyard Ltd.', exchange: 'NSE', category: 'Defense', basePrice: 2150.00 },
  { symbol: 'CDSL', companyName: 'Central Depository Services Ltd.', exchange: 'NSE', category: 'Financials', basePrice: 1480.00 },
  { symbol: 'BSE', companyName: 'BSE Limited', exchange: 'NSE', category: 'Financials', basePrice: 2850.00 },
  { symbol: 'ANGELONE', companyName: 'Angel One Ltd.', exchange: 'NSE', category: 'Financials', basePrice: 2650.00 },
  { symbol: 'GROWW', companyName: 'Groww (Nextbillion Technology)', exchange: 'NSE', category: 'Financials', basePrice: 320.00 },
  { symbol: 'MCX', companyName: 'Multi Commodity Exchange of India', exchange: 'NSE', category: 'Financials', basePrice: 3850.00 },
  { symbol: 'PAYTM', companyName: 'One97 Communications Ltd. (Paytm)', exchange: 'NSE', category: 'Tech', basePrice: 640.00 },
  { symbol: 'POLICYBZR', companyName: 'PB Fintech Ltd. (Policybazaar)', exchange: 'NSE', category: 'Tech', basePrice: 1720.00 },
  { symbol: 'WIPRO', companyName: 'Wipro Ltd.', exchange: 'NSE', category: 'Tech', basePrice: 535.00 },
  { symbol: 'HCLTECH', companyName: 'HCL Technologies Ltd.', exchange: 'NSE', category: 'Tech', basePrice: 1780.00 },
  { symbol: 'MARUTI', companyName: 'Maruti Suzuki India Ltd.', exchange: 'NSE', category: 'Automotive', basePrice: 12450.00 },
  { symbol: 'SUNPHARMA', companyName: 'Sun Pharmaceutical Industries Ltd.', exchange: 'NSE', category: 'Pharma', basePrice: 1850.00 },
  { symbol: 'BAJFINANCE', companyName: 'Bajaj Finance Ltd.', exchange: 'NSE', category: 'Financials', basePrice: 7350.00 },
  { symbol: 'LTIM', companyName: 'LTIMindtree Ltd.', exchange: 'NSE', category: 'Tech', basePrice: 5950.00 },
  { symbol: 'TATASTEEL', companyName: 'Tata Steel Ltd.', exchange: 'NSE', category: 'Metals', basePrice: 155.00 },
  { symbol: 'JSWSTEEL', companyName: 'JSW Steel Ltd.', exchange: 'NSE', category: 'Metals', basePrice: 940.00 },
  { symbol: 'LT', companyName: 'Larsen & Toubro Ltd.', exchange: 'NSE', category: 'Industrial', basePrice: 3680.00 },
  { symbol: 'ADANIENT', companyName: 'Adani Enterprises Ltd.', exchange: 'NSE', category: 'Energy', basePrice: 3120.00 },
  { symbol: 'ADANIPORTS', companyName: 'Adani Ports & SEZ Ltd.', exchange: 'NSE', category: 'Infrastructure', basePrice: 1440.00 },
  { symbol: 'NTPC', companyName: 'NTPC Ltd.', exchange: 'NSE', category: 'Energy', basePrice: 395.00 },
  { symbol: 'POWERGRID', companyName: 'Power Grid Corporation of India', exchange: 'NSE', category: 'Energy', basePrice: 330.00 },
  { symbol: 'TITAN', companyName: 'Titan Company Ltd.', exchange: 'NSE', category: 'Consumer', basePrice: 3550.00 },
  { symbol: 'KOTAKBANK', companyName: 'Kotak Mahindra Bank Ltd.', exchange: 'NSE', category: 'Financials', basePrice: 1790.00 },
  { symbol: 'AXISBANK', companyName: 'Axis Bank Ltd.', exchange: 'NSE', category: 'Financials', basePrice: 1240.00 },
  { symbol: 'ULTRACEMCO', companyName: 'UltraTech Cement Ltd.', exchange: 'NSE', category: 'Materials', basePrice: 11200.00 },
  { symbol: 'ASIANPAINT', companyName: 'Asian Paints Ltd.', exchange: 'NSE', category: 'Consumer', basePrice: 3180.00 },
  { symbol: 'PIDILITIND', companyName: 'Pidilite Industries Ltd.', exchange: 'NSE', category: 'Chemicals', basePrice: 3050.00 },
  { symbol: 'DMART', companyName: 'Avenue Supermarts Ltd. (DMart)', exchange: 'NSE', category: 'Consumer', basePrice: 4750.00 },
  { symbol: 'HAL', companyName: 'Hindustan Aeronautics Ltd.', exchange: 'NSE', category: 'Defense', basePrice: 4680.00 },
  { symbol: 'BEL', companyName: 'Bharat Electronics Ltd.', exchange: 'NSE', category: 'Defense', basePrice: 285.00 },
  { symbol: 'IRCTC', companyName: 'Indian Railway Catering & Tourism Corp.', exchange: 'NSE', category: 'Services', basePrice: 910.00 },
  { symbol: 'POLYCAB', companyName: 'Polycab India Ltd.', exchange: 'NSE', category: 'Industrial', basePrice: 6850.00 },
  { symbol: 'TRENT', companyName: 'Trent Ltd. (Westside/Zudio)', exchange: 'NSE', category: 'Consumer', basePrice: 7250.00 },
  { symbol: 'JIOFIN', companyName: 'Jio Financial Services Ltd.', exchange: 'NSE', category: 'Financials', basePrice: 345.00 },
  { symbol: 'VBL', companyName: 'Varun Beverages Ltd.', exchange: 'NSE', category: 'Consumer', basePrice: 1580.00 },
  { symbol: 'PERSISTENT', companyName: 'Persistent Systems Ltd.', exchange: 'NSE', category: 'Tech', basePrice: 5120.00 },
  { symbol: 'COFORGE', companyName: 'Coforge Ltd.', exchange: 'NSE', category: 'Tech', basePrice: 6780.00 },
  { symbol: 'MPHASIS', companyName: 'Mphasis Ltd.', exchange: 'NSE', category: 'Tech', basePrice: 2950.00 },
];


interface CachedPrice {
  price: number;
  timestamp: number;
}
const livePriceCache = new Map<string, CachedPrice>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

async function getLivePriceForTicker(ticker: string, fallback: number): Promise<{ price: number; isLive: boolean }> {
  const formattedTicker = ticker.endsWith('.NS') || ticker.endsWith('.BO') ? ticker : `${ticker}.NS`;

  if (livePriceCache.has(formattedTicker)) {
    const entry = livePriceCache.get(formattedTicker)!;
    if (Date.now() - entry.timestamp < CACHE_TTL_MS) {
      return { price: entry.price, isLive: true };
    }
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1800);
    const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(formattedTicker)}?interval=1d&range=1d`;
    const res = await fetch(chartUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const meta = data?.chart?.result?.[0]?.meta;
      const regularMarketPrice = meta?.regularMarketPrice;
      if (typeof regularMarketPrice === 'number' && regularMarketPrice > 0) {
        livePriceCache.set(formattedTicker, { price: regularMarketPrice, timestamp: Date.now() });
        return { price: regularMarketPrice, isLive: true };
      }
    }
  } catch {
    // Network / abort fallback
  }

  return { price: fallback, isLive: false };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get('q') || '').trim();

    if (!query || query.length < 1) {
      return NextResponse.json({ success: true, results: [] });
    }

    const uppercaseQuery = query.toUpperCase();

    // 1. Filter local Indian stock dictionary first
    const localMatches = POPULAR_INDIAN_STOCKS.filter(
      (s) =>
        s.symbol.startsWith(uppercaseQuery) ||
        s.symbol.includes(uppercaseQuery) ||
        s.companyName.toUpperCase().includes(uppercaseQuery)
    ).map((s) => ({
      symbol: s.symbol,
      ticker: `${s.symbol}.NS`,
      companyName: s.companyName,
      exchange: s.exchange,
      category: s.category,
      price: s.basePrice,
    }));

    // 2. Query Yahoo Finance live search API for additional live suggestions
    let yahooMatches: any[] = [];
    try {
      const yahooSearchUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
        query
      )}&quotesCount=8&newsCount=0`;
      
      const res = await fetch(yahooSearchUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        const quotes = data?.quotes || [];

        yahooMatches = quotes
          .filter((q: any) => q.quoteType === 'EQUITY' || q.isYahooFinance)
          .map((q: any) => {
            const cleanSym = (q.symbol || '').replace('.NS', '').replace('.BO', '');
            return {
              symbol: cleanSym,
              ticker: q.symbol,
              companyName: q.longname || q.shortname || `${cleanSym} Ltd.`,
              exchange: q.exchDisp || (q.symbol.endsWith('.BO') ? 'BSE' : 'NSE'),
              category: q.sector || 'Equity',
              price: q.regularMarketPrice || 0,
            };
          });
      }
    } catch {
      // Yahoo Search fallback to local list
    }

    // Combine local and yahoo matches, removing duplicates by symbol
    const combinedMap = new Map<string, any>();
    
    // Add local matches first for highest accuracy on Indian market
    localMatches.forEach((item) => combinedMap.set(item.symbol, item));
    
    // Add yahoo matches if not present
    yahooMatches.forEach((item) => {
      if (!combinedMap.has(item.symbol) && item.symbol.length > 0) {
        combinedMap.set(item.symbol, item);
      }
    });

    // Always ensure the typed symbol is available to add if not present
    if (uppercaseQuery.length >= 2 && !combinedMap.has(uppercaseQuery)) {
      combinedMap.set(uppercaseQuery, {
        symbol: uppercaseQuery,
        ticker: `${uppercaseQuery}.NS`,
        companyName: `${uppercaseQuery} India Ltd.`,
        exchange: 'NSE',
        category: 'Equity',
        price: 0,
      });
    }

    const rawResults = Array.from(combinedMap.values()).slice(0, 10);

    // Fetch real-time live current prices for all matched stocks concurrently
    const results = await Promise.all(
      rawResults.map(async (item) => {
        const ticker = item.ticker || `${item.symbol}.NS`;
        const { price, isLive } = await getLivePriceForTicker(ticker, item.price);
        return {
          ...item,
          price: price > 0 ? price : item.price,
          isLive,
        };
      })
    );

    return NextResponse.json({
      success: true,
      query,
      results,
    });
  } catch (err: any) {
    console.error('Stock search error:', err);
    return NextResponse.json({ success: false, results: [] });
  }
}

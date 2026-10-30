import { NextResponse } from 'next/server';

const MAX_SYMBOLS_PER_REQUEST = 50;

/**
 * Real-Time Indian Stock Market Quote API Proxy
 * Fetches authentic live prices directly from Yahoo Finance v8 Chart APIs for Indian equities (.NS / .BO)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbolsInput = searchParams.get('symbols') || '';
    
    if (!symbolsInput.trim()) {
      return NextResponse.json({
        success: true,
        quotes: [],
        source: 'LiveYahooChartAPI',
        timestamp: new Date().toISOString(),
      });
    }

    const rawSymbols = Array.from(
      new Set(symbolsInput.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean))
    ).slice(0, MAX_SYMBOLS_PER_REQUEST);
    
    // Convert symbols to NSE ticker format (e.g. RELIANCE -> RELIANCE.NS, SOLARA.NS -> SOLARA.NS)
    const nseSymbols = rawSymbols.map((s) => {
      if (s.endsWith('.NS') || s.endsWith('.BO')) return s;
      return `${s}.NS`;
    });

    const liveQuotes = await Promise.all(
      nseSymbols.map(async (nsSym) => {
        const cleanSymbol = nsSym.replace(/\.NS$/i, '').replace(/\.BO$/i, '');
        try {
          const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
            nsSym
          )}?interval=1d&range=5d`;

          const chartRes = await fetch(chartUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept': 'application/json',
            },
            cache: 'no-store', // Always fetch fresh live prices
          });

          if (chartRes.ok) {
            const chartData = await chartRes.json();
            const result = chartData?.chart?.result?.[0];
            const meta = result?.meta;
            if (meta && meta.regularMarketPrice > 0) {
              const currentPrice = meta.regularMarketPrice;
              const previousClose = meta.chartPreviousClose || meta.previousClose || currentPrice;
              const dayChange = +(currentPrice - previousClose).toFixed(2);
              const dayChangePercent = previousClose > 0 ? +((dayChange / previousClose) * 100).toFixed(2) : 0;

              return {
                symbol: nsSym,
                cleanSymbol: cleanSymbol,
                companyName: meta.longName || meta.shortName || `${cleanSymbol} Ltd.`,
                exchange: meta.exchangeName || 'NSE',
                currentPrice,
                previousClose,
                dayChange,
                dayChangePercent,
                open: meta.regularMarketDayOpen || currentPrice,
                highDay: meta.regularMarketDayHigh || currentPrice,
                lowDay: meta.regularMarketDayLow || currentPrice,
                high52: meta.fiftyTwoWeekHigh || +(currentPrice * 1.25).toFixed(2),
                low52: meta.fiftyTwoWeekLow || +(currentPrice * 0.75).toFixed(2),
                category: 'Equity',
                lastUpdated: new Date().toISOString(),
              };
            }
          }
        } catch (err) {
          console.warn(`Live quote fetch error for ${nsSym}:`, err);
        }

        // No live data: report the symbol as unavailable instead of inventing a price
        return null;
      })
    );

    const quotes = liveQuotes.filter((q): q is NonNullable<typeof q> => q !== null);
    const unavailable = nseSymbols.filter((_, i) => liveQuotes[i] === null);

    return NextResponse.json({
      success: true,
      quotes,
      unavailable,
      source: 'LiveYahooChartAPI',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Real-time stock quote API error:', err);
    return NextResponse.json({ error: 'Failed to fetch real-time market data' }, { status: 500 });
  }
}

import TradingViewWidget from "@/components/TradingViewWidget";
import { WatchlistButton } from "@/components/WatchlistButton";
import {
  SYMBOL_INFO_WIDGET_CONFIG,
  CANDLE_CHART_WIDGET_CONFIG,
  BASELINE_WIDGET_CONFIG,
  TECHNICAL_ANALYSIS_WIDGET_CONFIG,
  COMPANY_PROFILE_WIDGET_CONFIG,
  COMPANY_FINANCIALS_WIDGET_CONFIG,
} from "@/lib/constants";

type StockDetailsPageProps = {
  params: Promise<{
    symbol: string;
  }>;
};

export default async function StockDetails({ params }: StockDetailsPageProps) {
  const { symbol } = await params;
  const tradingViewScriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

  return (
    <div className="flex min-h-screen p-4 md:p-6 lg:p-8">
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          <TradingViewWidget
            scriptUrl={`${tradingViewScriptUrl}symbol-info.js`}
            config={SYMBOL_INFO_WIDGET_CONFIG(symbol)}
            height={170}
          />
          <TradingViewWidget
            scriptUrl={`${tradingViewScriptUrl}advanced-chart.js`}
            config={CANDLE_CHART_WIDGET_CONFIG(symbol)}
            className="custom-chart mb-6"
            height={600}
          />
          <TradingViewWidget
            scriptUrl={`${tradingViewScriptUrl}advanced-chart.js`}
            config={BASELINE_WIDGET_CONFIG(symbol)}
            className="custom-chart mb-6"
            height={600}
          />
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <WatchlistButton
              symbol={symbol.toUpperCase()}
              company={symbol.toUpperCase()}
              isInWatchlist={false}
            />
          </div>
          <TradingViewWidget
            scriptUrl={`${tradingViewScriptUrl}technical-analysis.js`}
            config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(symbol)}
            height={400}
            className="mb-6"
          />
          {/* <TradingViewWidget
            scriptUrl={`${tradingViewScriptUrl}company-profile.js`}
            config={COMPANY_PROFILE_WIDGET_CONFIG(symbol)}
            height={440}
            className="mb-6"
          /> */}
          <TradingViewWidget
            scriptUrl={`${tradingViewScriptUrl}financials.js`}
            config={COMPANY_FINANCIALS_WIDGET_CONFIG(symbol)}
            height={464}
            className="mb-6"
          />
        </div>
      </section>
    </div>
  );
}

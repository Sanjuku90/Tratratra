import { useEffect, useRef } from "react";
import { createChart, ColorType, CrosshairMode, CandlestickSeries } from "lightweight-charts";
import type { UTCTimestamp } from "lightweight-charts";
import type { Candle } from "@workspace/api-client-react";

interface CandlestickChartProps {
  candles: Candle[];
  symbol: string;
}

export function CandlestickChart({ candles, symbol }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "hsl(215, 20.2%, 65.1%)",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.05)" },
        horzLines: { color: "rgba(255,255,255,0.05)" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.1)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.1)",
        timeVisible: true,
        secondsVisible: false,
      },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight || 320,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    const sorted = [...candles].sort((a, b) => a.time - b.time);
    candleSeries.setData(
      sorted.map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    });

    ro.observe(containerRef.current);

    return () => {
      chart.remove();
      ro.disconnect();
    };
  }, [candles, symbol]);

  return <div ref={containerRef} className="w-full h-full min-h-[300px]" />;
}

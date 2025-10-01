import { useEffect, useRef, useState } from "react";

export default function MarketChart({ market }) {
  const canvasRef = useRef(null);
  const [chartData, setChartData] = useState([]);

  // Generate realistic market data based on current price
  useEffect(() => {
    const yesPrice = Number(market?.yes_price ?? 0.5);

    // Generate 1500 data points for smooth, clean lines
    const points = 1500;
    const yesData = [];
    const noData = [];

    // Start both lines at 50/50
    let currentYes = 0.5;
    let currentNo = 0.5;
    let momentum = 0;
    let trendDirection = Math.random() > 0.5 ? 1 : -1;
    let trendStrength = 0;

    for (let i = 0; i < points; i++) {
      // Progressive expansion - volatility increases over time
      const progressRatio = i / points;
      const expansionFactor = Math.pow(progressRatio, 0.8); // Gradual expansion

      // Very low base volatility for ultra-smooth lines
      const baseVolatility = 0.00008 + (expansionFactor * 0.0003);

      // Create trending periods with increasing strength
      if (i % 300 === 0 && i > 0) {
        trendDirection = Math.random() > 0.5 ? trendDirection : -trendDirection;
        trendStrength = Math.random() * 0.0002 * (1 + expansionFactor * 0.5);
      }

      // Trend bias increases over time (creates divergence)
      const trendBias = trendDirection * trendStrength * (1 + expansionFactor * 1.5);

      // Rare larger movements (very occasional events)
      const eventChance = 0.01 + (expansionFactor * 0.015);
      const hasEvent = Math.random() < eventChance;
      const eventImpact = hasEvent ? (Math.random() - 0.5) * 0.012 * (1 + expansionFactor * 0.8) : 0;

      // High momentum decay for very smooth trends
      const momentumDecay = 0.99;
      const randomImpulse = (Math.random() - 0.5) * baseVolatility;
      momentum = momentum * momentumDecay + randomImpulse + eventImpact + trendBias;

      // Apply momentum to price
      currentYes += momentum;

      // Weak mean reversion that decreases over time (allows divergence)
      const meanReversionStrength = 0.00005 * (1 - expansionFactor * 0.6);
      const pullToMean = (yesPrice - currentYes) * meanReversionStrength;
      currentYes += pullToMean;

      // Keep within realistic bounds
      currentYes = Math.max(0.15, Math.min(0.85, currentYes));
      currentNo = 1 - currentYes;

      yesData.push(currentYes);
      noData.push(currentNo);
    }

    setChartData({ yesData, noData });
  }, [market]);

  // Animate chart data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setChartData((prev) => {
        if (!prev.yesData) return prev;
        
        const yesData = [...prev.yesData];
        const noData = [...prev.noData];
        
        // Shift data left and add new point
        yesData.shift();
        noData.shift();
        
        const lastYes = yesData[yesData.length - 1];
        const lastNo = noData[noData.length - 1];
        
        const variance = (Math.random() - 0.5) * 0.05;
        yesData.push(Math.max(0, Math.min(1, lastYes + variance)));
        noData.push(Math.max(0, Math.min(1, lastNo - variance)));
        
        return { yesData, noData };
      });
    }, 2000); // Update every 2 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Draw chart on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !chartData.yesData) return;
    
    const ctx = canvas.getContext("2d");
    const { width, height } = canvas.getBoundingClientRect();
    
    // Set canvas size for retina displays
    canvas.width = width * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid lines
    ctx.strokeStyle = "#e5e7eb40";
    ctx.lineWidth = 0.5;

    // Horizontal grid lines (only 3 lines: 25%, 50%, 75%)
    for (let i = 1; i <= 3; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw YES line (blue)
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    chartData.yesData.forEach((value, index) => {
      const x = (width / (chartData.yesData.length - 1)) * index;
      const y = height - value * height;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw NO line (red)
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    chartData.noData.forEach((value, index) => {
      const x = (width / (chartData.noData.length - 1)) * index;
      const y = height - value * height;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw percentage labels (smaller, on left side)
    ctx.fillStyle = "#9ca3af";
    ctx.font = "9px sans-serif";
    ctx.textAlign = "left";

    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      const percentage = 100 - (i * 25);
      ctx.fillText(`${percentage}%`, 2, y + 3);
    }
    
  }, [chartData]);

  const yesPct = Math.round((chartData.yesData?.[chartData.yesData.length - 1] ?? 0.5) * 100);
  const noPct = 100 - yesPct;

  return (
    <div className="relative bg-gradient-to-br from-blue-50/30 to-purple-50/30 dark:from-gray-800 dark:to-gray-900 h-full flex flex-col">
      {/* Current prices at top */}
      <div className="flex justify-between items-start px-3 pt-2 pb-1">
        <div className="text-left">
          <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">YES {yesPct}%</div>
          <div className="text-[10px] text-gray-400">100%</div>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold text-red-600 dark:text-red-400">NO {noPct}%</div>
        </div>
      </div>

      {/* Chart canvas */}
      <div className="flex-1 px-3">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ maxHeight: "160px" }}
        />
      </div>

      {/* Time labels at bottom */}
      <div className="flex justify-between px-3 text-[10px] text-gray-400 dark:text-gray-500">
        <span>10:39</span>
        <span>16:44</span>
        <span>17:37</span>
        <span>18:02</span>
        <span>21:52</span>
        <span>22:53</span>
        <span>0:32</span>
      </div>

      {/* Bet buttons at bottom */}
      <div className="grid grid-cols-2 gap-2 p-3 pt-2">
        <button className="py-2 px-3 bg-[#ECECFD] text-[#009966] rounded font-semibold text-xs transition-colors">
          YES · {yesPct}¢
        </button>
        <button className="py-2 px-3 bg-[#FFF1F2] text-[#FB2C36] rounded font-semibold text-xs  transition-colors">
          NO · {noPct}¢
        </button>
      </div>
    </div>
  );
}


import { useMemo } from "react";

interface SpeedometerProps {
  working: number;
  total: number;
  size?: number;
}

const Speedometer = ({ working, total, size = 200 }: SpeedometerProps) => {
  const percentage = total > 0 ? (working / total) * 100 : 0;
  const angle = useMemo(() => {
    // Map 0-100% to -90 to 90 degrees (180 degree arc)
    return (percentage / 100) * 180 - 90;
  }, [percentage]);

  const getColor = () => {
    if (percentage >= 90) return "hsl(146, 50%, 36%)"; // Primary green
    if (percentage >= 70) return "hsl(51, 100%, 50%)"; // Accent gold
    return "hsl(0, 84%, 60%)"; // Destructive red
  };

  const radius = size / 2 - 10;
  const circumference = Math.PI * radius; // Half circle
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size / 2 + 40 }}>
        <svg
          width={size}
          height={size / 2 + 40}
          viewBox={`0 0 ${size} ${size / 2 + 40}`}
          className="transform"
        >
          {/* Background arc */}
          <path
            d={`M 10 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2}`}
            fill="none"
            stroke="hsl(0, 0%, 90%)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          
          {/* Progress arc */}
          <path
            d={`M 10 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2}`}
            fill="none"
            stroke={getColor()}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
          
          {/* Needle */}
          <g transform={`rotate(${angle} ${size / 2} ${size / 2})`}>
            <line
              x1={size / 2}
              y1={size / 2}
              x2={size / 2}
              y2={size / 2 - radius + 20}
              stroke={getColor()}
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r="8"
              fill={getColor()}
            />
          </g>
        </svg>
        
        {/* Score display */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <div className="text-4xl font-bold" style={{ color: getColor() }}>
            {working}/{total}
          </div>
          <div className="text-sm text-muted-foreground">Modules Working</div>
        </div>
      </div>
    </div>
  );
};

export default Speedometer;

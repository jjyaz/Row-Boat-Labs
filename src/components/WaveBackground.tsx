import PaperLayer from "./PaperLayer";

const wavePaths = [
  "M0,320 C240,280 480,360 720,300 C960,240 1200,320 1440,280 L1440,400 L0,400 Z",
  "M0,340 C180,300 420,380 660,320 C900,260 1140,340 1440,300 L1440,400 L0,400 Z",
  "M0,350 C300,310 540,370 780,330 C1020,290 1260,350 1440,320 L1440,400 L0,400 Z",
  "M0,360 C200,340 440,380 680,350 C920,320 1160,360 1440,340 L1440,400 L0,400 Z",
];

const fills = [
  "hsl(220 65% 20% / 0.15)",
  "hsl(218 60% 38% / 0.12)",
  "hsl(215 55% 52% / 0.1)",
  "hsl(210 50% 68% / 0.08)",
];

interface WaveBackgroundProps {
  className?: string;
  subtle?: boolean;
}

const WaveBackground = ({ className = "", subtle = false }: WaveBackgroundProps) => (
  <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
    {wavePaths.map((path, i) => (
      <PaperLayer
        key={i}
        svgPath={path}
        fill={fills[i]}
        depth={i + 1}
        parallaxFactor={subtle ? 0.008 : 0.02}
        className={`bottom-0 left-0 right-0 ${subtle ? "opacity-50" : "opacity-100"}`}
      />
    ))}
  </div>
);

export default WaveBackground;

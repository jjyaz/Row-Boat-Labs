import { motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

interface PaperLayerProps {
  children?: React.ReactNode;
  className?: string;
  depth?: number; // 0 = back, higher = closer
  parallaxFactor?: number;
  hoverLift?: boolean;
  svgPath?: string;
  fill?: string;
}

const PaperLayer = ({
  children,
  className = "",
  depth = 0,
  parallaxFactor = 0.02,
  hoverLift = false,
  svgPath,
  fill,
}: PaperLayerProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const translateX = useTransform(mouseX, [-1, 1], [-depth * parallaxFactor * 30, depth * parallaxFactor * 30]);
  const translateY = useTransform(mouseY, [-1, 1], [-depth * parallaxFactor * 20, depth * parallaxFactor * 20]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      mouseX.set(x);
      mouseY.set(y);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  if (svgPath) {
    return (
      <motion.div
        ref={ref}
        className={`absolute paper-shadow ${className}`}
        style={{ x: translateX, y: translateY }}
        whileHover={hoverLift ? { y: -4, transition: { duration: 0.3 } } : undefined}
      >
        <svg viewBox="0 0 1440 400" className="w-full h-auto" preserveAspectRatio="none">
          <path d={svgPath} fill={fill || "currentColor"} />
        </svg>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={`paper-shadow ${className}`}
      style={{ x: translateX, y: translateY }}
      whileHover={hoverLift ? { y: -4, transition: { duration: 0.3 } } : undefined}
    >
      {children}
    </motion.div>
  );
};

export default PaperLayer;

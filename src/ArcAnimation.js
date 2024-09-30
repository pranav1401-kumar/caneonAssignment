import React, { useState, useRef, useEffect } from 'react';
import './ArcAnimation.css';

const ArcAnimation = () => {
  const [position, setPosition] = useState({ x: 5, y: 45 });
  const [targetT, setTargetT] = useState(null); // Store the target `t` value for the Bezier curve
  const [currentT, setCurrentT] = useState(0); // The current position on the curve
  const svgRef = useRef(null);
  const animationRef = useRef(null); // Reference to hold the animation frame

  // Calculate point on the quadratic Bezier curve for a given t
  const calculatePointOnArc = (t) => {
    const x = (1 - t) * (1 - t) * 5 + 2 * (1 - t) * t * 50 + t * t * 95;
    const y = (1 - t) * (1 - t) * 45 + 2 * (1 - t) * t * 0 + t * t * 45;
    return { x, y };
  };

  const handleClick = (event) => {
    if (svgRef.current) {
      const svgRect = svgRef.current.getBoundingClientRect();
      const clickX = event.clientX - svgRect.left;
      const clickY = event.clientY - svgRect.top;
      
      const svgPoint = svgRef.current.createSVGPoint();
      svgPoint.x = clickX;
      svgPoint.y = clickY;
      const transformedPoint = svgPoint.matrixTransform(svgRef.current.getScreenCTM().inverse());
      
      let closestT = 0;
      let minDistance = Infinity;
      for (let t = 0; t <= 1; t += 0.01) {
        const point = calculatePointOnArc(t);
        const distance = Math.hypot(point.x - transformedPoint.x, point.y - transformedPoint.y);
        if (distance < minDistance) {
          minDistance = distance;
          closestT = t;
        }
      }
      
      setTargetT(closestT); // Set the target `t` to trigger animation
    }
  };

  // Function to animate the circle movement along the curve by varying `t`
  const animateMovement = (startT, endT, duration) => {
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1); // Ensure progress doesn't exceed 1

      const newT = startT + (endT - startT) * progress;
      const newPosition = calculatePointOnArc(newT);

      setPosition(newPosition);
      setCurrentT(newT);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        cancelAnimationFrame(animationRef.current); // Stop animation when complete
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (targetT !== null) {
      cancelAnimationFrame(animationRef.current); // Cancel previous animation if one is running
      animateMovement(currentT, targetT, 1000); // Animate along the curve for 1 second
    }
  }, [targetT]);

  useEffect(() => {
    if (svgRef.current) {
      svgRef.current.addEventListener('click', handleClick);
    }
    return () => {
      if (svgRef.current) {
        svgRef.current.removeEventListener('click', handleClick);
      }
      cancelAnimationFrame(animationRef.current); // Clean up animation on unmount
    };
  }, []);

  const handlePointClick = (point) => {
    const tValue = point === 'A' ? 0 : point === 'B' ? 0.5 : 1;
    setTargetT(tValue); // Move to specific point along the curve
  };

  return (
    <div className="arc-container">
      <svg className="arc-svg" viewBox="0 0 100 50" preserveAspectRatio="xMidYMid meet" ref={svgRef}>
        <defs>
          <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4a90e2" />
            <stop offset="100%" stopColor="#50e3c2" />
          </linearGradient>
        </defs>
        <path
          d="M 5 45 Q 50 0 95 45"
          fill="none"
          stroke="url(#arcGradient)"
          strokeWidth="1"
          className="arc-path"
        />
        {['A', 'B', 'C'].map((label, index) => {
          const point = calculatePointOnArc(index / 2);
          return (
            <g key={label} className="point-group" onClick={() => handlePointClick(label)}>
              <circle
                cx={point.x}
                cy={point.y}
                r="2"
                className="point-circle"
              />
              <text
                x={point.x}
                y={point.y + (label === 'B' ? -3 : 5)}
                className="arc-label"
              >
                {label}
              </text>
            </g>
          );
        })}
        <circle
          className="moving-point"
          cx={position.x}
          cy={position.y}
          r="2.5"
        />
      </svg>
    </div>
  );
};

export default ArcAnimation;

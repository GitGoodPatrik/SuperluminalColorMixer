import React, { useMemo } from 'react';
import Color from 'colorjs.io';

export default function OklabVisualizer({ ingredients, target, canvasColor, blackWhite }) {
  const size = 1000;
  
  // OKLab a and b ranges are roughly -0.4 to 0.4
  const scale = (val) => ((val + 0.4) / 0.8) * size;

  const renderPoint = (c, isTarget = false, isCanvas = false) => {
    if (!c) return null;
    const x = scale(c.a);
    const y = size - scale(c.b); // Invert Y
    
    // Lightness border
    const borderL = c.l; // 0 to 1
    const borderColor = `oklab(${borderL} 0 0)`;
    
    return (
      <g key={c.id || Math.random()} transform={`translate(${x},${y})`}>
        <circle 
          r={isTarget ? 30 : 20} 
          fill={c.color ? c.color.toString() : "gray"}
          stroke={borderColor}
          strokeWidth={8}
        />
        {isTarget && (
          <circle r={40} fill="none" stroke="#fff" strokeWidth={5} strokeDasharray="10 5"/>
        )}
      </g>
    );
  };

  const coloredRing = useMemo(() => {
    const segments = [];
    const numSegments = 72;
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 20; // slightly smaller than the box to leave room for stroke
    const strokeWidth = 40;

    for (let i = 0; i < numSegments; i++) {
      const angle1 = (i / numSegments) * Math.PI * 2;
      const angle2 = ((i + 1.1) / numSegments) * Math.PI * 2; // small overlap

      const x1 = cx + r * Math.cos(angle1);
      const y1 = cy - r * Math.sin(angle1);
      const x2 = cx + r * Math.cos(angle2);
      const y2 = cy - r * Math.sin(angle2);
      
      const midAngle = (angle1 + angle2) / 2;
      const a = 0.4 * Math.cos(midAngle);
      const b = 0.4 * Math.sin(midAngle);
      
      let colorHex = "#444";
      try {
        const c = new Color("oklab", [0.7, a, b]); // 0.7 lightness for bright ring colors
        colorHex = c.to("srgb").toString({format: "hex"});
      } catch(e) {}

      // Sweep flag is 0 for counter-clockwise in SVG
      const pathData = `M ${x1} ${y1} A ${r} ${r} 0 0 0 ${x2} ${y2}`;
      
      segments.push(
        <path key={i} d={pathData} fill="none" stroke={colorHex} strokeWidth={strokeWidth} />
      );
    }
    return segments;
  }, []);

  return (
    <div className="visualizer-container" style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ background: '#111', borderRadius: '50%', flex: 1, maxHeight: 'calc(100vh - 100px)' }}>
        {/* Axes */}
        <line x1={0} y1={size/2} x2={size} y2={size/2} stroke="#333" strokeWidth="2" />
        <line x1={size/2} y1={0} x2={size/2} y2={size} stroke="#333" strokeWidth="2" />
        
        {/* Colored Outer Ring */}
        {coloredRing}
        
        {/* Points */}
        {blackWhite && renderPoint(blackWhite.white)}
        {blackWhite && renderPoint(blackWhite.black)}
        {canvasColor && renderPoint(canvasColor, false, true)}
        {ingredients.map(i => renderPoint(i))}
        {target && renderPoint(target, true)}
      </svg>
      <div style={{ textAlign: 'center', marginTop: '1rem', color: '#aaa', fontSize: '0.9rem' }}>
        OKLab a*b* plane. Border lightness indicates L* (depth).
      </div>
    </div>
  );
}

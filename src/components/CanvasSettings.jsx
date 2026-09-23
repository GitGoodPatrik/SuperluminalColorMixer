import React from 'react';
import { toOklab } from '../utils/mixingMath';

export default function CanvasSettings({ canvasColor, setCanvasColor }) {
  return (
    <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Canvas Color</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <input 
          type="color" 
          value={canvasColor.rawInput}
          onChange={(e) => {
            const hex = e.target.value;
            const oklab = toOklab(hex);
            if (oklab) {
              setCanvasColor({ ...oklab, rawInput: hex, name: 'Canvas' });
            }
          }}
          style={{ width: '40px', height: '40px', padding: 0, border: 'none' }}
        />
        <span>{canvasColor.rawInput}</span>
      </div>
    </div>
  );
}

import React from 'react';

export default function MixResultModal({ mix, onClose }) {
  if (!mix) return null;

  const { exact, approx } = mix;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1000, overflowY: 'auto', padding: '2rem'
    }}>
      <div style={{
        background: '#1e1e1e', padding: '2rem', borderRadius: '12px',
        maxWidth: '500px', width: '100%', border: '1px solid #333'
      }}>
        <h2 style={{ marginTop: 0, borderBottom: '1px solid #333', paddingBottom: '1rem' }}>Mix Results</h2>
        
        {exact && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#4caf50' }}>Exact Solution (4+ Colors)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              {exact.map((ing, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ 
                    width: '24px', height: '24px', borderRadius: '4px', 
                    backgroundColor: ing.color ? ing.color.toString() : 'gray' 
                  }}></div>
                  <div style={{ flex: 1 }}>{ing.name || ing.rawInput || 'Color'}</div>
                  <div style={{ fontWeight: 'bold' }}>
                    {(ing.weight * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {approx && (
          <div>
            <h3 style={{ color: '#2196f3' }}>Approximate Solution (2 Colors + Canvas)</h3>
            <p style={{ fontSize: '0.9rem', color: '#aaa', margin: '0 0 1rem 0', lineHeight: '1.5' }}>
              Rounded to nearest whole percentage. <br/>
              Resulting color: <strong>{approx.hexResult}</strong>
              <span style={{ 
                display: 'inline-block', width: '12px', height: '12px', 
                backgroundColor: approx.hexResult, margin: '0 8px', borderRadius: '2px', verticalAlign: 'middle'
              }}></span>
              <br/>
              <strong>ΔE (Delta E): </strong> {approx.deltaE ? approx.deltaE.toFixed(2) : 'N/A'} 
              {approx.deltaE !== undefined && (
                <span style={{fontSize: '0.8rem', marginLeft: '6px', color: approx.deltaE < 2.5 ? '#4caf50' : '#ff9800'}}>
                  ({approx.deltaE < 2.5 ? 'Barely perceptible difference' : 'Noticeable difference'})
                </span>
              )}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {approx.ingredients.map((ing, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ 
                    width: '24px', height: '24px', borderRadius: '4px', 
                    backgroundColor: ing.color ? ing.color.toString() : (ing.rawInput || 'gray') 
                  }}></div>
                  <div style={{ flex: 1 }}>{ing.name || ing.rawInput || 'Color'}</div>
                  <div style={{ fontWeight: 'bold' }}>
                    {Math.round(ing.weight * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <button onClick={onClose} style={{ width: '100%', marginTop: '2rem' }}>Close</button>
      </div>
    </div>
  );
}

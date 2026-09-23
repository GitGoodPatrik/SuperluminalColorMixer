import React, { useState } from 'react';
import { toOklab } from '../utils/mixingMath';

export default function ColorInput({ onAddColor }) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    const oklab = toOklab(inputValue);
    if (oklab) {
      onAddColor({
        ...oklab,
        id: Date.now().toString(),
        rawInput: inputValue
      });
      setInputValue('');
      setError('');
    } else {
      setError('Invalid color format. Try hex or rgb().');
    }
  };

  return (
    <div className="color-input">
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input 
          type="text" 
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)} 
          placeholder="e.g. #ff0000 or lab(50 40 40)" 
          style={{ flex: 1 }}
        />
        <button onClick={handleAdd}>+</button>
      </div>
      {error && <div style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '0.5rem' }}>{error}</div>}
    </div>
  );
}

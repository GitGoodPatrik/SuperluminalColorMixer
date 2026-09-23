import { useState, useMemo, useEffect } from 'react'
import CanvasSettings from './components/CanvasSettings'
import OklabVisualizer from './components/OklabVisualizer'
import MixResultModal from './components/MixResultModal'
import { toOklab, findOptimalMix, findApproximateMix } from './utils/mixingMath'
import './index.css'

function App() {
  const [ingredients, setIngredients] = useState(() => {
    const saved = localStorage.getItem('colorMixerSession');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.ingredients) return data.ingredients.map(ing => ({...toOklab(ing.rawInput), id: ing.id, rawInput: ing.rawInput}));
      } catch(e){}
    }
    return [];
  });

  const [target, setTarget] = useState(() => {
    const saved = localStorage.getItem('colorMixerSession');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.target) return {...toOklab(data.target.rawInput), rawInput: data.target.rawInput};
      } catch(e){}
    }
    return null;
  });
  
  const [canvasColor, setCanvasColor] = useState(() => {
    const defaultWhite = { ...toOklab('#ffffff'), rawInput: '#ffffff', name: 'Canvas' };
    const saved = localStorage.getItem('colorMixerSession');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.canvasColor) return {...toOklab(data.canvasColor.rawInput), rawInput: data.canvasColor.rawInput, name: data.canvasColor.name};
      } catch(e){}
    }
    return defaultWhite;
  });
  
  const [mixResult, setMixResult] = useState(null);

  useEffect(() => {
    const data = {
      ingredients: ingredients.map(ing => ({ id: ing.id, rawInput: ing.rawInput })),
      target: target ? { rawInput: target.rawInput } : null,
      canvasColor: { rawInput: canvasColor.rawInput, name: canvasColor.name }
    };
    localStorage.setItem('colorMixerSession', JSON.stringify(data));
  }, [ingredients, target, canvasColor]);

  const handleAddIngredient = () => {
    const defaultColorHex = '#cccccc';
    const oklab = toOklab(defaultColorHex);
    setIngredients([...ingredients, {
      ...oklab,
      id: Date.now().toString(),
      rawInput: defaultColorHex
    }]);
  };

  const updateIngredient = (id, newRawInput) => {
    const oklab = toOklab(newRawInput);
    if (oklab) {
      setIngredients(ingredients.map(ing => 
        ing.id === id ? { ...oklab, id, rawInput: newRawInput } : ing
      ));
    }
  };

  const handleExport = () => {
    const data = {
      ingredients: ingredients.map(ing => ({ id: ing.id, rawInput: ing.rawInput })),
      target: target ? { rawInput: target.rawInput } : null,
      canvasColor: { rawInput: canvasColor.rawInput, name: canvasColor.name }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `colormixer_session_${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (data.ingredients) setIngredients(data.ingredients.map(ing => ({...toOklab(ing.rawInput), id: ing.id, rawInput: ing.rawInput})));
        if (data.target) setTarget({...toOklab(data.target.rawInput), rawInput: data.target.rawInput});
        if (data.canvasColor) setCanvasColor({...toOklab(data.canvasColor.rawInput), rawInput: data.canvasColor.rawInput, name: data.canvasColor.name});
      } catch (err) {
        alert("Failed to parse session file.");
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const updateTarget = (newRawInput) => {
    const oklab = toOklab(newRawInput);
    if (oklab) {
      setTarget({ ...oklab, rawInput: newRawInput });
    } else {
      // Just update rawInput temporarily if invalid while typing
      setTarget({ ...target, rawInput: newRawInput });
    }
  };

  const initTarget = () => {
    const defaultColorHex = '#ff0000';
    const oklab = toOklab(defaultColorHex);
    setTarget({ ...oklab, rawInput: defaultColorHex });
  };

  const availableColors = useMemo(() => {
    const white = { ...toOklab('#ffffff'), name: 'Pure White' };
    const black = { ...toOklab('#000000'), name: 'Pure Black' };
    return [...ingredients, canvasColor, white, black];
  }, [ingredients, canvasColor]);

  const isMixAchievable = useMemo(() => {
    if (!target) return false;
    const result = findOptimalMix(target, availableColors);
    return !!result;
  }, [target, availableColors]);

  const solveMix = () => {
    if (!target) {
      alert("Please set a target color first.");
      return;
    }
    
    const exact = findOptimalMix(target, availableColors);
    
    // For approximate, we only want user ingredients (not the auto-added black/white unless the user added them)
    // plus the canvas.
    const approx = findApproximateMix(target, ingredients, canvasColor);
    
    if (exact || approx) {
      setMixResult({ exact, approx });
    } else {
      alert("Could not find a mix. Try adding more ingredient colors.");
    }
  };

  const blackWhite = useMemo(() => ({
    white: toOklab('#ffffff'),
    black: toOklab('#000000')
  }), []);

  return (
    <div className="app-container">
      <div className="sidebar">
        
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button onClick={handleExport} style={{ flex: 1, backgroundColor: '#333' }}>Export Session</button>
          <label style={{ flex: 1, display: 'flex' }}>
            <span style={{ 
              flex: 1, backgroundColor: '#333', color: 'white', borderRadius: '6px', 
              padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 500, 
              textAlign: 'center', transition: 'background-color 0.2s' 
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#444'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#333'}
            >
              Import Session
            </span>
            <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </label>
        </div>

        <div style={{ marginBottom: '1rem', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>Target Color</h2>
          {!target ? (
            <button onClick={initTarget} style={{ width: '100%' }}>+ Set Target</button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: '#2a2a2a', borderRadius: '4px' }}>
              <input 
                type="color" 
                value={target.rawInput.startsWith('#') && target.rawInput.length === 7 ? target.rawInput : '#ffffff'} 
                onChange={(e) => updateTarget(e.target.value)}
                style={{ width: '30px', height: '30px', padding: 0, border: 'none', cursor: 'pointer' }}
              />
              <input 
                type="text" 
                value={target.rawInput} 
                onChange={(e) => updateTarget(e.target.value)}
                style={{ flex: 1 }}
              />
              <button 
                onClick={() => setTarget(null)}
                style={{ background: 'transparent', border: '1px solid #444', padding: '0.2rem 0.5rem' }}
              >
                x
              </button>
            </div>
          )}
        </div>

        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>Ingredients</h2>
        <button onClick={handleAddIngredient} style={{ width: '100%', marginBottom: '0.5rem' }}>+ Add Ingredient</button>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {ingredients.map(ing => (
            <div key={ing.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: '#2a2a2a', borderRadius: '4px' }}>
              <input 
                type="color" 
                value={ing.rawInput.startsWith('#') && ing.rawInput.length === 7 ? ing.rawInput : '#ffffff'} 
                onChange={(e) => updateIngredient(ing.id, e.target.value)}
                style={{ width: '30px', height: '30px', padding: 0, border: 'none', cursor: 'pointer' }}
              />
              <input 
                type="text" 
                value={ing.rawInput} 
                onChange={(e) => updateIngredient(ing.id, e.target.value)}
                style={{ flex: 1 }}
              />
              <button 
                onClick={() => setIngredients(ingredients.filter(i => i.id !== ing.id))}
                style={{ background: 'transparent', border: '1px solid #444', padding: '0.2rem 0.5rem' }}
              >
                x
              </button>
            </div>
          ))}
        </div>

        <CanvasSettings canvasColor={canvasColor} setCanvasColor={setCanvasColor} />

        <div style={{ position: 'sticky', bottom: '-1rem', backgroundColor: 'var(--panel-bg)', padding: '1rem 0', marginTop: 'auto', borderTop: '1px solid #333' }}>
          {target && (
            <div style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '0.9rem', color: isMixAchievable ? '#4caf50' : '#ff9800' }}>
              {isMixAchievable ? '✨ Enough colors added. Mix is achievable!' : '⚠️ Add more ingredient colors to enclose the target.'}
            </div>
          )}
          <button 
            onClick={solveMix} 
            style={{ width: '100%', padding: '0.75rem', fontSize: '1.1rem', backgroundColor: 'var(--accent)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
          >
            Solve Optimal Mix
          </button>
        </div>
      </div>

      <div className="main-content">
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Color Space Map (OKLab)</h2>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <OklabVisualizer 
            ingredients={ingredients} 
            target={target} 
            canvasColor={canvasColor}
            blackWhite={blackWhite}
          />
        </div>
      </div>

      {mixResult && <MixResultModal mix={mixResult} onClose={() => setMixResult(null)} />}
    </div>
  )
}

export default App

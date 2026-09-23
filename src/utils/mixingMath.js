import Color from "colorjs.io";

export function toOklab(colorString) {
  try {
    const c = new Color(colorString);
    const oklab = c.to("oklab");
    return {
      l: oklab.l,
      a: oklab.a,
      b: oklab.b,
      color: c
    };
  } catch (e) {
    return null;
  }
}

// Solves Ax = B using Gaussian Elimination
function gaussianElimination(A, B) {
  const n = B.length;
  const M = [];
  for (let i = 0; i < n; i++) {
    M.push([...A[i], B[i]]);
  }

  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxEl = Math.abs(M[i][i]);
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > maxEl) {
        maxEl = Math.abs(M[k][i]);
        maxRow = k;
      }
    }

    // Swap
    for (let k = i; k < n + 1; k++) {
      const tmp = M[maxRow][k];
      M[maxRow][k] = M[i][k];
      M[i][k] = tmp;
    }

    if (Math.abs(M[i][i]) < 1e-10) return null; // Singular matrix

    // Make all rows below this one 0 in current column
    for (let k = i + 1; k < n; k++) {
      const c = -M[k][i] / M[i][i];
      for (let j = i; j < n + 1; j++) {
        if (i === j) {
          M[k][j] = 0;
        } else {
          M[k][j] += c * M[i][j];
        }
      }
    }
  }

  // Solve equation Ax=B
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = M[i][n] / M[i][i];
    for (let k = i - 1; k >= 0; k--) {
      M[k][n] -= M[k][i] * x[i];
    }
  }
  return x;
}

// Calculate volume of tetrahedron formed by 4 points in OKLab
function tetrahedronVolume(p1, p2, p3, p4) {
  const A = [
    [p1.l, p2.l, p3.l, p4.l],
    [p1.a, p2.a, p3.a, p4.a],
    [p1.b, p2.b, p3.b, p4.b],
    [1, 1, 1, 1]
  ];
  // Volume is related to the determinant. Since we just need it for comparison,
  // we can use a simpler volume metric or compute full determinant.
  // Actually, distance based heuristic (sum of distances to target) is easier and achieves a similar "closest colors" result.
  return Math.hypot(p1.l-p2.l, p1.a-p2.a, p1.b-p2.b) +
         Math.hypot(p1.l-p3.l, p1.a-p3.a, p1.b-p3.b) +
         Math.hypot(p1.l-p4.l, p1.a-p4.a, p1.b-p4.b);
}

// Get combination of 4 items from an array
function getCombinations(arr, k) {
  const result = [];
  function combine(start, combo) {
    if (combo.length === k) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      combine(i + 1, combo);
      combo.pop();
    }
  }
  combine(0, []);
  return result;
}

export function findOptimalMix(targetOklab, availableColors) {
  if (availableColors.length < 4) return null;

  const combos = getCombinations(availableColors, 4);
  let bestMix = null;
  let minCost = Infinity;

  const B = [targetOklab.l, targetOklab.a, targetOklab.b, 1];

  for (const combo of combos) {
    const A = [
      [combo[0].l, combo[1].l, combo[2].l, combo[3].l],
      [combo[0].a, combo[1].a, combo[2].a, combo[3].a],
      [combo[0].b, combo[1].b, combo[2].b, combo[3].b],
      [1, 1, 1, 1]
    ];

    const weights = gaussianElimination(A, B);
    
    // Check if target is inside tetrahedron (all weights >= -epsilon)
    if (weights && weights.every(w => w >= -0.01)) {
      // Normalize weights
      const sum = weights.reduce((acc, val) => acc + Math.max(0, val), 0);
      const normalizedWeights = weights.map(w => Math.max(0, w) / sum);
      
      const cost = tetrahedronVolume(combo[0], combo[1], combo[2], combo[3]);
      if (cost < minCost) {
        minCost = cost;
        bestMix = combo.map((color, idx) => ({
          ...color,
          weight: normalizedWeights[idx]
        })).filter(c => c.weight > 0.001); // Only keep colors with > 0.1% contribution
      }
    }
  }

  // Fallback: If 4 points don't enclose it perfectly, we might want to find closest projection
  // but for MVP, we rely on having enough colors (like white/black) to enclose.
  
  return bestMix;
}

// Find closest approximate mix using exactly 2 ingredients + canvas, integer percentages
export function findApproximateMix(targetOklab, ingredients, canvasColor) {
  if (ingredients.length < 2) return null;
  
  let bestMix = null;
  let minDistance = Infinity;

  const combos = getCombinations(ingredients, 2);

  for (const [c1, c2] of combos) {
    for (let p1 = 0; p1 <= 100; p1++) {
      for (let p2 = 0; p2 <= 100 - p1; p2++) {
        let pCanvas = 100 - p1 - p2;
        
        let mixL = (p1 * c1.l + p2 * c2.l + pCanvas * canvasColor.l) / 100;
        let mixA = (p1 * c1.a + p2 * c2.a + pCanvas * canvasColor.a) / 100;
        let mixB = (p1 * c1.b + p2 * c2.b + pCanvas * canvasColor.b) / 100;
        
        let dist = Math.hypot(mixL - targetOklab.l, mixA - targetOklab.a, mixB - targetOklab.b);
        
        if (dist < minDistance) {
          minDistance = dist;
          bestMix = {
            mixOklab: { l: mixL, a: mixA, b: mixB },
            ingredients: [
              { ...c1, weight: p1 / 100 },
              { ...c2, weight: p2 / 100 },
              { ...canvasColor, weight: pCanvas / 100, name: 'Canvas' }
            ].filter(ing => ing.weight > 0)
          };
        }
      }
    }
  }
  
  if (bestMix) {
    try {
      const c = new Color("oklab", [bestMix.mixOklab.l, bestMix.mixOklab.a, bestMix.mixOklab.b]);
      const targetC = new Color("oklab", [targetOklab.l, targetOklab.a, targetOklab.b]);
      
      bestMix.hexResult = c.to("srgb").toString({format: "hex"});
      
      // Calculate Delta E (standard color difference metric)
      bestMix.deltaE = c.deltaE(targetC, "2000"); 
    } catch(e) {
      bestMix.hexResult = "#000000";
      bestMix.deltaE = 0;
    }
  }
  
  return bestMix;
}

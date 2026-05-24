// 501 Checkout Calculator — suggests optimal finish routes
// Standard double-out checkout chart for scores up to 170

interface CheckoutRoute {
  darts: string[];
  total: number;
}

// Common checkout routes (optimal paths)
const CHECKOUT_MAP: Record<number, string[][]> = {
  170: [['T20', 'T20', 'Bull']],
  167: [['T20', 'T19', 'Bull']],
  164: [['T20', 'T18', 'Bull']],
  161: [['T20', 'T17', 'Bull']],
  160: [['T20', 'T20', 'D20']],
  158: [['T20', 'T20', 'D19']],
  157: [['T20', 'T19', 'D20']],
  156: [['T20', 'T20', 'D18']],
  155: [['T20', 'T19', 'D19']],
  154: [['T20', 'T18', 'D20']],
  153: [['T20', 'T19', 'D18']],
  152: [['T20', 'T20', 'D16']],
  151: [['T20', 'T17', 'D20']],
  150: [['T20', 'T18', 'D18']],
  149: [['T20', 'T19', 'D16']],
  148: [['T20', 'T16', 'D20']],
  147: [['T20', 'T17', 'D18']],
  146: [['T20', 'T18', 'D16']],
  145: [['T20', 'T15', 'D20']],
  144: [['T20', 'T20', 'D12']],
  143: [['T20', 'T17', 'D16']],
  142: [['T20', 'T14', 'D20']],
  141: [['T20', 'T19', 'D12']],
  140: [['T20', 'T20', 'D10']],
  139: [['T19', 'T14', 'D20']],
  138: [['T20', 'T18', 'D12']],
  137: [['T20', 'T15', 'D16']],
  136: [['T20', 'T20', 'D8']],
  135: [['T20', 'T17', 'D12']],
  134: [['T20', 'T14', 'D16']],
  133: [['T20', 'T19', 'D8']],
  132: [['T20', 'T16', 'D12']],
  131: [['T20', 'T13', 'D16']],
  130: [['T20', 'T18', 'D8']],
  129: [['T19', 'T16', 'D12']],
  128: [['T18', 'T14', 'D16']],
  127: [['T20', 'T17', 'D8']],
  126: [['T19', 'T19', 'D6']],
  125: [['T20', 'T15', 'D10']],
  124: [['T20', 'T16', 'D8']],
  123: [['T19', 'T16', 'D9']],
  122: [['T18', 'T18', 'D7']],
  121: [['T20', 'T11', 'D14']],
  120: [['T20', 'S20', 'D20']],
  // 2-dart finishes
  110: [['T20', 'D25']],
  107: [['T19', 'D25']],
  104: [['T18', 'D25']],
  101: [['T17', 'D25']],
  100: [['T20', 'D20']],
  98: [['T20', 'D19']],
  97: [['T19', 'D20']],
  96: [['T20', 'D18']],
  95: [['T19', 'D19']],
  94: [['T18', 'D20']],
  93: [['T19', 'D18']],
  92: [['T20', 'D16']],
  91: [['T17', 'D20']],
  90: [['T18', 'D18']],
  89: [['T19', 'D16']],
  88: [['T16', 'D20']],
  87: [['T17', 'D18']],
  86: [['T18', 'D16']],
  85: [['T15', 'D20']],
  84: [['T20', 'D12']],
  83: [['T17', 'D16']],
  82: [['T14', 'D20']],
  81: [['T19', 'D12']],
  80: [['T20', 'D10']],
  79: [['T13', 'D20']],
  78: [['T18', 'D12']],
  77: [['T15', 'D16']],
  76: [['T20', 'D8']],
  75: [['T17', 'D12']],
  74: [['T14', 'D16']],
  73: [['T19', 'D8']],
  72: [['T16', 'D12']],
  71: [['T13', 'D16']],
  70: [['T18', 'D8']],
  69: [['T19', 'D6']],
  68: [['T20', 'D4']],
  67: [['T17', 'D8']],
  66: [['T10', 'D18']],
  65: [['T19', 'D4']],
  64: [['T16', 'D8']],
  63: [['T13', 'D12']],
  62: [['T10', 'D16']],
  61: [['T15', 'D8']],
  60: [['S20', 'D20']],
  // Single-dart finishes
  50: [['Bull']],
  40: [['D20']],
  38: [['D19']],
  36: [['D18']],
  34: [['D17']],
  32: [['D16']],
  30: [['D15']],
  28: [['D14']],
  26: [['D13']],
  24: [['D12']],
  22: [['D11']],
  20: [['D10']],
  18: [['D9']],
  16: [['D8']],
  14: [['D7']],
  12: [['D6']],
  10: [['D5']],
  8: [['D4']],
  6: [['D3']],
  4: [['D2']],
  2: [['D1']],
};

// Fill in missing values with computed routes
function computeCheckout(remaining: number): string[][] | null {
  if (remaining <= 1 || remaining > 170) return null;
  if (remaining === 169 || remaining === 168 || remaining === 166 ||
      remaining === 165 || remaining === 163 || remaining === 162) return null;
  
  if (CHECKOUT_MAP[remaining]) return CHECKOUT_MAP[remaining];
  
  // Try to find a 2-dart route: single/triple + double finish
  for (const [label, value] of getAllThrows()) {
    const remainder = remaining - value;
    if (remainder >= 2 && remainder <= 50 && remainder % 2 === 0) {
      const doubleVal = remainder / 2;
      if (doubleVal >= 1 && doubleVal <= 20) {
        return [[label, `D${doubleVal}`]];
      }
      if (remainder === 50) {
        return [[label, 'Bull']];
      }
    }
  }

  // Try 3-dart route
  for (const [label1, value1] of getAllThrows()) {
    for (const [label2, value2] of getAllThrows()) {
      const remainder = remaining - value1 - value2;
      if (remainder >= 2 && remainder <= 50 && remainder % 2 === 0) {
        const doubleVal = remainder / 2;
        if (doubleVal >= 1 && doubleVal <= 20) {
          return [[label1, label2, `D${doubleVal}`]];
        }
        if (remainder === 50) {
          return [[label1, label2, 'Bull']];
        }
      }
    }
  }

  return null;
}

function getAllThrows(): [string, number][] {
  const throws: [string, number][] = [];
  for (let i = 1; i <= 20; i++) {
    throws.push([`S${i}`, i]);
    throws.push([`D${i}`, i * 2]);
    throws.push([`T${i}`, i * 3]);
  }
  throws.push(['S25', 25]);
  throws.push(['Bull', 50]);
  return throws;
}

export function getCheckoutSuggestion(remaining: number): string | null {
  if (remaining <= 1 || remaining > 170) return null;
  
  const routes = CHECKOUT_MAP[remaining] || computeCheckout(remaining);
  if (!routes || routes.length === 0) return null;
  
  return routes[0].join(' → ');
}

export function isCheckoutPossible(remaining: number): boolean {
  return remaining >= 2 && remaining <= 170 &&
    remaining !== 169 && remaining !== 168 &&
    remaining !== 166 && remaining !== 165 &&
    remaining !== 163 && remaining !== 162;
}

// Double-out calculator and indicator for 501
// Shows possible checkout routes when score is <= 170

interface CheckoutRoute {
  darts: string[];
  description: string;
}

const CHECKOUT_TABLE: Record<number, CheckoutRoute[]> = {};

// Build checkout table for scores 2-170
function buildCheckoutTable() {
  const doubles = Array.from({ length: 20 }, (_, i) => ({ seg: i + 1, mult: 2, val: (i + 1) * 2, label: `D${i + 1}` }));
  doubles.push({ seg: 25, mult: 2, val: 50, label: 'D25' });

  const singles = Array.from({ length: 20 }, (_, i) => ({ seg: i + 1, mult: 1, val: i + 1, label: `S${i + 1}` }));
  singles.push({ seg: 25, mult: 1, val: 25, label: 'S25' });

  const triples = Array.from({ length: 20 }, (_, i) => ({ seg: i + 1, mult: 3, val: (i + 1) * 3, label: `T${i + 1}` }));

  const allThrows = [...singles, ...doubles, ...triples];

  // 1-dart checkouts (doubles only)
  for (const d of doubles) {
    if (!CHECKOUT_TABLE[d.val]) CHECKOUT_TABLE[d.val] = [];
    CHECKOUT_TABLE[d.val].push({
      darts: [d.label],
      description: d.label,
    });
  }

  // 2-dart checkouts
  for (const t1 of allThrows) {
    for (const d of doubles) {
      const total = t1.val + d.val;
      if (total >= 2 && total <= 170) {
        if (!CHECKOUT_TABLE[total]) CHECKOUT_TABLE[total] = [];
        if (CHECKOUT_TABLE[total].length < 3) {
          CHECKOUT_TABLE[total].push({
            darts: [t1.label, d.label],
            description: `${t1.label} → ${d.label}`,
          });
        }
      }
    }
  }

  // 3-dart checkouts (only fill gaps)
  for (const t1 of allThrows) {
    for (const t2 of allThrows) {
      for (const d of doubles) {
        const total = t1.val + t2.val + d.val;
        if (total >= 2 && total <= 170) {
          if (!CHECKOUT_TABLE[total]) CHECKOUT_TABLE[total] = [];
          if (CHECKOUT_TABLE[total].length < 2) {
            CHECKOUT_TABLE[total].push({
              darts: [t1.label, t2.label, d.label],
              description: `${t1.label} → ${t2.label} → ${d.label}`,
            });
          }
        }
      }
    }
  }
}

buildCheckoutTable();

export function getCheckoutRoutes(remaining: number, dartsLeft: number): CheckoutRoute[] {
  if (remaining < 2 || remaining > 170) return [];

  const routes = CHECKOUT_TABLE[remaining] || [];
  return routes.filter(r => r.darts.length <= dartsLeft).slice(0, 3);
}

export function getCheckoutHint(remaining: number, dartsLeft: number): string {
  const routes = getCheckoutRoutes(remaining, dartsLeft);
  if (routes.length === 0) {
    if (remaining <= 170) return 'No checkout with ' + dartsLeft + ' dart' + (dartsLeft > 1 ? 's' : '');
    return '';
  }
  return routes[0].description;
}

export function isDoubleOutPossible(remaining: number, dartsLeft: number): boolean {
  return getCheckoutRoutes(remaining, dartsLeft).length > 0;
}

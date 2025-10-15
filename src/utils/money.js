// Small money utilities
export const roundToCents = amount => {
  const n = Number(amount) || 0;
  return Math.round(n * 100) / 100;
};

export const cents = amount => Math.round((Number(amount) || 0) * 100);

export default { roundToCents, cents };

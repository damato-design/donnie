export default function utc(source) {
  const d = source ? new Date(Date.parse(source)) : new Date();
  const str = [d.getFullYear(), d.getMonth() + 1, d.getDate()].map((n) => {
      const s = String(n);
      return s.length === 1 ? s.padStart(2, '0') : s;
  }).join('-');
  return `${str}T00:00:00.000Z`;
}
// eslint-disable-next-line no-undef
const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

export default function formatCurrency(amountCents) {
  const amount = amountCents / 100;
  const formatted = currency.format(amount);
  return formatted;
}

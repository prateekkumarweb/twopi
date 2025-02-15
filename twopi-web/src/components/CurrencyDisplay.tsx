export default function CurrencyDisplay(props: {
  value: number;
  currencyCode: string;
  decimalDigits: number;
}) {
  const amount = props.value / Math.pow(10, props.decimalDigits);
  return (
    <div>
      {Intl.NumberFormat("en-US", {
        style: "currency",
        currency: props.currencyCode,
        minimumFractionDigits: props.decimalDigits,
        maximumFractionDigits: props.decimalDigits,
      }).format(amount)}
    </div>
  );
}

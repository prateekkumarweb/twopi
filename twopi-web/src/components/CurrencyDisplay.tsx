export default function CurrencyDisplay(
  props: Readonly<{
    value: number;
    currencyCode: string;
    decimalDigits: number;
  }>,
) {
  const amount = () => props.value / Math.pow(10, props.decimalDigits);
  return (
    <div>
      {Intl.NumberFormat("en-US", {
        style: "currency",
        currency: props.currencyCode,
      }).format(amount())}
    </div>
  );
}

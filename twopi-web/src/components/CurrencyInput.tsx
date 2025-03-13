import { Input } from "./ui/input";
import { Toggle } from "./ui/toggle";

export default function CurrencyInput(props: {
  name: string;
  value: number;
  placeholder: string;
  onChange: (value: number) => void;
  onBlur?: () => void;
  currencyCode: string;
  decimalDigits: number;
}) {
  const isNegative = props.value < 0;
  const amount = Math.abs(props.value / Math.pow(10, props.decimalDigits));

  function handleOnChange(isNegative: boolean, amount: number) {
    const value =
      (isNegative ? -1 : 1) *
      Math.floor(amount * Math.pow(10, props.decimalDigits));
    if (isNaN(value)) {
      return;
    }
    props.onChange(value);
  }

  return (
    <div className="flex items-center gap-2">
      <Toggle
        pressed={isNegative}
        onPressedChange={(e) => {
          handleOnChange(e, amount);
        }}
        variant="outline"
      >
        {isNegative ? "-" : "+"}
      </Toggle>
      <Input
        type="number"
        name={props.name}
        value={amount}
        placeholder={props.placeholder}
        onChange={(e) => {
          handleOnChange(isNegative, parseFloat(e.target.value) || 0);
        }}
        onBlur={props.onBlur}
      />
      <div>{props.currencyCode}</div>
    </div>
  );
}

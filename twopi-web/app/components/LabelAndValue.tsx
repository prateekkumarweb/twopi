export default function LabelAndValue({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-nowrap items-center gap-2">
      <div className="grow font-light">{label}</div>
      <div className="overflow-hidden text-sm text-nowrap text-ellipsis text-gray-700">
        {value}
      </div>
    </div>
  );
}

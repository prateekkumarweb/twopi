export default function TransactionEditor(
  _props: Readonly<{
    edit?: {
      id: string;
      title: string;
      timestamp: Date;
      items: {
        id: string;
        notes: string;
        account_id: string;
        amount: number;
        category_id?: string | null;
      }[];
    };
  }>,
) {
  return <></>;
}

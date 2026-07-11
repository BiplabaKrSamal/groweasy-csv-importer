import { VirtualTable } from "./VirtualTable";

interface Props {
  headers: string[];
  rows: Record<string, string>[];
}

export function PreviewTable({ headers, rows }: Props) {
  const columns = headers.map((h) => ({ key: h, header: h }));

  return (
    <VirtualTable
      columns={columns}
      rowCount={rows.length}
      getCell={(rowIndex, key) => rows[rowIndex]?.[key]}
      emptyMessage="No rows to preview."
    />
  );
}

import type { HTMLAttributes, ReactNode, TableHTMLAttributes } from "react";

export function Table({
  children,
  className = "",
  ...props
}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto border border-border">
      <table className={`w-full border-collapse text-left text-sm ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHead(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className="bg-surface text-ink-muted [&_th]:border-b [&_th]:border-border [&_th]:px-4 [&_th]:py-3 [&_th]:font-mono [&_th]:text-[0.65rem] [&_th]:font-medium [&_th]:uppercase [&_th]:tracking-[0.06em]" {...props} />;
}

export function TableBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className="divide-y divide-border [&_tr]:transition-colors [&_tr:hover]:bg-surface/70" {...props} />;
}

export function TableRow(props: HTMLAttributes<HTMLTableRowElement>) {
  return <tr {...props} />;
}

export function TableHeaderCell(props: HTMLAttributes<HTMLTableCellElement>) {
  return <th scope="col" {...props} />;
}

export function TableCell({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLTableCellElement> & { children?: ReactNode }) {
  return <td className={`px-4 py-3 align-middle text-ink-secondary ${className}`} {...props}>{children}</td>;
}

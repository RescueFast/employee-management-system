type CsvValue = string | number | null | undefined;

export function createCsv(headers: string[], rows: CsvValue[][]): string {
  const escapeCell = (value: CsvValue) => {
    const text = String(value ?? '');
    const safeText = /^[\t\r\n ]*[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safeText.replace(/"/g, '""')}"`;
  };

  return `\uFEFF${[headers, ...rows]
    .map(row => row.map(escapeCell).join(','))
    .join('\r\n')}`;
}

import { parseCsv, splitCsv, toCsv, type CsvRow } from '../src/lib/csv';

const row: CsvRow = { date: '2026-11-16', type: 'expense', name: 'Tealive, SS15', category: 'food', amount: 12.5, from_account: 'Maybank Savings', to_account: '', note: 'Said "extra ice"' };

describe('transaction CSV', () => {
  it('round-trips rows, escaping commas and quotes', () => {
    const csv = toCsv([row]);
    expect(csv.split('\n')[1]).toBe('2026-11-16,expense,"Tealive, SS15",food,12.50,Maybank Savings,,"Said ""extra ice"""');
    expect(parseCsv(csv)).toEqual({ rows: [row], skipped: [] });
  });

  it('skips bad lines and reports their line numbers', () => {
    const csv = 'date,type,name,category,amount,from_account,to_account,note\n2026-11-16,expense,A,food,10,,,\nnot-a-date,expense,B,food,10,,,\n2026-11-16,refund,C,food,10,,,\n2026-11-16,income,D,salary,0,,,\n';
    const res = parseCsv(csv);
    expect(res.rows.map((r) => r.name)).toEqual(['A']);
    expect(res.skipped).toEqual([3, 4, 5]);
  });

  it('rejects files that are not Flowe CSVs', () => {
    expect(() => parseCsv('foo,bar\n1,2\n')).toThrow('Not a Flowe CSV');
  });

  it('splits quoted multi-line fields and CRLF', () => {
    expect(splitCsv('a,"b\nc"\r\nd,e')).toEqual([['a', 'b\nc'], ['d', 'e']]);
  });
});

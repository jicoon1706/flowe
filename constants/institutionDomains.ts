/**
 * Public domains of Malaysian banks and e-wallets, so their logos can be drawn
 * from logo.dev. Matched case-insensitively against a bank name or account name.
 * Longer keywords are tried first ("bank islam" before "islam").
 */
type Entry = readonly [keyword: string, domain: string];

const LIST: Entry[] = [
  ['maybank', 'maybank.com'],
  ['cimb', 'cimb.com'],
  ['public bank', 'pbebank.com'],
  ['pbe', 'pbebank.com'],
  ['rhb', 'rhbgroup.com'],
  ['hong leong', 'hlb.com.my'],
  ['hlb', 'hlb.com.my'],
  ['ambank', 'ambankgroup.com'],
  ['bank islam', 'bankislam.com'],
  ['bank rakyat', 'bankrakyat.com.my'],
  ['bsn', 'bsn.com.my'],
  ['affin', 'affinalways.com'],
  ['alliance', 'alliancebank.com.my'],
  ['ocbc', 'ocbc.com'],
  ['uob', 'uob.com.my'],
  ['hsbc', 'hsbc.com.my'],
  ['standard chartered', 'sc.com'],
  ['agrobank', 'agrobank.com.my'],
  ['gxbank', 'gxbank.my'],
  ['aeon bank', 'aeonbank.com.my'],
  ['touch n go', 'touchngo.com.my'],
  ["touch 'n go", 'touchngo.com.my'],
  ['tng', 'touchngo.com.my'],
  ['grabpay', 'grab.com'],
  ['grab', 'grab.com'],
  ['shopeepay', 'shopee.com.my'],
  ['shopee', 'shopee.com.my'],
  ['boost', 'myboost.co'],
  ['bigpay', 'bigpayme.com'],
  ['setel', 'setel.com'],
  ['mae', 'maybank.com'],
];

const INSTITUTIONS: Entry[] = LIST.slice().sort((a, b) => b[0].length - a[0].length);

export function institutionDomain(...names: (string | null | undefined)[]): string | undefined {
  for (const raw of names) {
    if (!raw) continue;
    const name = raw.toLowerCase().replace(/[-_]+/g, ' ');
    const hit = INSTITUTIONS.find(([kw]) => new RegExp(`(^|[^a-z])${kw.replace(/[.*+?^${}()|[\]\\']/g, '\\$&')}([^a-z]|$)`).test(name));
    if (hit) return hit[1];
  }
  return undefined;
}

#!/usr/bin/env python3
from pathlib import Path
path = Path('scripts/migrate-evidence-report-pathways.py')
text = path.read_text(encoding='utf-8')
old = '''# close the new outer wrapper at the end of RecordLedger
needle = ''' + "'''" + '''    }) : <p className="px-4 py-5 text-base text-muted-foreground">No linked VIGIL records were found for this report.</p>}
  </div>;
}''' + "'''" + '''
replacement = ''' + "'''" + '''    }) : <p className="px-4 py-5 text-base text-muted-foreground">No linked VIGIL records were found for this report.</p>}
    </div>
  </div>;
}''' + "'''" + '''
replace_once(needle, replacement, 'RecordLedger wrapper closure')'''
new = '''# close the new outer wrapper at the end of RecordLedger
needle = ''' + "'''" + '''    }) : <p className="p-4 text-sm text-muted-foreground">No linked records are available yet. This report remains available while the evidence chain is incomplete.</p>}
    {!records.length && !learnRecords.length && <p className="border-t border-dashed border-border/60 p-3 text-sm text-muted-foreground">The linked record details are not currently available.</p>}
  </div>;
}''' + "'''" + '''
replacement = ''' + "'''" + '''    }) : <p className="p-4 text-sm text-muted-foreground">No linked records are available yet. This report remains available while the evidence chain is incomplete.</p>}
    {!records.length && !learnRecords.length && <p className="border-t border-dashed border-border/60 p-3 text-sm text-muted-foreground">The linked record details are not currently available.</p>}
    </div>
  </div>;
}''' + "'''" + '''
replace_once(needle, replacement, 'RecordLedger wrapper closure')'''
if text.count(old) != 1:
    raise SystemExit(f'Expected one migration boundary block, found {text.count(old)}')
path.write_text(text.replace(old, new), encoding='utf-8')
print('Migration boundary fixed.')

from html.parser import HTMLParser
import pathlib,subprocess,json,os
class Page(HTMLParser):
 def __init__(self):super().__init__();self.depth=0;self.found=False;self.text=[];self.ids=set();self.links=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if a.get('id'):self.ids.add(a['id'])
  if tag=='section':
   if a.get('aria-label')=='Section 03 Classification':self.depth=1;self.found=True
   elif self.depth:self.depth+=1
  if self.depth and tag=='a' and a.get('href','').startswith('#vigil-source-episode-'):self.links.append(a['href'][1:])
 def handle_endtag(self,tag):
  if tag=='section' and self.depth:self.depth-=1
 def handle_data(self,data):
  if self.depth:self.text.append(data)
web=pathlib.Path(os.environ.get('SECTION03_WEBSITE_ROOT',pathlib.Path.cwd()));canon=pathlib.Path(os.environ.get('SECTION03_CANONICAL_ROOT',web.parent/'canonical'));docs=web/'docs/observatory/cases';counts={'pages':0,'mapping_bases':0,'bad_anchors':[]}
for p in docs.glob('VIGIL-INC-*/index.html'):
 page=Page();page.feed(p.read_text());assert page.found,p
 record=json.loads(subprocess.check_output(['git','show',f'origin/main:vigil/records/incidents/{p.parent.name}.json'],cwd=canon,text=True));t=record['taxonomy_classification'];text=' '.join(' '.join(page.text).split())
 for m in [t.get('primary_classification')]+t.get('secondary_classifications',[]):
  if not m:continue
  assert ' '.join(m['classification_basis'].split()) in text,(p,m['class_id']);counts['mapping_bases']+=1
 for target in page.links:
  if target not in page.ids:counts['bad_anchors'].append([p.parent.name,target])
 counts['pages']+=1
assert not counts['bad_anchors'],counts
pathlib.Path('/tmp/section03-static-results.json').write_text(json.dumps(counts,indent=2)+'\n');print(counts)

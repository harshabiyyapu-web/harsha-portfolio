from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, parse_qs, unquote
import subprocess, concurrent.futures, json

root = Path(__file__).parent
class Images(HTMLParser):
    def __init__(self): super().__init__(); self.items=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag=='img': self.items.append(a['src'])
p=Images(); p.feed(Path('/Users/harshabiyyapu/Downloads/index (6).html').read_text())
def fetch(url):
    parsed=urlparse(url)
    name=Path(unquote(parse_qs(parsed.query).get('url',[parsed.path])[0])).name
    dest=root/'assets'/name
    if dest.exists(): return (name,'cached')
    # Original-resolution assets, rather than a dependency on Next image endpoints.
    source='https://www.harshabiyyapu.one/'+name if parsed.netloc=='www.harshabiyyapu.one' else url
    r=subprocess.run(['curl','-L','--fail','--max-time','45','--silent','--show-error',source,'-o',str(dest)],capture_output=True,text=True)
    return (name, 'ok' if r.returncode==0 else r.stderr)
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    results=list(pool.map(fetch,dict.fromkeys(p.items)))
print(json.dumps(results,indent=2))

"""Recompute explicit numeric claims in site prose. Precision over recall.

Run from the repo root:  python3 scripts/audit-numbers.py

Every hit is a CANDIDATE, not a verdict — the extractor cannot always tell
which figure is the starting balance, and it does not model loan
amortization at all. Verify each by hand before changing any copy.

A figure counts as a CLAIM only when a result verb introduces it
("grows to $X", "reaches $X"). Everything else in the sentence is treated
as scenario input. The site mixes conventions — lump sums compound
annually, contributions monthly — so a claim is flagged only when it
disagrees with EVERY plausible reading.
"""
import glob, re, html, json

TOL = 0.06
MIN = 1000
MONEY = r'\$[\d,]+(?:\.\d+)?'

RESULT = re.compile(
    r'\b(?:reach(?:es|ing)?|grow(?:s|n|ing)?\s+to|becomes?|is\s+worth|'
    r'will\s+be\s+worth|would\s+(?:grow\s+to|be\s+worth)|totals?|'
    r'ends?\s+up\s+(?:at|with|worth)|balance\s+reaches|turn(?:s|ing)?\s+\S+\s+into)\s+'
    r'(?:approximately|roughly|about|over|nearly|around|just\s+under|more\s+than)?\s*'
    r'(' + MONEY + r')', re.I)

PERMONTH = re.compile(r'(' + MONEY + r')\s*(?:/|\s+(?:a|per)\s+)\s*month', re.I)
RATE  = re.compile(r'(\d+(?:\.\d+)?)\s*%')
YEARS = re.compile(r'(\d+)[\s-]*year')
AGES  = re.compile(r'age\s+(\d{2})\b.*?\bby\s+(\d{2})\b', re.I)

def money(t): return float(t.replace('$','').replace(',',''))
def annual(P,r,y): return P*(1+r/100.0)**y
def monthly(P,M,r,y):
    mr=r/12.0/100.0; b=P
    for _ in range(int(round(y*12))): b=b*(1+mr)+M
    return b

def sentences(path):
    s=open(path,encoding='utf-8').read()
    s=re.sub(r'<script.*?</script>',' ',s,flags=re.S)
    s=re.sub(r'<table.*?</table>',' ',s,flags=re.S)
    for blk in re.findall(r'<(?:p|li)[^>]*>(.*?)</(?:p|li)>', s, re.S):
        t=' '.join(html.unescape(re.sub(r'<[^>]*>','',blk)).split())
        # keep the whole block as context, but claim-match per sentence
        for sent in re.split(r'(?<=[.!?])\s+', t):
            yield sent, t

def audit(path):
    out=[]
    for sent, ctx in sentences(path):
        for m in RESULT.finditer(sent):
            claimed = money(m.group(1))
            if claimed < MIN: continue

            rates = [float(x) for x in RATE.findall(sent)] or [float(x) for x in RATE.findall(ctx)]
            yrs   = [int(x) for x in YEARS.findall(sent)] or [int(x) for x in YEARS.findall(ctx)]
            am = AGES.search(sent) or AGES.search(ctx)
            if am: yrs = yrs + [int(am.group(2))-int(am.group(1))]
            if not rates or not yrs: continue

            pmm = PERMONTH.search(sent) or PERMONTH.search(ctx)
            monthlies = [money(pmm.group(1))] if pmm else [0.0]
            # every other figure in the sentence is a candidate starting balance
            others = {money(t) for t in re.findall(MONEY, sent)
                      if money(t) >= MIN and abs(money(t)-claimed) > 1
                      and (not pmm or abs(money(t)-monthlies[0]) > 1)}
            principals = sorted(others | {0.0})

            alts=[]
            for r in rates:
                for y in yrs:
                    for P in principals:
                        for M in monthlies:
                            alts.append((f'{r}% {y}y P=${P:,.0f} M=${M:,.0f} monthly', monthly(P,M,r,y)))
                            if M == 0:
                                alts.append((f'{r}% {y}y P=${P:,.0f} annual', annual(P,r,y)))
                    for M in monthlies:
                        if M: alts.append((f'{y}y contributed only', M*12*y))
            if not alts: continue
            alts=[a for a in alts if a[1] > 0]
            if not alts: continue
            best=min(alts,key=lambda a: abs(a[1]-claimed))
            if abs(best[1]-claimed)/claimed > TOL:
                out.append(dict(file=path, claimed=claimed, best=best[0],
                                value=best[1], off=(claimed-best[1])/max(best[1],1e-9), sent=sent[:230]))
    return out

res=[]
for f in sorted(glob.glob('guides/*.html')+glob.glob('tools/*.html')+glob.glob('*.html')):
    res += audit(f)
seen,uniq=set(),[]
for x in res:
    k=(x['file'],round(x['claimed']))
    if k in seen: continue
    seen.add(k); uniq.append(x)
print(f'{len(res)} flagged, {len(uniq)} distinct\n')
for x in sorted(uniq,key=lambda z:-abs(z['off'])):
    print(f"[{x['file'].split('/')[-1]}]  claims ${x['claimed']:,.0f}   closest ${x['value']:,.0f} ({x['best']})  {x['off']*100:+.0f}%")
    print(f"   \"{x['sent'][:190]}\"\n")
json.dump(uniq, open('audit-findings.json','w'), indent=1)

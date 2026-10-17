import json, os, statistics, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
LABELS = ['ROLE_CLARITY', 'MANAGER_SUPPORT', 'BELONGING', 'ONBOARDING_TRAINING', 'WORKLOAD', 'ESCALATE']
DRIVERS = LABELS[:5]

def jl(p):
    return [json.loads(l) for l in open(p)]

def vec(r):
    v = {d: d in r['drivers'] for d in DRIVERS}
    v['ESCALATE'] = bool(r['escalate'])
    return v

writer = {r['id']: r for r in jl(os.path.join(ROOT, 'data', 'replies.jsonl'))}
a = {r['id']: vec(r) for r in jl(os.path.join(ROOT, 'data', 'labels_a.jsonl'))}
b = {r['id']: vec(r) for r in jl(os.path.join(ROOT, 'data', 'labels_b.jsonl'))}
w = {i: vec(r) for i, r in writer.items()}
ids = sorted(writer)
gold = {i: {l: (w[i][l] + a[i][l] + b[i][l]) >= 2 for l in LABELS} for i in ids}
lang = {i: writer[i]['lang'] for i in ids}
dev = [i for i in ids if int(i[1:]) % 10 in (0, 3, 6)]
test = [i for i in ids if i not in dev]

def counts(pred, ids_, l):
    tp = sum(pred[i][l] and gold[i][l] for i in ids_)
    fp = sum(pred[i][l] and not gold[i][l] for i in ids_)
    fn = sum(not pred[i][l] and gold[i][l] for i in ids_)
    tn = len(ids_) - tp - fp - fn
    return tp, fp, fn, tn

def f1(tp, fp, fn, tn):
    return 2 * tp / (2 * tp + fp + fn) if tp else 0.0

def kappa(tp, fp, fn, tn):
    n = tp + fp + fn + tn
    po = (tp + tn) / n
    pe = ((tp + fp) * (tp + fn) + (fn + tn) * (fp + tn)) / n / n
    return (po - pe) / (1 - pe) if pe < 1 else 1.0

def binarise(res, th):
    return {i: {l: res[i]['probs'][l] >= th[l] for l in LABELS} for i in res}

def tune(res):
    th = {}
    for l in LABELS:
        best = None
        for t in [x / 100 for x in [*range(5, 96, 5), 97, 98, 99]]:
            p = binarise(res, {**{k: .5 for k in LABELS}, l: t})
            tp, fp, fn, tn = counts(p, dev, l)
            beta2 = 4 if l == 'ESCALATE' else 1
            s = (1 + beta2) * tp / ((1 + beta2) * tp + beta2 * fn + fp) if tp else 0
            if best is None or s > best[0]:
                best = (s, t)
        th[l] = best[1]
    return th

def report(name, pred, ids_, lat=None, fails=0):
    rows = {l: counts(pred, ids_, l) for l in LABELS}
    macro_f1 = statistics.mean(f1(*rows[l]) for l in DRIVERS)
    macro_k = statistics.mean(kappa(*rows[l]) for l in DRIVERS)
    by_lang = {g: statistics.mean(f1(*counts(pred, [i for i in ids_ if lang[i] == g], l)) for l in DRIVERS) for g in ('bm', 'en', 'manglish')}
    tp, fp, fn, tn = rows['ESCALATE']
    out = {'model': name, 'n': len(ids_), 'drivers_macro_f1': round(macro_f1, 3), 'drivers_macro_kappa': round(macro_k, 3),
           'f1_by_lang': {k: round(v, 3) for k, v in by_lang.items()},
           'f1_by_driver': {l: round(f1(*rows[l]), 3) for l in DRIVERS},
           'escalation_recall': f'{tp}/{tp + fn}', 'escalation_false_alarms': f'{fp}/{fp + tn}', 'failed_calls': fails}
    if lat:
        s = sorted(lat)
        out['latency_median_s'] = round(statistics.median(s), 2)
        out['latency_p95_s'] = round(s[int(len(s) * .95) - 1], 2)
    return out

summary = {'gold': 'majority of writer + 2 blind labellers (all AI agents, not humans)',
           'labeller_agreement_kappa': {}, 'split': {'dev': len(dev), 'test': len(test)}, 'results': []}
for x, y, n in ((w, a, 'writer_vs_A'), (w, b, 'writer_vs_B'), (a, b, 'A_vs_B')):
    summary['labeller_agreement_kappa'][n] = round(statistics.mean(kappa(
        sum(x[i][l] and y[i][l] for i in ids), sum(x[i][l] and not y[i][l] for i in ids),
        sum(not x[i][l] and y[i][l] for i in ids), sum(not x[i][l] and not y[i][l] for i in ids)) for l in DRIVERS), 3)

for name in sys.argv[1:]:
    raw = {r['id']: r for r in jl(os.path.join(ROOT, 'results', f'{name}.jsonl'))}
    ok = {i: r for i, r in raw.items() if r['ok']}
    fails = len(raw) - len(ok)
    for i in ids:
        if i not in ok:
            ok[i] = {'probs': {l: 0.0 for l in LABELS}, 'latency': None}
    lat = [r['latency'] for i, r in raw.items() if r['ok'] and i in test]
    half = binarise(ok, {l: .5 for l in LABELS})
    summary['results'].append(report(f'{name} @0.5', half, test, lat, fails))
    if name.startswith('clef'):
        th = tune(ok)
        r = report(f'{name} @tuned-on-dev', binarise(ok, th), test, lat, fails)
        r['thresholds'] = th
        summary['results'].append(r)

json.dump(summary, open(os.path.join(ROOT, 'results', 'summary.json'), 'w'), indent=1)
print(json.dumps(summary, indent=1))

import json, os, statistics, sys
from concurrent.futures import ThreadPoolExecutor
from run import CONTEXT, E, post, time, urllib

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
DRIVERS = {
    'ROLE_CLARITY': ('Does the new hire say their role or tasks are unclear?',
                     'Tasks or priorities are unclear; expectations, KPIs or targets are unclear; the job is not what they were told when hired; they are unsure who they report to.'),
    'MANAGER_SUPPORT': ('Does the new hire say their manager or supervisor is not supporting them?',
                        'The supervisor is slow to reply or hard to reach; gives little guidance or help; gives little or no feedback.'),
    'BELONGING': ('Does the new hire say they are not part of the team?',
                  'They are left out or sit alone; not included in team chats or outings; teased or treated as an outsider by colleagues; a language gap with the team.'),
    'ONBOARDING': ('Does the new hire report a problem with onboarding or the work environment?',
                   'Company direction, policies, procedures or forms are unclear; first-days setup is missing (system access, login, locker, staff card, handbook); the workplace is uncomfortable: heat, canteen, car park, rest areas, culture, engagement activities.'),
    'TRAINING': ('Does the new hire report a problem with their job training?',
                 'No or too little job training; training not relevant to the job; training material hard to use (language, length); learning only by watching others.'),
    'WORKLOAD': ('Does the new hire report a workload problem?',
                 'Too much or too little work; long hours or overtime; short of staff or covering for others; shifts that keep changing or come at short notice.'),
}
NO = 'The reply names no such problem, the problem is resolved, it is praise, or it is only about pay, growth, commute, safety or a legal matter.'
ESC = {
    'ESC_HARASS': 'Does the new hire report harassment, sexual harassment, discrimination, bullying, mocking or threats by someone at work?',
    'ESC_SELFHARM': 'Does the new hire hint at self-harm, suicide, hopelessness or a mental-health crisis, even quietly or indirectly?',
    'ESC_SAFETY': 'Does the new hire report a physical safety or health hazard at work?',
    'ESC_LEGAL': 'Does the new hire report a wage or labour-law problem, such as unpaid wages or overtime, salary withheld, or a statutory contribution not paid?',
    'ESC_FORCED': 'Does the new hire report a sign of forced labour, such as a held passport or ID, a recruitment debt, or not being free to leave or quit?',
}
ESC_NO = ('This is not a real report. Tiredness, busyness, slang or exaggeration (for example "mati la", "nak pengsan", "dying") '
          'and normal deductions (EPF, SOCSO, tax, a late fine) or plain pay, growth or commute complaints do not count.')
LABELS = [*DRIVERS, 'ESCALATE']

def ask(model, text):
    q = {d: {'type': 'noul', 'instructions': f'{CONTEXT} {a}', 'criteria': {'true': yes, 'false': NO}} for d, (a, yes) in DRIVERS.items()}
    q.update({k: {'type': 'noul', 'instructions': f'{CONTEXT} {a}', 'criteria': {'true': 'Yes, the reply reports this, even if briefly or indirectly.', 'false': ESC_NO}} for k, a in ESC.items()})
    url = f"https://api.cloudflare.com/client/v4/accounts/{E['CLOUDFLARE_ACCOUNT_ID']}/ai/run/@cf/cloudflare/{model}"
    data, dt = post(url, {'Authorization': f"Bearer {E['CLOUDFLARE_API_TOKEN']}"}, {'model': model, 'state': text, 'questions': q})
    if not data.get('success'):
        raise RuntimeError(json.dumps(data.get('errors'))[:300])
    probs = {k: v['noul'] for k, v in data['result']['answers'].items()}
    probs['ESCALATE'] = max(probs[k] for k in ESC)
    return probs, dt

def one(model, item):
    err = ''
    for attempt in range(3):
        try:
            probs, dt = ask(model, item['text'])
            return {'id': item['id'], 'ok': True, 'latency': round(dt, 3), 'probs': probs}
        except Exception as e:
            err = str(e) + (' ' + e.read().decode()[:300] if isinstance(e, urllib.error.HTTPError) else '')
            time.sleep(2 * (attempt + 1))
    return {'id': item['id'], 'ok': False, 'error': err}

def predict(probs, th):
    if probs['ESCALATE'] >= th['ESCALATE']:
        return [], True
    hits = sorted((d for d in DRIVERS if probs[d] >= th[d]), key=lambda d: -probs[d])
    return hits[:2], False

def kappa(pairs):
    n = len(pairs)
    po = sum(a == b for a, b in pairs) / n
    g = sum(a for a, _ in pairs) / n
    m = sum(b for _, b in pairs) / n
    pe = g * m + (1 - g) * (1 - m)
    return None if pe == 1 else (po - pe) / (1 - pe)

def score(rows, th):
    out = {}
    for item, probs in rows:
        out[item['id']] = predict(probs, th)
    ks = {d: kappa([(d in i['drivers'], d in out[i['id']][0]) for i, _ in rows]) for d in DRIVERS}
    esc = [i for i, _ in rows if i['escalate']]
    calm = [i for i, _ in rows if not i['escalate']]
    counted = [d in i['drivers'] for i, _ in rows for d in out[i['id']][0]]
    return {
        'kappa_mean': round(statistics.mean(k for k in ks.values() if k is not None), 3),
        'kappa': {d: None if k is None else round(k, 3) for d, k in ks.items()},
        'kappa_by_lang': {l: round(statistics.mean(k for k in (kappa([(d in i['drivers'], d in out[i['id']][0]) for i, _ in rows if i['lang'] == l]) for d in DRIVERS) if k is not None), 3) for l in ('ms', 'en', 'zh', 'manglish')},
        'precision': round(sum(counted) / len(counted), 3) if counted else None,
        'escalation_recall': f"{sum(out[i['id']][1] for i in esc)} of {len(esc)}",
        'forced_labour_recall': f"{sum(out[i['id']][1] for i in esc if i['category'] == 'forced_labour_indicator')} of {sum(i['category'] == 'forced_labour_indicator' for i in esc)}",
        'false_alarms': f"{sum(out[i['id']][1] for i in calm)} of {len(calm)}",
        'missed': [i['id'] for i in esc if not out[i['id']][1]],
        'alarms': [i['id'] for i in calm if out[i['id']][1]],
    }

def tune(rows):
    grid = [x / 100 for x in [*range(5, 96, 5), 97, 98, 99]]
    th = {l: .5 for l in LABELS}
    for d in DRIVERS:
        th[d] = max(grid, key=lambda t: kappa([(d in i['drivers'], p[d] >= t) for i, p in rows if not i['escalate']]) or 0)
    esc = [(i['escalate'], p['ESCALATE']) for i, p in rows]
    th['ESCALATE'] = max((t for t in grid if all(s >= t for e, s in esc if e)), default=.05)
    return th

if __name__ == '__main__':
    model = sys.argv[1]
    items = [json.loads(l) for l in open(os.path.join(ROOT, 'eval', 'sets', 'classify.jsonl'))]
    raw = os.path.join(ROOT, 'eval', 'results', f'clef-sets-{model}-raw.jsonl')
    done = {r['id']: r for r in map(json.loads, open(raw)) if r['ok']} if os.path.exists(raw) else {}
    with ThreadPoolExecutor(4) as ex:
        res = list(ex.map(lambda it: done.get(it['id']) or one(model, it), items))
    with open(raw, 'w') as f:
        f.writelines(json.dumps(r) + '\n' for r in res)
    by = {r['id']: r for r in res}
    rows = lambda split: [(i, by[i['id']]['probs']) for i in items if i['split'] == split and by[i['id']]['ok']]
    lat = sorted(r['latency'] for r in res if r['ok'])
    th = tune(rows('dev'))
    summary = {'model': model, 'failed_calls': sum(not r['ok'] for r in res), 'latency_p50_s': lat[len(lat) // 2], 'latency_p90_s': lat[int(len(lat) * .9)],
               'at_0.5': score(rows('test'), {l: .5 for l in LABELS}), 'thresholds_from_dev': th, 'tuned': score(rows('test'), th)}
    json.dump(summary, open(os.path.join(ROOT, 'eval', 'results', f'clef-sets-{model}-summary.json'), 'w'), indent=1, ensure_ascii=False)
    print(json.dumps({k: summary[k] for k in ('model', 'failed_calls', 'latency_p50_s')} | {'at_0.5': {k: summary['at_0.5'][k] for k in ('kappa_mean', 'escalation_recall', 'false_alarms')}, 'tuned': {k: summary['tuned'][k] for k in ('kappa_mean', 'kappa', 'kappa_by_lang', 'precision', 'escalation_recall', 'forced_labour_recall', 'false_alarms')}}, indent=1))

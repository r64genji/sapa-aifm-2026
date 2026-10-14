const rules: [RegExp, string][] = [
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[EMAIL]"],
  [/(?<!\d)\d{6}[- ]?\d{2}[- ]?\d{4}(?!\d)/g, "[NRIC]"],
  [/(?<!\d)(?:\+?60[- ]?|0)(?:1\d|[3-9])[- ]?\d{3,4}[- ]?\d{4}(?!\d)/g, "[PHONE]"],
];

export function mask(text: string) {
  return rules.reduce((out, [pattern, placeholder]) => out.replace(pattern, placeholder), text);
}

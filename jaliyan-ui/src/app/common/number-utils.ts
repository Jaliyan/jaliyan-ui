export const gujaratiDigits = ['૦','૧','૨','૩','૪','૫','૬','૭','૮','૯'];
export const englishDigits = ['0','1','2','3','4','5','6','7','8','9'];

export function gujaratiToEnglishDigits(input: string): string {
  if (!input) return input;
  return input.replace(/[૦-૯]/g, (d) => englishDigits[gujaratiDigits.indexOf(d)]);
}

export function englishToGujaratiDigits(input: string): string {
  if (!input) return input;
  return input.replace(/[0-9]/g, (d) => gujaratiDigits[englishDigits.indexOf(d)]);
}

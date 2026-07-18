export const gujaratiDigits = ['૦', '૧', '૨', '૩', '૪', '૫', '૬', '૭', '૮', '૯'];
export const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function gujaratiToEnglishDigits(input: string | number): string {
  if (input == null) return '';
  const str = input.toString(); // ✅ Always convert to string
  return str.replace(/[૦-૯]/g, (d) => englishDigits[gujaratiDigits.indexOf(d)]);
}

export function englishToGujaratiDigits(input: string | number): string {
  if (input == null) return '';
  const str = input.toString(); // ✅ Always convert to string
  return str.replace(/[0-9]/g, (d) => gujaratiDigits[englishDigits.indexOf(d)]);
}

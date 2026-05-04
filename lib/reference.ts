const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export function generateReference(): string {
  let result = ''
  const array = new Uint8Array(8)
  crypto.getRandomValues(array)
  for (const byte of array) {
    result += CHARS[byte % CHARS.length]
  }
  return result
}

export function formatReference(ref: string): string {
  return `EMB-${ref}`
}

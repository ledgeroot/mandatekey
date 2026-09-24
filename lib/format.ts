/** Middle-elide a hash or address for display; the full value belongs in `title`. */
export function elide(value: string, head = 10, tail = 8): string {
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

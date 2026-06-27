/**
 * Escape a value for safe interpolation inside a PostgREST `.or()` / `.filter()`
 * string. PostgREST treats `,` `.` `:` `(` `)` as structural characters; wrapping
 * the value in double quotes makes those literal, and stripping embedded quotes /
 * backslashes prevents the value from breaking out of the quoted segment.
 *
 * Use for any user-supplied value that is concatenated into an `.or(...)` string.
 */
export function pgOrValue(value: string): string {
  return `"${String(value).replace(/["\\]/g, "")}"`;
}

/**
 * Escape LIKE/ILIKE wildcards (`%` and `_`) and the escape char (`\`) so a value
 * is matched literally rather than as a pattern. Use when calling `.ilike()` /
 * `.like()` with user input that should be an exact (case-insensitive) match.
 */
export function escapeLike(value: string): string {
  return String(value).replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

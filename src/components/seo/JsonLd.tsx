/**
 * Renders a schema.org JSON-LD block.
 *
 * The payload is escaped before it reaches the DOM. A `</script>` sequence
 * inside any database string - a scholarship title, a blog body - would
 * otherwise close the tag early and turn editor content into markup. Escaping
 * `<` to `<` is enough to make that impossible while leaving
 * valid JSON that parses identically.
 */
function serialize(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    // U+2028 / U+2029 are valid in JSON but act as line terminators inside a
    // script body, so they are escaped rather than left raw.
    .replace(/\\u2028/g, "\\u2028")
    .replace(/\\u2029/g, "\\u2029");
}

export default function JsonLd({ data }: { data: unknown }) {
  if (data === null || data === undefined) return null;
  return (
    <script
      type="application/ld+json"
      // Serialised above, with `<` neutralised, so no database string can
      // terminate the script element early.
      dangerouslySetInnerHTML={{ __html: serialize(data) }}
    />
  );
}

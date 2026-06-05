// ============================================================
// BuildBot — Preview Builder
// ============================================================
// Assembles generated files into a single self-contained HTML
// document for rendering in a sandboxed iframe via srcdoc.
// ============================================================

export class PreviewBuilder {
  /**
   * Assembles index.html, style.css, and script.js into a single
   * self-contained HTML string with inline styles and scripts.
   *
   * Injects a CSP meta tag for defense-in-depth security.
   */
  public static assemble(files: Array<{ path: string; content: string }>): string {
    const html = files.find(f => f.path === 'index.html')?.content ?? '';
    const css = files.find(f => f.path === 'style.css')?.content ?? '';
    const js = files.find(f => f.path === 'script.js')?.content ?? '';

    // CSP meta tag for defense-in-depth (iframe sandbox is primary defense)
    const cspTag = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:;">`;

    let assembled = html;

    // Inject CSP into <head> if <head> exists
    if (assembled.match(/<head[^>]*>/i)) {
      assembled = assembled.replace(
        /(<head[^>]*>)/i,
        `$1\n    ${cspTag}`
      );
    }

    // Replace <link rel="stylesheet" href="style.css"> with inline <style>
    // Handle various forms: with/without quotes, with/without ./
    assembled = assembled.replace(
      /<link[^>]*href=["'](?:\.\/)?style\.css["'][^>]*\/?>/gi,
      `<style>\n${css}\n</style>`
    );

    // Replace <script src="script.js"></script> with inline <script>
    assembled = assembled.replace(
      /<script[^>]*src=["'](?:\.\/)?script\.js["'][^>]*><\/script>/gi,
      `<script>\n${js}\n</script>`
    );

    return assembled;
  }
}

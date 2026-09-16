# SABIN sheets generator

Local preview: http://127.0.0.1:4173/

Run from this folder: `python3 -m http.server 4173 --bind 127.0.0.1 --directory dist`

The application is static and assembles PDFs entirely in the browser. Fonts, libraries and artwork are bundled with the app. GitHub Pages publishes the `dist` folder using the included workflow.

## Files

- `dist/index.html`, `style.css`: interface matching the invitation generator's visual language.
- `dist/catalog.js`: collection mappings and ordered module catalog.
- `dist/pdf-engine.js`: shared PDF assembly, dynamic cover layout and font embedding.
- `dist/app.js`: inputs, ordered selection, preview carousel, download and page-scoped tools.
- `dist/assets/`: supplied module PDFs, clean cover templates, 12 title-only placeholder PDFs, supplied font files and logo.
- `tools/prepare_assets.py`: recreates the assets from PDF, font archive and logo paths provided as command-line arguments without editing originals.
- `tools/verify.mjs`: exercises the same PDF engine used in the browser. Run with `node tools/verify.mjs`.

## Cover behavior

Suspension Methods retains the supplied PDF artwork. Only its index text is removed and regenerated. Custom covers retain the source texture and vector logo, then draw editable title and copy, automatic index and responsive table rules. The right-hand website treatment is retained visually. Long titles wrap and adjust the top row; long copy moves the index upward. Text that exceeds a single cover's capacity produces a visible error and disables download.

Other collection covers are title-only placeholders with automatic contents. Module placeholders contain only a title. The index is a numbered module sequence, not page references. Original module pages are copied without global page numbers or artwork changes. The newer supplied ALL SHEETS.pdf already omits the old 6/7 module page numbers.

Custom mode preserves the current selected modules. Selecting a premade cover resets to its mapped modules. Extra checked modules append; dragging a selected module’s handle changes its order (arrow keys also work while the handle is focused). Multi-page module PDFs are supported.

## Future assets

Replace each placeholder PDF under its stable filename, then set its `placeholder` flag to false in `catalog.js`. New collections need a catalog entry and selector option. Finished cover templates must have a blank index area; their index coordinates should be recorded in the PDF engine before integration. The current non-Suspension covers deliberately use simple placeholder positions.

## Verification

Checked all five collections, custom title/copy, all ten modules, reordered actual module content, cover-only output, overflow handling, text extraction and PDF rendering. Chrome successfully downloaded a five-page PDF; the saved file was reopened and verified. The embedded app browser previews correctly, but its download event did not complete in testing; use Chrome for downloads in this prototype.

Messina's supplied CFF OpenType font is embedded with the correct PDF FontFile3/OpenType descriptor. Full-font embedding and disabled ligatures avoid subset encoding issues and preserve searchable text. No fonts are fetched from external services.

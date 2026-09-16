# Documentation visual assets

These raster infographics support the surrounding Markdown; they never replace the written source of truth. Every use includes descriptive alt text, and the corresponding guide explains the same concepts in text.

| Asset                      | Used for                                               | Update when                                                               |
| -------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------- |
| `runtime-architecture.png` | Client-to-Catalog runtime path and supporting layers   | A runtime stage, protocol boundary, or major ownership layer changes      |
| `tool-lifecycle.png`       | Definition-to-response authoring lifecycle             | Feature compilation, registration, middleware, or result flow changes     |
| `verification-layers.png`  | Progression from static checks to black-box confidence | A required gate is added, removed, reordered, or materially changes scope |

## Maintenance rules

1. Verify every rendered label at full resolution; generated text is not assumed correct.
2. Keep the visual model consistent with the current architecture and command definitions.
3. Keep detailed instructions in Markdown so the documentation remains searchable and accessible.
4. Use concise labels and high contrast so images remain readable at typical README width.
5. Add a new asset only when it explains a relationship more clearly than prose or a small table.

The current set uses a shared navy, cyan, teal, violet, and amber visual language so architecture, authoring, and verification read as one documentation system.

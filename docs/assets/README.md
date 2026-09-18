# Documentation visual assets

These application-specific infographics support the surrounding Markdown; they never replace the written source of truth. Every use includes descriptive alt text, and the corresponding guide explains the same concepts in text. Generic MCP Kernel visuals live with the [`mcp-kernel` documentation](https://github.com/Coderrob/mcp-kernel/tree/main/docs/assets).

| Asset                      | Used for                                               | Update when                                                               |
| -------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------- |
| `runtime-architecture.svg` | Client-to-Catalog runtime path and package ownership   | A runtime stage, protocol boundary, or major ownership layer changes      |
| `verification-layers.png`  | Progression from static checks to black-box confidence | A required gate is added, removed, reordered, or materially changes scope |

## Maintenance rules

1. Verify every rendered label at full resolution; generated text is not assumed correct.
2. Keep the visual model consistent with the current architecture and command definitions.
3. Keep detailed instructions in Markdown so the documentation remains searchable and accessible.
4. Use concise labels and high contrast so images remain readable at typical README width.
5. Add a new asset only when it explains a relationship more clearly than prose or a small table.

The current set uses a shared navy, cyan, teal, violet, and amber visual language so architecture and verification read as one documentation system.

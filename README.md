# KFM Unified Knowledge Lab

Interactive demo of unified knowledge representation across graphs, tables, relational databases, Markdown, JSON, PDF, and image text.

**[Open the live demo](https://hkust-knowcomp.github.io/KFM-Benchmark-Demo/)**

- Change order constraints and supplier notices to recompute a procurement decision.
- Inspect typed knowledge units, links, and native evidence.
- Explore PDF/OCR regions and controlled composition results.
- Compare measured shared-encoder retrieval and frozen BIRD schema retrieval results.

The procurement scenario is authored demonstration data. Benchmark panels report aggregate measurements and their limitations. The trained encoder shows negative transfer on BIRD schema retrieval; this is not official text-to-SQL execution accuracy. The browser procurement task uses declared rules and mappings.

This repository contains only the static website, authored fixtures, and aggregate result summaries. The main KFM-Benchmark repository remains private. No private research documents, benchmark databases, model weights, or evaluator gold are included.

## Local preview

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/`. Python is needed only to serve static files; all demo interactions run in the browser.

The `.nojekyll` file enables direct static serving through GitHub Pages. Publishing source: `main`, repository root.

## License

Original website code and documentation are distributed under the [MIT License](LICENSE).

# remote-docs

static documentation viewer that loads markdown pages from a remote source at runtime.

## usage

open `index.html` in a browser and pass one of:

- `?r=user/repo` (or `?r=repo`) - load `remote-docs.txt` from a github repo at `docs/remote-docs.txt`
- `?r=user/repo&rp=path` - change the docs path inside the repo
- `?l=https://example.com/folder` - load any `remote-docs.txt` from a base url
- `?ll=3000/folder` - load from `http://localhost:3000/folder/remote-docs.txt`
- `?l=https://example.com/page.md` - render a single markdown file (no config needed)

`?r` and `?l` accept a partial path; if it does not end in `.md` or `.txt`, `remote-docs.txt` is appended automatically.

## config format (`remote-docs.txt`)

```
Project Title
Page One | page-one.md
Page Two | guides/page-two.md

# Guides
Intro | guides/intro.md
Advanced | guides/advanced.md
```

- line 1: site title
- other lines: `Title | path.md` for each page
- `# Section Name` starts a collapsible section
- blank lines are ignored
- `//` comments are ignored

## generate config

```
bun run src/gen-config.ts <dir> [title] [out]
```

walks `<dir>` for `.md` files,
groups by subdirectory into sections, and writes `<out>` (default `remote-docs.txt`).
title is reused from the existing file if not given.

## keyboard

| key | action |
|-----|--------|
| `j` | next page |
| `k` | previous page |
| `g g` | first page |
| `G` | last page |
| `?` | show/hide help |
| `Esc` | close menu / help |

shortcuts are active when focus is not in a text field.

## license

MIT License.

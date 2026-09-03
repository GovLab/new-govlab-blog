# `draft` — the preview branch

This branch exists only to back the **Preview** button on the Directus `blog`
collection. Netlify deploys it to:

    https://draft--blog-thegovlab.netlify.app/<slug>

Production (`blog.thegovlab.org`) is built from **`blog-vite`**. Do not develop
here — work on `blog-vite`, and this branch follows automatically.

## What differs from `blog-vite`

Exactly two files, and nothing else should ever be edited here:

| File | Difference | Why |
|---|---|---|
| `src/pages/post.vue` | no `status: published` filter | so an unpublished post renders for the editor previewing it |
| `netlify.toml` | `X-Robots-Tag: noindex, nofollow` | this is a public URL serving unpublished content |

## How it stays current

`.github/workflows/update-draft-branch.yml` (on `blog-vite`) runs on every push
to production. It merges `blog-vite` into `draft`, then restores the two files
above from `draft`, so the preview site tracks production without losing its
preview behaviour. The file list lives in that workflow's `DRAFT_ONLY` variable
— add to it if this branch ever needs to own another file.

## Note on access

Draft rows are currently readable from `directus.theburnescenter.org` **without
authentication**, which is why this build needs no API token. If that is ever
tightened — and it arguably should be — this branch will need a token at build
time and the preview will break until it gets one.

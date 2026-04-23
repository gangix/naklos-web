Place the following 1200×630 PNG images here:

- `default.png` — generic Naklos branding; fallback for posts without a specific image.
- `yakit-takibi.png` — image for the "Filo Yakıt Takibi Nasıl Yapılır?" post.

If these files are missing at build time, the prerender script emits OG tags pointing at `/naklos-icon.svg` — social platforms won't render a card, but the build does not fail.

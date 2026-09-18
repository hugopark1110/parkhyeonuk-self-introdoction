# Deployment architecture

This repository is the Vercel frontend of 박현욱. All visual assets, fonts, audio, 3D models, and animation code are included locally. The site uses standard Next.js with the committed pnpm lockfile, Node.js 22, and the settings in vercel.json.

## Retained content backend

The fixed upstream is https://parkhyeonuk-still-making.skfkgusdnr75.chatgpt.site.

- GET /api/entries fetches public entries and always returns canEdit:false. Draft contents are stripped and ten archive slots are retained.
- GET /api/camera-photos fetches the public camera gallery.
- GET /api/files/[key] validates the key and redirects to the existing media endpoint, so large video and audio files do not pass through a Vercel Function.
- /admin redirects to the existing authenticated editor.
- Write requests on the Vercel frontend return405 and identify the author editor.

The bridge sends no visitor cookies, authorization, or oai-* identity headers. It uses a fixed upstream origin, a 10-second timeout, fresh reads, strict response validation, and rejects upstream redirects. No Vercel secrets are required. Existing authentication/storage bindings are deliberately absent from this checkout.

Keep the original Site active: this is a frontend deployment, not a database and authentication migration. To remove the original backend later, migrate the saved entries, uploaded files, gallery, and author authentication first.

## Deployment

1. Create a private GitHub repository for this project and push the source to main.
2. Import that repository into Vercel. Select Next.js and the repository root; vercel.json supplies install and build commands.
3. Use Node.js22.x. No environment variables are needed by this adapter.
4. Confirm the Vercel deployment is Ready and check the public homepage, stories, audio, models, and admin redirect.

Do not upload node_modules, .next, runtime state, credentials, or .env files. GitHub repository creation and Vercel import still require the owner account to be signed in.

## Checks

pnpm verify:public checks credential isolation, draft stripping, content shapes, file-key validation, and read-only endpoints.
pnpm build runs the production Next.js build and TypeScript checks.

Official documentation:
- https://vercel.com/docs/frameworks/full-stack/nextjs
- https://vercel.com/docs/git/vercel-for-github
- https://vercel.com/docs/functions/limitations

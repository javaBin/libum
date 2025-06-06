# Welcome to Remix!

- 📖 [Remix docs](https://remix.run/docs)

## Development

Install dependencies:

```bash
bun install
```

Run the dev server:

```bash
bun dev
```

## Deployment

First, build your app for production:

```bash
bun run build
```

Then run the app in production mode:

```bash
bun run start
```

Now you'll need to pick a host to deploy it to.

### DIY

If you're familiar with deploying Node applications, the built-in Remix app server is production-ready.

Make sure to deploy the output of `bun run build`

- `build/server`
- `build/client`

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever css framework you prefer. See the [Vite docs on css](https://vitejs.dev/guide/features.html#css) for more information.

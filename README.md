# Homos Place

Interactive 3D scene with the audio story “Undressing authority”. Built with React and React Three Fiber.

## Development

- `npm ci` installs dependencies.
- `npm start` runs the development server.
- `npm test -- --watchAll=false` runs the tests.
- `npm run build` creates the production site in `build/`.

## Source files

- `src/App.js`: loading state, start screen, and page composition.
- `src/Scene.js`: model, lighting, camera, and fog.
- `src/PoemSequence.js`: audio controls and synchronized text.
- `src/storyTranscript.js`: transcript and word timings.
- `src/App.css`: page styles and animations.

## Hosting

In the repository settings, select **Pages → Source → GitHub Actions**. Pushes to `main` then build, test, and deploy the site. Relative asset URLs support both the repository URL and a custom domain. Configure a custom domain in the Pages settings before changing its DNS records.

Only published assets belong in `public/`. Local working files belong outside the repository or in the ignored `archive/` directory. Source maps are disabled in production builds.

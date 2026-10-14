# Dependency repair

- [x] Inspect package.json, vite.config.ts, and lockfile references to the incompatible JSX location helper.
- [x] Remove the helper if unused and regenerate dependency metadata without peer-dependency bypasses.
- [x] Run a clean npm install and verify the TripMind application with typecheck, build, and runtime checks.
- [ ] Save and report the dependency-fix checkpoint.

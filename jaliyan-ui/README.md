# JaliyanUi

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.10.

## Getting started (clone → run)

Follow these steps to run the app locally after cloning it from GitHub.

### 1. Prerequisites

- **Node.js LTS** — Node **22.x or 24.x (LTS)** is recommended.
  Do **not** use odd-numbered releases (e.g. 23.x); Angular reports them as unsupported.
  Check your version with:
  ```bash
  node -v
  npm -v
  ```
  If you use [nvm-windows](https://github.com/coreybutler/nvm-windows):
  ```bash
  nvm install lts
  nvm use 24.18.0
  ```

### 2. Clone the repository

```bash
git clone <your-repo-url>
cd jaliyan-ui
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm start
```
This runs `ng serve`. If you have the Angular CLI installed globally you can also run `ng serve` directly.

### 5. Open the app

Navigate to **http://localhost:4200/**. The app reloads automatically when you edit source files.

---

### Troubleshooting

- **`npm : term not recognized` / `node` not found** — Node isn't on your PATH. Install Node LTS (or run `nvm use <version>`) and open a new terminal.
- **`npm error code E401` during `npm install`** — Your npm registry requires authentication (e.g. a corporate Artifactory). Log in again and retry:
  ```bash
  npm login --registry=<your-registry-url>
  npm install
  ```
- **`EPERM: operation not permitted` during `npm install`** — Stop the dev server (`ng serve`) first; it locks files inside `node_modules`, then re-run `npm install`.
- **Build fails with "Inlining of fonts failed" (offline/no internet)** — Font inlining is already disabled in `angular.json` (`optimization.fonts: false`), so this is handled. Make sure you have the latest project files.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

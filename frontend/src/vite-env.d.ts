interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_API_TIMEOUT?: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

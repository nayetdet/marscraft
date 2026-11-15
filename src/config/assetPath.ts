const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function assetPath(path: string, basePath = BASE_PATH): string {
  return `${basePath}${path.startsWith('/') ? path : `/${path}`}`;
}

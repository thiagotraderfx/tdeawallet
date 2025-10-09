// packages/algorand-utils/src/assets/ipfs.ts
export function resolveIpfsUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${url.replace('ipfs://', '')}`;
  }
  return url;
}

/**
 * Links into the app from the AI chat widget's "Open in HikingBuddy" (PRD v33/v38, FR-27):
 * `#gearlist=<id>` opens that gearlist, `#item=<id>` shows that Gear Vault item. The server
 * builds them in src/core/widgetViews.ts (`links`). After use the hash is removed, so a reload
 * doesn't jump again.
 */
export type AppLinkKind = 'gearlist' | 'item';

export function readAppLink(kind: AppLinkKind, hash = window.location.hash): string | null {
  const prefix = `#${kind}=`;
  if (!hash.startsWith(prefix)) return null;
  try {
    return decodeURIComponent(hash.slice(prefix.length)) || null;
  } catch {
    return null;
  }
}

export function clearAppLink(kind: AppLinkKind): void {
  if (readAppLink(kind) === null) return;
  history.replaceState(null, '', window.location.pathname + window.location.search);
}

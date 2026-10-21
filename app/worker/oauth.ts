/**
 * Connecting an AI client to HikingBuddy (PRD v33, FR-26): OAuth 2.1 + PKCE by
 * workers-oauth-provider. The library implements the protocol (client registration, tokens,
 * discovery documents); we only own the page at /authorize:
 *   1. not signed in → the same "Sign in with Google" button as on the web (FR-23), which starts
 *      the usual HikingBuddy session (no Google client secret needed);
 *   2. signed in → a consent page "Allow Claude to use your HikingBuddy?" (Cancel / Allow).
 * The access token then carries { userId, clientName } (McpProps) to /mcp.
 * Also here: the "Connected AI apps" list and "Revoke access" for the Activity panel.
 */
import { AuthorizationError, CimdFetchError, OAuthProvider, type AuthRequest, type ConsentDescription } from '@cloudflare/workers-oauth-provider';
import type { Context, Hono } from 'hono';
import { sessionUser, endSession } from './auth';
import { mcpApiHandler } from './mcp/handler';
import { friendlyClientName } from './mcp/tools';
import type { AppEnv, Env, McpProps } from './env';

const DAY = 86_400;

/** One provider per origin: the MCP resource is `<origin>/mcp` (public address, localhost). */
const providers = new Map<string, OAuthProvider<Env>>();

export function oauthProviderFor(origin: string, defaultHandler: ExportedHandler<Env>): OAuthProvider<Env> {
  let provider = providers.get(origin);
  if (!provider) {
    provider = new OAuthProvider<Env>({
      apiRoute: '/mcp',
      apiHandler: mcpApiHandler as unknown as ExportedHandler<Env> & Pick<Required<ExportedHandler<Env>>, 'fetch'>,
      defaultHandler,
      authorizeEndpoint: '/authorize',
      tokenEndpoint: '/oauth/token',
      clientRegistrationEndpoint: '/oauth/register',
      scopesSupported: ['gear', 'offline_access'],
      requiredScopes: ['gear'],
      resourceMetadata: { resource: `${origin}/mcp`, authorization_servers: [origin], resource_name: 'HikingBuddy' },
      // Access tokens live an hour; the client renews them itself for as long as it keeps
      // using HikingBuddy. After 30 days without use the user signs in again (Martin, 2026-10-22).
      accessTokenTTL: 3600,
      refreshTokenTTL: 30 * DAY,
      refreshTokenIdleTTL: 30 * DAY,
      clientIdMetadataDocumentEnabled: true,
    });
    providers.set(origin, provider);
  }
  return provider;
}

// ---------------------------------------------------------------------------------------------
// The /authorize page

const escape = (value: string) => value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

function page(title: string, body: string, script = ''): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)} · HikingBuddy</title>
<link rel="icon" href="/favicon.svg">
<style>
:root{--bg:#faf4ee;--surface:#fffcf9;--line:#e9dccf;--ink:#2b1d24;--muted:#68545c;--accent:#b0502a;--accent-hover:#96421f;--accent-soft:#f8e1d3;--forest:#3e6b57;--forest-soft:#e1ede5;--warning:#80530a;--warning-soft:#fbebc8;--danger:#a3312f}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;background:linear-gradient(180deg,var(--bg) 0%,#f6ddc7 100%);color:var(--ink);font:15px/1.5 Overpass,'Segoe UI',system-ui,sans-serif;display:flex;align-items:center;justify-content:center;padding:16px}
.card{background:var(--surface);border:1px solid var(--line);border-radius:16px;box-shadow:0 12px 32px rgba(43,29,36,.12);max-width:440px;width:100%;padding:28px}
.brand{font:700 22px/1 'Barlow Condensed','Arial Narrow',system-ui,sans-serif;letter-spacing:.02em;color:var(--accent);margin:0 0 20px}
h1{font:600 24px/1.2 'Barlow Condensed','Arial Narrow',system-ui,sans-serif;margin:0 0 8px}
p{margin:0 0 12px;color:var(--muted)}
strong{color:var(--ink)}
ul{list-style:none;padding:0;margin:16px 0}
li{display:flex;gap:10px;align-items:flex-start;padding:6px 0}
li span.dot{flex:none;width:22px;height:22px;border-radius:50%;background:var(--forest-soft);color:var(--forest);display:inline-flex;align-items:center;justify-content:center;font-size:13px;font-weight:700}
.note{background:var(--warning-soft);color:var(--warning);border-radius:10px;padding:10px 12px;font-size:14px}
.who{font-size:14px;border-top:1px solid var(--line);padding-top:12px;margin-top:16px;display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap}
.actions{display:flex;justify-content:flex-end;gap:8px;margin-top:20px}
button{font:600 15px/1 Overpass,'Segoe UI',system-ui,sans-serif;border-radius:10px;padding:12px 18px;cursor:pointer;min-height:44px;border:1px solid var(--line);background:var(--surface);color:var(--ink)}
button.primary{background:var(--accent);border-color:var(--accent);color:#fff}
button.primary:hover{background:var(--accent-hover)}
button.link{border:none;background:none;padding:0;min-height:0;color:var(--accent);font-weight:600;font-size:14px;text-decoration:underline}
button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
#gsi{display:flex;justify-content:center;min-height:44px;margin:20px 0 8px}
.error{color:var(--danger);font-size:14px;min-height:20px;text-align:center}
</style></head>
<body><main class="card"><p class="brand">HikingBuddy</p>${body}</main>${script}</body></html>`;
}

function html(markup: string, status = 200, headers?: Headers): Response {
  const h = headers ?? new Headers();
  h.set('Content-Type', 'text/html; charset=utf-8');
  h.set('Cache-Control', 'no-store');
  return new Response(markup, { status, headers: h });
}

function signInPage(clientName: string, googleClientId: string): string {
  const body = `<h1>Sign in to connect ${escape(clientName)}</h1>
<p><strong>${escape(clientName)}</strong> wants to connect to your HikingBuddy. Sign in with the Google account you use for HikingBuddy.</p>
<div id="gsi"></div><p class="error" id="error" role="alert"></p>`;
  const script = `<script>
(function(){
  var err=document.getElementById('error');
  var s=document.createElement('script');s.src='https://accounts.google.com/gsi/client?hl=en';s.async=true;
  s.onerror=function(){err.textContent='Google sign-in could not be loaded. Check your connection or an ad blocker.'};
  s.onload=function(){
    google.accounts.id.initialize({client_id:${JSON.stringify(googleClientId)},ux_mode:'popup',callback:function(r){
      fetch('/auth/google',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','x-hikingbuddy':'1'},body:JSON.stringify({credential:r.credential})})
        .then(function(res){if(res.ok){location.reload()}else{return res.json().then(function(b){err.textContent=b.message||'Sign-in failed. Please try again.'})}})
        .catch(function(){err.textContent='Sign-in failed. Check your connection and try again.'});
    }});
    google.accounts.id.renderButton(document.getElementById('gsi'),{theme:'outline',size:'large',text:'signin_with',shape:'pill',width:280});
  };
  document.head.appendChild(s);
})();
</script>`;
  return page('Sign in', body, script);
}

function consentPage(details: ConsentDescription, clientName: string, handle: string, user: { name: string; email: string }, action: string): string {
  const origin = details.clientDomain
    ? `<p>Published by <strong>${escape(details.clientDomain)}</strong>. Access will be sent to <strong>${escape(details.redirectHost)}</strong>.</p>`
    : `<p>Access will be sent to <strong>${escape(details.redirectHost)}</strong>. This app named itself; HikingBuddy can't verify the name.</p>`;
  const local = details.redirectIsLoopback
    ? '<p class="note">This sends access to an app on your computer. Continue only if you just started connecting from it.</p>'
    : '';
  const body = `<h1>Allow ${escape(clientName)} to use your HikingBuddy?</h1>
${origin}${local}
<ul>
<li><span class="dot" aria-hidden="true">✓</span><span>Read your Gear Vault, gearlists, template and snapshots.</span></li>
<li><span class="dot" aria-hidden="true">✓</span><span>Add, change and delete gear, categories and gearlists.</span></li>
<li><span class="dot" aria-hidden="true">✓</span><span>Every change shows in <strong>Activity</strong>, where you can undo it. You can revoke access there any time.</span></li>
</ul>
<form method="post" action="${escape(action)}">
<input type="hidden" name="handle" value="${escape(handle)}">
<div class="actions"><button type="submit" name="decision" value="deny">Cancel</button><button type="submit" name="decision" value="approve" class="primary">Allow</button></div>
</form>
<div class="who"><span>Signed in as <strong>${escape(user.name)}</strong> (${escape(user.email)})</span>
<form method="post" action="/authorize/switch"><input type="hidden" name="return" value="${escape(action)}"><button type="submit" class="link">Not you?</button></form></div>`;
  return page(`Allow ${clientName}`, body);
}

function errorPage(message: string, status = 400): Response {
  return html(page('Could not connect', `<h1>Could not connect</h1><p>${escape(message)}</p><p>Close this window and start connecting again from your AI app.</p>`), status);
}

function oauthError(err: unknown): Response {
  if (err instanceof AuthorizationError && err.redirectTo) return Response.redirect(err.redirectTo, 302);
  if (err instanceof AuthorizationError) return errorPage(err.description || 'This sign-in link is no longer valid.');
  if (err instanceof CimdFetchError) return errorPage('This app could not be verified.');
  throw err;
}

export function registerAuthorizeRoutes(app: Hono<AppEnv>): void {
  app.get('/authorize', async (c) => {
    const oauth = c.env.OAUTH_PROVIDER;
    let request: AuthRequest;
    let details: ConsentDescription;
    try {
      request = await oauth.parseAuthRequest(c.req.raw);
      details = await oauth.describeConsent(request);
    } catch (err) {
      return oauthError(err);
    }
    const clientName = friendlyClientName(details.clientName);
    const user = await sessionUser(c);
    if (!user) {
      if (!c.env.GOOGLE_CLIENT_ID) return errorPage("Sign-in isn't set up yet.", 503);
      return html(signInPage(clientName, c.env.GOOGLE_CLIENT_ID));
    }
    const consent = await oauth.beginConsent(request);
    const url = new URL(c.req.url);
    return html(consentPage(details, clientName, consent.handle, user, url.pathname + url.search), 200, consent.headers);
  });

  app.post('/authorize', async (c) => {
    const oauth = c.env.OAUTH_PROVIDER;
    const user = await sessionUser(c);
    if (!user) return errorPage('You were signed out. Start connecting again from your AI app.', 401);
    const form = await c.req.raw.clone().formData();
    const handle = String(form.get('handle') ?? '');
    try {
      if (form.get('decision') !== 'approve') {
        const denied = await oauth.denyConsent(c.req.raw, handle);
        return new Response(null, { status: 302, headers: denied.headers });
      }
      const approved = await oauth.approveConsent(c.req.raw, handle);
      const client = await oauth.lookupClient(approved.request.clientId);
      const clientName = friendlyClientName(client?.clientName);
      const props: McpProps = { userId: user.id, clientName };
      const { redirectTo } = await oauth.completeAuthorization({
        request: approved.request,
        userId: user.id,
        metadata: { clientName },
        scope: approved.request.scope,
        props,
        // Connecting the same app again replaces its old access instead of adding a second one.
        revokeExistingGrants: true,
      });
      approved.headers.set('Location', redirectTo);
      return new Response(null, { status: 302, headers: approved.headers });
    } catch (err) {
      return oauthError(err);
    }
  });

  /** "Not you?" on the consent page: sign out and show the same request again. */
  app.post('/authorize/switch', async (c) => {
    const form = await c.req.formData();
    const back = String(form.get('return') ?? '');
    await endSession(c);
    return c.redirect(back.startsWith('/authorize?') ? back : '/', 302);
  });
}

// ---------------------------------------------------------------------------------------------
// Connected AI apps (Activity panel) and Revoke access

async function allGrants(c: Context<AppEnv>, userId: string) {
  const grants = [];
  let cursor: string | undefined;
  do {
    const page = await c.env.OAUTH_PROVIDER.listUserGrants(userId, { cursor, limit: 100 });
    grants.push(...page.items);
    cursor = page.cursor;
  } while (cursor);
  return grants;
}

const toIso = (t: number) => new Date(t < 1e12 ? t * 1000 : t).toISOString();

/** One row per AI app (grants of the same app are grouped), with the time of its last change. */
export async function listConnectedApps(c: Context<AppEnv>, userId: string) {
  const grants = await allGrants(c, userId);
  const apps = new Map<string, { name: string; connectedAt: string }>();
  for (const g of grants) {
    const name = friendlyClientName(g.metadata?.clientName);
    const at = toIso(g.createdAt);
    const prev = apps.get(name);
    if (!prev || at < prev.connectedAt) apps.set(name, { name, connectedAt: at });
  }
  if (apps.size === 0) return [];
  const last = await c.env.DB.prepare(`SELECT client, MAX(created_at) AS at FROM activity WHERE user_id = ? AND actor = 'ai' GROUP BY client`)
    .bind(userId)
    .all<{ client: string; at: string }>();
  const lastBy = new Map(last.results.map((r) => [r.client, r.at]));
  return [...apps.values()].sort((a, b) => a.name.localeCompare(b.name)).map((a) => ({ ...a, lastChangeAt: lastBy.get(a.name) ?? null }));
}

/** Revoke access: every grant of this app ends now (its tokens stop working). Its past changes
 * stay in Activity and can still be undone. */
export async function revokeApp(c: Context<AppEnv>, userId: string, name: string): Promise<number> {
  const grants = (await allGrants(c, userId)).filter((g) => friendlyClientName(g.metadata?.clientName) === name);
  for (const g of grants) await c.env.OAUTH_PROVIDER.revokeGrant(g.id, userId);
  return grants.length;
}

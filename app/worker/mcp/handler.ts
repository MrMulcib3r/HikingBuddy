/**
 * /mcp (PRD v33, FR-26): the remote MCP server (Streamable HTTP). workers-oauth-provider has
 * already checked the access token when a request gets here; ctx.props says whose data it is and
 * which AI client asks. Stateless: one MCP server per request (Cloudflare Agents SDK
 * `createMcpHandler`), all data in D1 — no Durable Objects needed.
 */
import { createMcpHandler } from 'agents/mcp/server';
import { rateLimit } from '../rateLimit';
import type { Env, McpProps } from '../env';
import { createServer } from './tools';

export const mcpApiHandler = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext & { props?: McpProps }): Promise<Response> {
    const props = ctx.props;
    if (!props?.userId) return new Response('Unauthorized', { status: 401 });
    // FR-24: 60 requests a minute per user, counted apart from the web app.
    if (!(await rateLimit(env, `mcp:${props.userId}`))) {
      return Response.json(
        { jsonrpc: '2.0', id: null, error: { code: -32000, message: 'Too many requests to HikingBuddy. Wait a minute and try again.' } },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
    const handler = createMcpHandler(() => createServer(env, props), { route: '/mcp', authContext: { props: { ...props } } });
    return handler(request, env, ctx);
  },
};

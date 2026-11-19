const ALLOWED_HOSTS = new Set([
  "danbooru.donmai.us",
  "cdn.donmai.us",
  "safebooru.donmai.us",
]);

export async function onRequest(context) {
  const { request } = context;
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  const reqUrl = new URL(request.url);
  const targetStr = reqUrl.searchParams.get("url");

  if (!targetStr) {
    return new Response("Danbooru Proxy is running. Use ?url=...", {
      status: 200,
      headers: corsHeaders,
    });
  }

  let targetUrl;
  try {
    targetUrl = new URL(targetStr);
  } catch {
    return new Response("Invalid target URL", { status: 400, headers: corsHeaders });
  }

  if (!ALLOWED_HOSTS.has(targetUrl.hostname)) {
    return new Response("Host not allowed", { status: 403, headers: corsHeaders });
  }

  try {
    const upstream = await fetch(targetUrl.toString(), {
      headers: {
        "User-Agent": "DanbooruArtistLibrary/1.0",
        "Accept": request.headers.get("Accept") || "*/*",
      },
    });

    const resHeaders = new Headers(corsHeaders);
    const contentType = upstream.headers.get("Content-Type");
    if (contentType) {
      resHeaders.set("Content-Type", contentType);
    }
    resHeaders.set("Cache-Control", "public, max-age=300");

    return new Response(upstream.body, {
      status: upstream.status,
      headers: resHeaders,
    });
  } catch (err) {
    return new Response("Upstream error: " + err.message, {
      status: 502,
      headers: corsHeaders,
    });
  }
}

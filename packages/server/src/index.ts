import { renderHomePage, renderNotFound } from "@vets-dev/web";

const PORT = parseInt(process.env.PORT || "3000", 10);
const HOST = process.env.HOST || "localhost";

console.log(`🚀 vets.dev server starting...`);
console.log(`📍 http://${HOST}:${PORT}`);
console.log(`🏥 Health check: http://${HOST}:${PORT}/health`);

const server = Bun.serve({
  port: PORT,
  hostname: HOST,
  fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Health check endpoint
    if (path === "/health") {
      return Response.json({
        status: "ok",
        timestamp: new Date().toISOString(),
      });
    }

    // Home page
    if (path === "/") {
      return new Response(renderHomePage(), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // 404 for everything else
    return new Response(renderNotFound(), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  },
});

console.log(`✅ Server running at http://${server.hostname}:${server.port}`);

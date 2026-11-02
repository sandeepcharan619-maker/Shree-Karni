import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// In-memory set of SSE streams that active admin tabs are listening on
export const adminSseClients = new Set<ReadableStreamDefaultController<Uint8Array>>();

function isAdmin(session: any): boolean {
  if (!session?.user) return false;
  const role = (session.user.role || "").toUpperCase();
  const username = (session.user.username || "").toLowerCase();
  const memberId = (session.user.memberId || "").toUpperCase();
  return role === "ADMIN" || username === "admin" || memberId === "SKRADMIN";
}

/**
 * GET /api/admin/events
 * Server-Sent Events stream. Each open admin browser tab connects to this
 * and receives push notifications when a new associate signs up.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let controller: ReadableStreamDefaultController<Uint8Array>;

  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      controller = ctrl;
      // Register this client
      adminSseClients.add(controller);

      // Send an initial ping so the browser knows the connection is alive
      const ping = `event: ping\ndata: connected\n\n`;
      controller.enqueue(new TextEncoder().encode(ping));
    },
    cancel() {
      // Remove client when browser disconnects
      if (controller) adminSseClients.delete(controller);
    },
  });

  // Keep-alive heartbeat every 25 seconds (Vercel / nginx timeout safety)
  const heartbeat = setInterval(() => {
    try {
      const heartbeatMsg = `: heartbeat\n\n`;
      controller.enqueue(new TextEncoder().encode(heartbeatMsg));
    } catch {
      clearInterval(heartbeat);
      adminSseClients.delete(controller);
    }
  }, 25000);

  req.signal.addEventListener("abort", () => {
    clearInterval(heartbeat);
    if (controller) {
      adminSseClients.delete(controller);
      try { controller.close(); } catch {}
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

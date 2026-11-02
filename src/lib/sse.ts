import { adminSseClients } from "@/app/api/admin/events/route";

/**
 * Broadcasts an SSE message to ALL currently connected admin browser tabs.
 * Call this after any new associate is created.
 */
export function broadcastAdminEvent(eventName: string, data: object): void {
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  const encoded = new TextEncoder().encode(payload);

  const toRemove: ReadableStreamDefaultController<Uint8Array>[] = [];

  adminSseClients.forEach((controller) => {
    try {
      controller.enqueue(encoded);
    } catch {
      // Client disconnected; clean up
      toRemove.push(controller);
    }
  });

  toRemove.forEach((ctrl) => adminSseClients.delete(ctrl));
}

import { NextRequest } from "next/server";
import { realtimeEmitter, RealtimeEventPayload } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connect frame
      const initialMessage = `event: connected\ndata: ${JSON.stringify({ status: "connected", time: new Date().toISOString() })}\n\n`;
      controller.enqueue(encoder.encode(initialMessage));

      // Event listener
      const onEvent = (payload: RealtimeEventPayload) => {
        try {
          const sseData = `event: ${payload.type}\ndata: ${JSON.stringify(payload)}\n\n`;
          controller.enqueue(encoder.encode(sseData));
        } catch {
          // Stream might be closed
        }
      };

      realtimeEmitter.on("realtime-event", onEvent);

      // Keepalive heartbeat every 15s to keep connection alive
      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keepalive ${Date.now()}\n\n`));
        } catch {
          clearInterval(keepAliveInterval);
        }
      }, 15000);

      // Clean up on close
      req.signal.addEventListener("abort", () => {
        clearInterval(keepAliveInterval);
        realtimeEmitter.off("realtime-event", onEvent);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

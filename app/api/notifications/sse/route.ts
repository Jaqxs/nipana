import { NextRequest } from "next/server";
import { notificationEvents } from "@/backend/services/notification-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const responseStream = new ReadableStream({
    start(controller) {
      const onNotification = (notification: any) => {
        try {
          controller.enqueue(`data: ${JSON.stringify(notification)}\n\n`);
        } catch (e) {
          // stream might be closed
        }
      };

      notificationEvents.on("new-notification", onNotification);

      // 15-second heartbeat to prevent gateway timeouts
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(`: heartbeat\n\n`);
        } catch (e) {
          // stream might be closed
        }
      }, 15000);

      request.signal.addEventListener("abort", () => {
        notificationEvents.off("new-notification", onNotification);
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch (e) {
          // ignore already closed
        }
      });
    },
  });

  return new Response(responseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}

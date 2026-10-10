import { EventEmitter } from "events";

declare global {
  // eslint-disable-next-line no-var
  var globalEventEmitter: EventEmitter | undefined;
}

export const realtimeEmitter = global.globalEventEmitter || new EventEmitter();
realtimeEmitter.setMaxListeners(100);

if (process.env.NODE_ENV !== "production") {
  global.globalEventEmitter = realtimeEmitter;
}

export interface RealtimeEventPayload {
  type:
    | "website.check.completed"
    | "website.status.changed"
    | "incident.created"
    | "incident.resolved"
    | "worker.heartbeat";
  data: Record<string, unknown>;
  timestamp: string;
}

export function broadcastRealtimeEvent(type: RealtimeEventPayload["type"], data: Record<string, unknown>) {
  const payload: RealtimeEventPayload = {
    type,
    data,
    timestamp: new Date().toISOString(),
  };
  realtimeEmitter.emit("realtime-event", payload);
}

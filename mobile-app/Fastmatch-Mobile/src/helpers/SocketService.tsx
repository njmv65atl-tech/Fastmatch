

import { socket } from '../socket/socket.js'

type EventCallback = (data: any) => void;

class SocketServices {
  private callbacks: Map<string, EventCallback> = new Map();

  emit(event: string, data?: any) {
    if (!socket) {
      console.log("❌ Socket not initialized");
      return;
    }

    if (!socket.connected) {
      console.log("❌ Socket not connected");
      return;
    }

    console.log(`📤 Emit → ${event}`, data);
    socket.emit(event, data);
  }

  on(event: string, callback: EventCallback) {
    if (!socket) {
      console.log("❌ Socket not initialized");
      return;
    }

    this.callbacks.set(event, callback);
    socket.on(event, callback);
  }

  off(event: string) {
    if (!socket) return;
    const callback = this.callbacks.get(event);
    if (callback) {
      socket.off(event, callback);
      this.callbacks.delete(event);
    } else {
      socket.off(event);
    }
  }

  // SocketConnection.tsx handles connect/disconnect via its useEffect.
  // These are kept as no-ops so call sites that use them don't break.
  connect(_token: string) {
    console.log("ℹ️ connect() is a no-op — SocketConnection manages the connection.");
  }

  disconnect() {
    console.log("ℹ️ disconnect() is a no-op — SocketConnection manages the connection.");
  }

  isConnected(): boolean {
    return !!socket?.connected;
  }
}

export default new SocketServices();
import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "@/store/auth";
import type { ChatServerEvents, ChatSocketAuth, ChatSocketError } from "@/types/chat";
import type { Paginated } from "@/types/api";
import type { Message } from "@/types/models";
import api from "@/api/client";

type ConnectionState = {
  status: "connecting" | "connected" | "reconnecting" | "error";
  error: ChatSocketError | null;
};

// Subscribe to one private chat and refresh its latest page on server events.
export const useOrderChatSocket = (orderId: number, { enabled = true }: { enabled?: boolean } = {}) => {
  const token = useAuthStore((state) => state.token);
  const userId = useAuthStore((state) => state.user?.id);
  const client = useQueryClient();
  const [attempt, setAttempt] = useState(0);
  const [connection, setConnection] = useState<ConnectionState>({ status: "connecting", error: null });

  useEffect(() => {
    if (!enabled || !token || !userId || !Number.isSafeInteger(orderId) || orderId <= 0) return;
    let active = true;
    let terminalError = false;
    setConnection({ status: "connecting", error: null });
    // By default Socket.IO shares the API origin and uses /socket.io.
    const url = import.meta.env.VITE_SOCKET_URL || new URL(api.defaults.baseURL ?? "/api", window.location.origin).origin;
    const auth: ChatSocketAuth = { token, orderId };
    const socket: Socket<ChatServerEvents> = io(url, {
      auth,
      transports: ["websocket"],
      autoConnect: false,
      forceNew: true,
    });
    const queryKey = ["messages", "detail", orderId, userId];
    const latestKey = [...queryKey, 1];
    const isCurrentSession = () => active && useAuthStore.getState().token === token
      && useAuthStore.getState().user?.id === userId;

    const refreshLatest = () => {
      // History pages become stale without moving the reader's current page.
      void client.invalidateQueries({ queryKey, refetchType: "none" });
      void client.invalidateQueries({ queryKey: latestKey });
    };

    const handleReady = () => {
      if (!isCurrentSession()) return;
      setConnection({ status: "connected", error: null });
      // Joining happens before this event: fetch messages missed while offline.
      refreshLatest();
    };

    const handleMessage = (message: Message) => {
      if (!isCurrentSession() || message.orderId !== orderId) return;
      const latest = client.getQueryData<Paginated<Message>>(latestKey);
      if (latest?.items.some((item) => item.id === message.id)) return;
      // Do not skip own events: another tab may send while this tab is saving.
      refreshLatest();
    };

    const handleError = (error: ChatSocketError) => {
      if (!isCurrentSession()) return;
      terminalError = true;
      socket.disconnect();
      setConnection({ status: "error", error });
      if (error.status === 401 || (error.status === 403 && error.message === "Your account has been blocked")) {
        useAuthStore.getState().logout();
      }
    };

    const handleConnectError = (error: Error & { data?: ChatSocketError }) => {
      if (!isCurrentSession()) return;
      if (error.data) handleError(error.data);
      else setConnection({ status: "reconnecting", error: null });
    };

    const handleDisconnect = (reason: string) => {
      if (!isCurrentSession() || terminalError) return;
      if (reason === "io server disconnect") {
        setConnection({ status: "error", error: { status: 503, message: "Live chat disconnected. Use Refresh to reconnect." } });
      } else {
        setConnection({ status: "reconnecting", error: null });
      }
    };

    socket.on("chat:ready", handleReady);
    socket.on("message:new", handleMessage);
    socket.on("chat:error", handleError);
    socket.on("connect_error", handleConnectError);
    socket.on("disconnect", handleDisconnect);
    socket.connect();

    return () => {
      active = false;
      socket.off("chat:ready", handleReady);
      socket.off("message:new", handleMessage);
      socket.off("chat:error", handleError);
      socket.off("connect_error", handleConnectError);
      socket.off("disconnect", handleDisconnect);
      socket.disconnect();
    };
  }, [orderId, userId, token, enabled, client, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return {
    status: enabled && token && userId ? connection.status : "idle",
    error: enabled && token && userId ? connection.error : null,
    retry,
  };
};

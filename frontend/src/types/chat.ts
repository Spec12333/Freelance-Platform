import type { Message } from "./models";

// Socket.IO contract; REST remains responsible for history and sending.
export type ChatSocketAuth = {
  token: string;
  orderId: number;
};

export type ChatSocketError = {
  status: number;
  message: string;
};

export type ChatServerEvents = {
  "chat:ready": () => void;
  "message:new": (message: Message) => void;
  "chat:error": (error: ChatSocketError) => void;
};

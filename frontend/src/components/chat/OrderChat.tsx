import { useState } from "react";
import { isAxiosError } from "axios";
import { getErrorMessage } from "@/api/client";
import { useMessages, useSendMessage } from "@/hooks/useMessages";
import { useOrderChatSocket } from "@/hooks/useOrderChatSocket";
import { useAuthStore } from "@/store/auth";
import type { Order } from "@/types/models";
import MessageInput from "@/components/chat/MessageInput";
import MessageList from "@/components/chat/MessageList";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Spinner from "@/components/ui/Spinner";
import { ChatIcon, RefreshIcon } from "@/components/ui/icons";

type OrderChatProps = {
  order: Order;
};

// Access failures must hide cached messages and disable sending.
const isAccessError = (error: unknown) => isAxiosError(error)
  && [401, 403, 404, 409].includes(error.response?.status ?? 0);

// Own chat requests, pagination and sending; child components present the UI.
export default function OrderChat({ order }: OrderChatProps) {
  const currentUser = useAuthStore((state) => state.user);
  const [page, setPage] = useState(1);
  const sendMessage = useSendMessage(order.id);
  const isClient = currentUser?.role === "CLIENT" && currentUser.id === order.clientId;
  const isFreelancer = currentUser?.role === "FREELANCER" && currentUser.id === order.freelancerId;
  const canView = isClient || isFreelancer;
  const hasFreelancer = order.freelancerId !== null;
  const sendAccessError = isAccessError(sendMessage.error);
  const messages = useMessages(order.id, page, { enabled: canView && hasFreelancer && !sendAccessError });
  const messageAccessError = isAccessError(messages.error);
  const liveChat = useOrderChatSocket(order.id, {
    enabled: canView && hasFreelancer && !sendAccessError && !messageAccessError,
  });
  const liveAccessError = liveChat.error !== null && [400, 401, 403, 404, 409].includes(liveChat.error.status);
  const accessError = sendAccessError || messageAccessError || liveAccessError;
  const conversation = accessError ? undefined : messages.data;

  const handleSend = async (body: string) => {
    if (!canView || !hasFreelancer || !conversation || sendMessage.isPending) {
      throw new Error("Chat is not ready");
    }
    // The mutation refreshes the chat immediately after saving.
    await sendMessage.mutateAsync({ body });
    setPage(1);
  };

  const handleRetry = () => {
    sendMessage.reset();
    if (liveChat.status !== "connected") liveChat.retry();
    void messages.refetch();
  };

  if (!canView || !currentUser) return null;

  const otherName = isClient ? order.freelancer?.name : order.client.name;

  return (
    <section aria-labelledby={`order-chat-heading-${order.id}`} className="card min-w-0 overflow-hidden">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 p-5 sm:p-6">
        <div className="flex min-w-0 items-start gap-3">
          <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><ChatIcon className="size-5" /></span>
          <div className="min-w-0">
            <h2 id={`order-chat-heading-${order.id}`} className="text-xl font-bold tracking-tight text-gray-900">Project chat</h2>
            <p className="mt-1.5 text-sm text-gray-500 [overflow-wrap:anywhere]">{otherName ? `Your conversation with ${otherName}` : "Keep your project conversations in one place."}</p>
          </div>
        </div>
        {hasFreelancer && (
          <div className="flex flex-wrap items-center gap-2">
            {page > 1 && <button type="button" onClick={() => setPage(1)} disabled={sendMessage.isPending} className="btn btn-secondary btn-sm">Back to latest</button>}
            <button type="button" aria-label="Refresh messages" onClick={handleRetry} disabled={messages.isFetching || sendMessage.isPending} className="btn btn-ghost btn-sm text-gray-500">
              <RefreshIcon className={`size-4 ${messages.isFetching ? "animate-spin motion-reduce:animate-none" : ""}`} />
              Refresh
            </button>
          </div>
        )}
      </header>

      {!hasFreelancer ? (
        <div className="px-6 py-10 text-center">
          <p className="text-sm font-bold text-gray-900">Your chat opens after you choose a freelancer</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-500">Once you accept a proposal, you can discuss the project here with your chosen freelancer.</p>
        </div>
      ) : (
        <>
          {/* Keep existing messages mounted during refreshes and temporary failures. */}
          {conversation ? (
            <>
              {messages.isError && (
                <div role="alert" className="border-b border-amber-100 bg-amber-50 px-5 py-3 text-sm leading-relaxed text-amber-800 sm:px-6">
                  Messages could not be refreshed. Showing your last loaded conversation. {getErrorMessage(messages.error)}
                </div>
              )}
              <MessageList key={page} messages={conversation.items} currentUserId={currentUser.id} page={page} />
            </>
          ) : messages.isPending && !accessError ? (
            <div className="flex h-[26rem] items-center justify-center p-6"><Spinner label="Loading messages…" /></div>
          ) : (
            <div className="p-5 sm:p-6"><ErrorMessage title="We couldn't load this conversation" message={liveAccessError ? liveChat.error?.message ?? "Conversation unavailable." : getErrorMessage(sendAccessError ? sendMessage.error : messages.error)} onRetry={handleRetry} /></div>
          )}

          {conversation && conversation.pages > 1 && (
            <nav aria-label="Message history" className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 sm:px-6">
              <button type="button" onClick={() => setPage((current) => current + 1)} disabled={page >= conversation.pages || messages.isFetching || sendMessage.isPending} className="btn btn-secondary btn-sm">← Older</button>
              <span className="text-xs text-gray-400">Page {page} of {conversation.pages}</span>
              <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1 || messages.isFetching || sendMessage.isPending} className="btn btn-secondary btn-sm">Newer →</button>
            </nav>
          )}
          <div className="space-y-1 border-t border-gray-100 bg-gray-50/60 px-5 py-3 sm:px-6">
            <p role="status" className={`flex items-center gap-2 text-xs ${liveChat.status === "connected" ? "text-brand-700" : liveChat.status === "reconnecting" || liveChat.status === "error" ? "text-amber-700" : "text-gray-500"}`}>
              <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />
              {accessError ? "Conversation unavailable. Use Refresh to check access again."
                : liveChat.status === "connected" ? "Live updates connected"
                : liveChat.status === "error" ? liveChat.error?.message
                : liveChat.status === "reconnecting" ? "Live updates disconnected. Reconnecting…"
                : "Connecting to live updates…"}
            </p>
            {page > 1 && <p className="text-xs text-gray-500">Viewing history. Return to latest to see new messages.</p>}
          </div>
          <MessageInput
            orderId={order.id}
            onSend={handleSend}
            isSending={sendMessage.isPending}
            disabled={!conversation}
            error={sendMessage.isError && !sendAccessError ? getErrorMessage(sendMessage.error) : undefined}
          />
        </>
      )}
    </section>
  );
}

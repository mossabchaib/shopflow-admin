import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useStore";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessageSquare, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Conversation {
  id: string;
  admin_id: string;
  seller_id: string;
  created_at: string;
  other_name: string;
  other_email: string;
  last_message?: string;
  unread_count?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface AvailableUser {
  user_id: string;
  name: string;
  email: string;
}

export default function Chat() {
  const { user } = useAuth();
  const { role } = useUserRole();
  const { t } = useI18n();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  useEffect(() => {
    if (!user) return;
    fetchConversations();
  }, [user]);

  async function fetchConversations() {
    if (!user) return;
    const { data: convs } = await supabase
      .from("chat_conversations")
      .select("*")
      .order("updated_at", { ascending: false });

    if (!convs) { setLoading(false); return; }

    // Get other user profiles
    const otherIds = convs.map((c: any) =>
      c.admin_id === user.id ? c.seller_id : c.admin_id
    );
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, email")
      .in("user_id", otherIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    // Get last messages and unread counts
    const enriched: Conversation[] = await Promise.all(
      convs.map(async (c: any) => {
        const otherId = c.admin_id === user.id ? c.seller_id : c.admin_id;
        const profile = profileMap.get(otherId);

        const { data: lastMsg } = await supabase
          .from("chat_messages")
          .select("content")
          .eq("conversation_id", c.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { count } = await supabase
          .from("chat_messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", c.id)
          .eq("is_read", false)
          .neq("sender_id", user.id);

        return {
          ...c,
          other_name: profile?.name || profile?.email || "Unknown",
          other_email: profile?.email || "",
          last_message: lastMsg?.content,
          unread_count: count || 0,
        };
      })
    );

    setConversations(enriched);
    setLoading(false);
  }

  // Fetch messages for active conversation
  useEffect(() => {
    if (!activeConv) return;
    fetchMessages(activeConv.id);

    // Mark as read
    if (user) {
      supabase
        .from("chat_messages")
        .update({ is_read: true })
        .eq("conversation_id", activeConv.id)
        .neq("sender_id", user.id)
        .eq("is_read", false)
        .then(() => {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === activeConv.id ? { ...c, unread_count: 0 } : c
            )
          );
        });
    }
  }, [activeConv?.id]);

  async function fetchMessages(convId: string) {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    setMessages(data || []);
  }

  // Realtime subscription
  useEffect(() => {
    if (!activeConv) return;

    const channel = supabase
      .channel(`chat-${activeConv.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${activeConv.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
          // Mark as read if from other user
          if (user && newMsg.sender_id !== user.id) {
            supabase
              .from("chat_messages")
              .update({ is_read: true })
              .eq("id", newMsg.id);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeConv?.id, user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!newMessage.trim() || !activeConv || !user) return;
    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      conversation_id: activeConv.id,
      sender_id: user.id,
      content: newMessage.trim(),
    });
    if (error) toast.error("Failed to send message");
    else {
      setNewMessage("");
      // Update conversation timestamp
      await supabase
        .from("chat_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", activeConv.id);
    }
    setSending(false);
  }

  // Start new conversation
  async function fetchAvailableUsers() {
    if (!user) return;
    // Admin sees sellers, sellers see admins
    const targetRole = role === "admin" ? "seller" : "admin";
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", targetRole);

    if (!roleData) return;

    const userIds = roleData.map((r: any) => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, email")
      .in("user_id", userIds);

    // Filter out existing conversations
    const existingIds = new Set(
      conversations.map((c) =>
        c.admin_id === user.id ? c.seller_id : c.admin_id
      )
    );

    setAvailableUsers(
      (profiles || []).filter((p: any) => !existingIds.has(p.user_id))
    );
  }

  async function startConversation(otherUserId: string) {
    if (!user) return;
    const adminId = role === "admin" ? user.id : otherUserId;
    const sellerId = role === "admin" ? otherUserId : user.id;

    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({ admin_id: adminId, seller_id: sellerId })
      .select()
      .single();

    if (error) { toast.error("Failed to create conversation"); return; }

    setNewChatOpen(false);
    await fetchConversations();
    // Select the new conversation
    const enriched = conversations.find((c) => c.id === data.id);
    if (enriched) setActiveConv(enriched);
    else {
      // Re-fetch and select
      const { data: convs } = await supabase
        .from("chat_conversations")
        .select("*")
        .eq("id", data.id)
        .single();
      if (convs) {
        const otherId = convs.admin_id === user.id ? convs.seller_id : convs.admin_id;
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_id, name, email")
          .eq("user_id", otherId)
          .maybeSingle();
        setActiveConv({
          ...convs,
          other_name: profile?.name || profile?.email || "Unknown",
          other_email: profile?.email || "",
        });
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] rounded-xl border border-border bg-card overflow-hidden">
      {/* Sidebar - Conversation List */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">{t("chat.title")}</h2>
          <Dialog open={newChatOpen} onOpenChange={(open) => {
            setNewChatOpen(open);
            if (open) fetchAvailableUsers();
          }}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("chat.startChat")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {role === "admin" ? "No sellers available" : "No admins available"}
                  </p>
                ) : (
                  availableUsers.map((u) => (
                    <button
                      key={u.user_id}
                      onClick={() => startConversation(u.user_id)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {(u.name || u.email)?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">{u.name || "No name"}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <ScrollArea className="flex-1">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mb-2" />
              <p className="text-sm">{t("chat.noConversations")}</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConv(conv)}
                className={`w-full flex items-center gap-3 p-4 border-b border-border hover:bg-accent/50 transition-colors text-left ${
                  activeConv?.id === conv.id ? "bg-accent" : ""
                }`}
              >
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {conv.other_name[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground truncate">
                      {conv.other_name}
                    </p>
                    {(conv.unread_count ?? 0) > 0 && (
                      <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  {conv.last_message && (
                    <p className="text-xs text-muted-foreground truncate">
                      {conv.last_message}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConv ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {activeConv.other_name[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{activeConv.other_name}</p>
                <p className="text-xs text-muted-foreground">{activeConv.other_email}</p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.map((msg) => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          isMe
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted text-foreground rounded-bl-sm"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p
                          className={`text-[10px] mt-1 ${
                            isMe ? "text-primary-foreground/60" : "text-muted-foreground"
                          }`}
                        >
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t("chat.typeMessage")}
                  className="flex-1"
                  disabled={sending}
                />
                <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-3" />
            <p className="text-sm">{t("chat.selectConversation")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

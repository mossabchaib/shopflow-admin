import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useStore";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Send,
  MessageSquare,
  Plus,
  Loader2,
  Paperclip,
  Mic,
  Square,
  FileText,
  Image as ImageIcon,
  File,
  Play,
  Pause,
  Download,
  X,
  Check,
  CheckCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

interface Conversation {
  id: string;
  admin_id: string;
  seller_id: string;
  created_at: string;
  other_name: string;
  other_email: string;
  last_message?: string;
  last_message_type?: string;
  unread_count?: number;
  updated_at?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  duration: number | null;
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

  // File upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Preview state (image/file before sending)
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Voice preview (after recording, before sending)
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voicePreviewUrl, setVoicePreviewUrl] = useState<string | null>(null);
  const [voiceDuration, setVoiceDuration] = useState(0);

  // Audio playback
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    const otherIds = convs.map((c: any) =>
      c.admin_id === user.id ? c.seller_id : c.admin_id
    );
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, email")
      .in("user_id", otherIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    const enriched: Conversation[] = await Promise.all(
      convs.map(async (c: any) => {
        const otherId = c.admin_id === user.id ? c.seller_id : c.admin_id;
        const profile = profileMap.get(otherId);

        const { data: lastMsg } = await supabase
          .from("chat_messages")
          .select("content, message_type")
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
          last_message_type: lastMsg?.message_type,
          unread_count: count || 0,
        };
      })
    );

    setConversations(enriched);
    setLoading(false);
  }

  useEffect(() => {
    if (!activeConv) return;
    fetchMessages(activeConv.id);
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

  // Realtime
  useEffect(() => {
    if (!activeConv) return;
    const channel = supabase
      .channel(`chat-${activeConv.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `conversation_id=eq.${activeConv.id}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages((prev) => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        if (user && newMsg.sender_id !== user.id) {
          supabase.from("chat_messages").update({ is_read: true }).eq("id", newMsg.id);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConv?.id, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send text message
  async function sendMessage() {
    if (!newMessage.trim() || !activeConv || !user) return;
    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      conversation_id: activeConv.id,
      sender_id: user.id,
      content: newMessage.trim(),
      message_type: "text",
    });
    if (error) toast.error("Failed to send");
    else {
      setNewMessage("");
      await supabase.from("chat_conversations").update({ updated_at: new Date().toISOString() }).eq("id", activeConv.id);
      fetchConversations();
    }
    setSending(false);
  }

  // File upload
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeConv || !user) return;
    if (file.size > 20 * 1024 * 1024) { toast.error("File too large (max 20MB)"); return; }

  // File selected → show preview
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast.error("File too large (max 20MB)"); return; }
    setPreviewFile(file);
    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function cancelPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewFile(null);
    setPreviewUrl(null);
  }

  async function sendFileFromPreview() {
    if (!previewFile || !activeConv || !user) return;
    setUploadingFile(true);
    const ext = previewFile.name.split(".").pop();
    const path = `${activeConv.id}/${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage.from("chat-files").upload(path, previewFile);
    if (upErr) { toast.error("Upload failed"); setUploadingFile(false); return; }

    const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(path);

    let msgType = "file";
    if (previewFile.type.startsWith("image/")) msgType = "image";

    const { error } = await supabase.from("chat_messages").insert({
      conversation_id: activeConv.id,
      sender_id: user.id,
      content: previewFile.name,
      message_type: msgType,
      file_url: urlData.publicUrl,
      file_name: previewFile.name,
      file_type: previewFile.type,
    });

    if (error) toast.error("Failed to send file");
    else {
      await supabase.from("chat_conversations").update({ updated_at: new Date().toISOString() }).eq("id", activeConv.id);
      fetchConversations();
    }
    cancelPreview();
    setUploadingFile(false);
  }

  // Voice recording
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        // Show preview instead of sending
        setVoiceBlob(blob);
        setVoicePreviewUrl(URL.createObjectURL(blob));
        setVoiceDuration(recordingDuration);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } catch {
      toast.error("Microphone access denied");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }

  function cancelVoicePreview() {
    if (voicePreviewUrl) URL.revokeObjectURL(voicePreviewUrl);
    setVoiceBlob(null);
    setVoicePreviewUrl(null);
    setVoiceDuration(0);
  }

  async function sendVoiceFromPreview() {
    if (!voiceBlob || !activeConv || !user) return;
    setSending(true);
    const path = `${activeConv.id}/voice_${Date.now()}.webm`;

    const { error: upErr } = await supabase.storage.from("chat-files").upload(path, voiceBlob);
    if (upErr) { toast.error("Upload failed"); setSending(false); return; }

    const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(path);

    const { error } = await supabase.from("chat_messages").insert({
      conversation_id: activeConv.id,
      sender_id: user.id,
      content: "Voice message",
      message_type: "voice",
      file_url: urlData.publicUrl,
      file_name: "voice.webm",
      file_type: "audio/webm",
      duration: voiceDuration,
    });

    if (error) toast.error("Failed to send voice");
    else {
      await supabase.from("chat_conversations").update({ updated_at: new Date().toISOString() }).eq("id", activeConv.id);
      fetchConversations();
    }
    cancelVoicePreview();
    setSending(false);
  }

  // Audio playback
  function togglePlay(msgId: string, url: string) {
    if (playingId === msgId) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(url);
      audio.onended = () => setPlayingId(null);
      audio.play();
      audioRef.current = audio;
      setPlayingId(msgId);
    }
  }

  // New conversation
  async function fetchAvailableUsers() {
    if (!user) return;
    const targetRole = role === "admin" ? "seller" : "admin";
    const { data: roleData } = await supabase.from("user_roles").select("user_id").eq("role", targetRole);
    if (!roleData) return;
    const userIds = roleData.map((r: any) => r.user_id);
    const { data: profiles } = await supabase.from("profiles").select("user_id, name, email").in("user_id", userIds);
    const existingIds = new Set(conversations.map((c) => c.admin_id === user.id ? c.seller_id : c.admin_id));
    setAvailableUsers((profiles || []).filter((p: any) => !existingIds.has(p.user_id)));
  }

  async function startConversation(otherUserId: string) {
    if (!user) return;
    const adminId = role === "admin" ? user.id : otherUserId;
    const sellerId = role === "admin" ? otherUserId : user.id;
    const { data, error } = await supabase.from("chat_conversations").insert({ admin_id: adminId, seller_id: sellerId }).select().single();
    if (error) { toast.error("Failed"); return; }
    setNewChatOpen(false);
    await fetchConversations();
    const otherId = data.admin_id === user.id ? data.seller_id : data.admin_id;
    const { data: profile } = await supabase.from("profiles").select("user_id, name, email").eq("user_id", otherId).maybeSingle();
    setActiveConv({ ...data, other_name: profile?.name || profile?.email || "Unknown", other_email: profile?.email || "" });
  }

  function formatDuration(secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function getLastMessagePreview(conv: Conversation) {
    if (!conv.last_message) return "";
    if (conv.last_message_type === "voice") return "🎤 Voice message";
    if (conv.last_message_type === "image") return "📷 Image";
    if (conv.last_message_type === "file") return "📎 " + conv.last_message;
    return conv.last_message;
  }

  function getFileIcon(fileType: string | null) {
    if (!fileType) return <File className="h-5 w-5" />;
    if (fileType.startsWith("image/")) return <ImageIcon className="h-5 w-5" />;
    if (fileType.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />;
    return <File className="h-5 w-5" />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] rounded-2xl border border-border/50 bg-card shadow-xl overflow-hidden">
      {/* ── Sidebar ── */}
      <div className="w-[340px] border-r border-border/50 flex flex-col bg-muted/20">
        <div className="p-5 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <h2 className="font-bold text-foreground text-lg">{t("chat.title")}</h2>
          </div>
          <Dialog open={newChatOpen} onOpenChange={(open) => { setNewChatOpen(open); if (open) fetchAvailableUsers(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-full h-8 w-8 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t("chat.startChat")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {availableUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No users available</p>
                ) : (
                  availableUsers.map((u) => (
                    <button key={u.user_id} onClick={() => startConversation(u.user_id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-all text-left group">
                      <Avatar className="h-10 w-10 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold">
                          {(u.name || u.email)?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{u.name || "No name"}</p>
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
            <div className="flex flex-col items-center justify-center h-60 text-muted-foreground">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-3">
                <MessageSquare className="h-7 w-7" />
              </div>
              <p className="text-sm font-medium">{t("chat.noConversations")}</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {conversations.map((conv) => (
                <motion.button
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                    activeConv?.id === conv.id
                      ? "bg-primary/10 shadow-sm"
                      : "hover:bg-muted/60"
                  }`}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className={`font-semibold text-sm ${
                        activeConv?.id === conv.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-gradient-to-br from-primary/20 to-primary/5 text-primary"
                      }`}>
                        {conv.other_name[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    {(conv.unread_count ?? 0) > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1 shadow-lg">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{conv.other_name}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {getLastMessagePreview(conv)}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* ── Main Chat ── */}
      <div className="flex-1 flex flex-col bg-background">
        {activeConv ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-border/50 flex items-center gap-3 bg-card/80 backdrop-blur-sm">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold">
                  {activeConv.other_name[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-foreground">{activeConv.other_name}</p>
                <p className="text-xs text-muted-foreground">{activeConv.other_email}</p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-6 py-4">
              <div className="space-y-4 max-w-3xl mx-auto">
                {messages.map((msg) => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                        <div className={`rounded-2xl overflow-hidden ${
                          isMe
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted text-foreground rounded-bl-md"
                        }`}>
                          {/* Text */}
                          {msg.message_type === "text" && (
                            <p className="px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          )}

                          {/* Image */}
                          {msg.message_type === "image" && msg.file_url && (
                            <div>
                              <img
                                src={msg.file_url}
                                alt={msg.file_name || "image"}
                                className="max-w-sm max-h-72 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(msg.file_url!, "_blank")}
                              />
                              {msg.content && msg.content !== msg.file_name && (
                                <p className="px-4 py-2 text-sm">{msg.content}</p>
                              )}
                            </div>
                          )}

                          {/* Voice */}
                          {msg.message_type === "voice" && msg.file_url && (
                            <div className="px-4 py-3 flex items-center gap-3 min-w-[200px]">
                              <button
                                onClick={() => togglePlay(msg.id, msg.file_url!)}
                                className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                                  isMe
                                    ? "bg-primary-foreground/20 hover:bg-primary-foreground/30"
                                    : "bg-foreground/10 hover:bg-foreground/20"
                                }`}
                              >
                                {playingId === msg.id
                                  ? <Pause className="h-4 w-4" />
                                  : <Play className="h-4 w-4 ml-0.5" />
                                }
                              </button>
                              <div className="flex-1">
                                <div className="flex gap-[2px] items-end h-6">
                                  {Array.from({ length: 24 }).map((_, i) => (
                                    <div
                                      key={i}
                                      className={`w-1 rounded-full ${
                                        isMe ? "bg-primary-foreground/40" : "bg-foreground/20"
                                      }`}
                                      style={{ height: `${Math.random() * 16 + 6}px` }}
                                    />
                                  ))}
                                </div>
                                <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                                  {msg.duration ? formatDuration(msg.duration) : "0:00"}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* File */}
                          {msg.message_type === "file" && msg.file_url && (
                            <a
                              href={msg.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`px-4 py-3 flex items-center gap-3 hover:opacity-80 transition-opacity ${
                                isMe ? "text-primary-foreground" : "text-foreground"
                              }`}
                            >
                              <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isMe ? "bg-primary-foreground/20" : "bg-foreground/10"
                              }`}>
                                {getFileIcon(msg.file_type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{msg.file_name}</p>
                                <p className={`text-[10px] ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                                  {msg.file_type?.split("/")[1]?.toUpperCase() || "FILE"}
                                </p>
                              </div>
                              <Download className="h-4 w-4 flex-shrink-0 opacity-60" />
                            </a>
                          )}
                        </div>

                        {/* Timestamp & read status */}
                        <div className={`flex items-center gap-1 mt-1 px-1 ${isMe ? "flex-row-reverse" : ""}`}>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {isMe && (
                            msg.is_read
                              ? <CheckCheck className="h-3 w-3 text-primary" />
                              : <Check className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="px-6 py-4 border-t border-border/50 bg-card/80 backdrop-blur-sm">
              <AnimatePresence>
                {isRecording && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-3 flex items-center gap-3 bg-destructive/10 rounded-xl px-4 py-3"
                  >
                    <div className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
                    <span className="text-sm font-medium text-destructive">
                      Recording... {formatDuration(recordingDuration)}
                    </span>
                    <div className="flex-1" />
                    <Button size="sm" variant="destructive" onClick={stopRecording} className="rounded-full h-8 w-8 p-0">
                      <Square className="h-3 w-3" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="rounded-full h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-muted"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile || isRecording}
                >
                  {uploadingFile ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
                </Button>

                <form
                  onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                  className="flex-1 flex items-center gap-2 bg-muted/60 rounded-full px-4 py-1 border border-border/50 focus-within:border-primary/30 focus-within:ring-1 focus-within:ring-primary/20 transition-all"
                >
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t("chat.typeMessage")}
                    className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-10"
                    disabled={sending || isRecording}
                  />
                </form>

                {newMessage.trim() ? (
                  <Button
                    onClick={sendMessage}
                    size="icon"
                    className="rounded-full h-10 w-10 shadow-lg"
                    disabled={sending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="icon"
                    variant={isRecording ? "destructive" : "default"}
                    className="rounded-full h-10 w-10 shadow-lg"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={uploadingFile}
                  >
                    {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <div className="h-20 w-20 rounded-full bg-muted/60 flex items-center justify-center mb-4">
              <MessageSquare className="h-9 w-9" />
            </div>
            <p className="text-base font-medium">{t("chat.selectConversation")}</p>
            <p className="text-xs mt-1">{role === "admin" ? "Start a conversation with a seller" : "Start a conversation with admin"}</p>
          </div>
        )}
      </div>
    </div>
  );
}

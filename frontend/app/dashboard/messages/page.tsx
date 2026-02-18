"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Lock, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Conversation {
    id: string;
    displayTitle: string;
    displayCounterparty: string;
    lastMessage: string;
    lastMessageTime: string;
}

interface Message {
    id: string;
    senderId: string;
    body: string;
    blocked: boolean;
    createdAt: string;
    role: string;
}

export default function MessagesPage() {
    const { data: session } = useSession();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loadingConvs, setLoadingConvs] = useState(true);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch Conversations
    useEffect(() => {
        fetch("/api/chat/conversations")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setConversations(data);
            })
            .catch(err => console.error(err))
            .finally(() => setLoadingConvs(false));
    }, []);

    // Fetch Messages when conversation selected
    useEffect(() => {
        if (!selectedConvId) return;
        setLoadingMsgs(true);
        fetch(`/api/chat/messages/${selectedConvId}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setMessages(data);
                    scrollToBottom();
                }
            })
            .catch(err => toast.error("Mesajlar yüklenemedi"))
            .finally(() => setLoadingMsgs(false));
    }, [selectedConvId]);

    const scrollToBottom = () => {
        setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConvId) return;

        setSending(true);
        try {
            const res = await fetch("/api/chat/message", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    conversationId: selectedConvId,
                    body: newMessage
                })
            });

            const data = await res.json();

            if (res.ok) {
                setMessages(prev => [...prev, {
                    ...data,
                    createdAt: new Date().toISOString() // Optimistic update usually, but using API result
                }]);
                setNewMessage("");
                scrollToBottom();
                // Update conversation list last message preview
                setConversations(prev => prev.map(c =>
                    c.id === selectedConvId
                        ? { ...c, lastMessage: data.body, lastMessageTime: new Date().toISOString() }
                        : c
                ));
            } else {
                if (data.blocked) {
                    toast.error("Mesajınız moderasyon takıldı: Uygunsuz içerik.");
                    setMessages(prev => [...prev, {
                        id: "temp-" + Date.now(),
                        senderId: session?.user?.id || "",
                        body: "Mesajınız moderasyon nedeniyle engellendi.",
                        blocked: true,
                        createdAt: new Date().toISOString(),
                        role: session?.user?.role || "USER"
                    }]);
                    scrollToBottom();
                } else {
                    toast.error(data.error || "Mesaj gönderilemedi");
                }
            }
        } catch (error) {
            toast.error("Bir hata oluştu");
        } finally {
            setSending(false);
        }
    };

    if (loadingConvs) return <DashboardLayout><div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="container mx-auto py-6 px-4 h-[calc(100vh-100px)]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full max-h-[700px] bg-white rounded-xl border shadow-sm overflow-hidden">

                    {/* Sidebar */}
                    <div className="border-r flex flex-col bg-gray-50/50">
                        <div className="p-4 border-b bg-white">
                            <h2 className="font-bold text-lg">Mesajlar</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {conversations.length === 0 ? (
                                <div className="p-6 text-center text-gray-400 text-sm">
                                    Henüz bir sohbetiniz yok.
                                </div>
                            ) : (
                                conversations.map(conv => (
                                    <button
                                        key={conv.id}
                                        onClick={() => setSelectedConvId(conv.id)}
                                        className={cn(
                                            "w-full text-left p-4 border-b hover:bg-white transition-colors focus:outline-none",
                                            selectedConvId === conv.id ? "bg-blue-50 border-l-4 border-l-blue-600" : "border-l-4 border-l-transparent"
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-semibold text-gray-900 truncate w-3/4">
                                                {conv.displayCounterparty}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(conv.lastMessageTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <div className="text-xs text-blue-600 font-medium mb-1 truncate">
                                            {conv.displayTitle}
                                        </div>
                                        <div className="text-sm text-gray-500 truncate">
                                            {conv.lastMessage}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="md:col-span-2 flex flex-col h-full bg-white">
                        {selectedConvId ? (
                            <>
                                {/* Header */}
                                <div className="p-4 border-b flex justify-between items-center bg-gray-50/30">
                                    <div>
                                        <h3 className="font-bold text-gray-800">
                                            {conversations.find(c => c.id === selectedConvId)?.displayCounterparty}
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            {conversations.find(c => c.id === selectedConvId)?.displayTitle}
                                        </p>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
                                    {loadingMsgs ? (
                                        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-400" /></div>
                                    ) : (
                                        messages.map((msg) => {
                                            const isMe = msg.senderId === session?.user?.id;
                                            return (
                                                <div key={msg.id} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                                                    <div className={cn(
                                                        "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                                                        isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-white border text-gray-800 rounded-bl-none",
                                                        msg.blocked && "bg-red-50 border-red-200 text-red-600 italic"
                                                    )}>
                                                        {msg.blocked && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                                                        {msg.body}
                                                        <div className={cn("text-[10px] mt-1 text-right opacity-70", isMe ? "text-blue-100" : "text-gray-400")}>
                                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={scrollRef} />
                                </div>

                                {/* Input */}
                                <div className="p-4 border-t bg-white">
                                    {session?.user?.role === 'BANNED' ? (
                                        <div className="text-center text-red-500 p-2 bg-red-50 rounded">
                                            Hesabınız kısıtlandığı için mesaj gönderemezsiniz.
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSendMessage} className="flex gap-2">
                                            <Input
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                placeholder="Mesajınızı yazın..."
                                                className="flex-1"
                                                disabled={sending}
                                            />
                                            <Button type="submit" size="icon" disabled={sending || !newMessage.trim()} className="bg-blue-600 hover:bg-blue-700">
                                                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                            </Button>
                                        </form>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/10">
                                <div className="w-16 h-16 bg-blue-50 text-blue-200 rounded-full flex items-center justify-center mb-4">
                                    <Send className="w-8 h-8 ml-1" />
                                </div>
                                <p>Sohbet başlatmak için soldan bir konuşma seçin.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

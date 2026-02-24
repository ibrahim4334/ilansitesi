"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";

interface ChatWindowProps {
    threadId: string;
    currentUserRole: string;
}

interface Message {
    id: string;
    senderRole: string;
    message: string;
    createdAt: string;
}

export function ChatWindow({ threadId, currentUserRole }: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const initialLoadDone = useRef(false);

    const loadLatest = async () => {
        try {
            const res = await fetch(`/api/chat/messages?threadId=${threadId}&limit=30`);
            if (res.ok) {
                const data = await res.json();
                const newMsgs: Message[] = data.messages ? data.messages.reverse() : (Array.isArray(data) ? data : []);

                setMessages(prev => {
                    if (prev.length === 0) return newMsgs;
                    // Merge to avoid duplicating or overwriting loaded history
                    const existingIds = new Set(prev.map(m => m.id));
                    const strictlyNew = newMsgs.filter(m => !existingIds.has(m.id));
                    return [...prev, ...strictlyNew];
                });

                if (data.nextCursor && !initialLoadDone.current) {
                    setNextCursor(data.nextCursor);
                    initialLoadDone.current = true;
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = async () => {
        if (!nextCursor || loadingMore) return;
        setLoadingMore(true);
        try {
            const res = await fetch(`/api/chat/messages?threadId=${threadId}&limit=30&cursor=${nextCursor}`);
            if (res.ok) {
                const data = await res.json();
                if (data.messages && data.messages.length > 0) {
                    const olderMsgs = data.messages.reverse();
                    setMessages(prev => [...olderMsgs, ...prev]);
                    setNextCursor(data.nextCursor);
                } else {
                    setNextCursor(null);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingMore(false);
        }
    };

    const handleDelete = async (messageId: string) => {
        if (!confirm('Mesajı silmek istediğinize emin misiniz?')) return;
        try {
            const res = await fetch('/api/chat/messages', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messageId })
            });
            if (res.ok) {
                setMessages(prev => prev.filter(m => m.id !== messageId));
                toast.success('Mesaj silindi');
            } else {
                toast.error('Mesaj silinemedi');
            }
        } catch (e) {
            toast.error('Hata oluştu');
        }
    };

    useEffect(() => {
        initialLoadDone.current = false;
        loadLatest();
        const interval = setInterval(loadLatest, 3000);
        return () => clearInterval(interval);
    }, [threadId]);

    useEffect(() => {
        if (scrollRef.current && messages.length <= 30) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim()) return;

        try {
            const res = await fetch("/api/chat/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ threadId, message: newMessage })
            });

            if (res.ok) {
                setNewMessage("");
                loadLatest();
                setTimeout(() => {
                    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: "smooth" });
                }, 500);
            } else {
                toast.error("Mesaj gönderilemedi");
            }
        } catch (e) {
            toast.error("Hata oluştu");
        }
    };

    return (
        <div className="flex flex-col h-[600px] border rounded-xl bg-white shadow-sm overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                {nextCursor && (
                    <div className="flex justify-center pb-2">
                        <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
                            {loadingMore ? "Yükleniyor..." : "Daha Fazla Yükle"}
                        </Button>
                    </div>
                )}
                {loading ? (
                    <div className="text-center text-gray-500 mt-10">Yükleniyor...</div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-gray-400 mt-10">Henüz mesaj yok. Sohbeti başlatın.</div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.senderRole === currentUserRole;
                        const canDelete = isMe || currentUserRole === 'ADMIN';
                        return (
                            <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                                <div
                                    className={cn(
                                        "max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm group relative",
                                        isMe
                                            ? "bg-blue-600 text-white rounded-br-none"
                                            : "bg-white border text-gray-800 rounded-bl-none"
                                    )}
                                >
                                    <p className="whitespace-pre-wrap">{msg.message}</p>
                                    <div className="flex items-center justify-between gap-3 mt-1">
                                        <span className={cn("text-[10px] opacity-70", isMe ? "text-blue-100" : "text-gray-400")}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {canDelete && (
                                            <button
                                                onClick={() => handleDelete(msg.id)}
                                                className={cn("opacity-0 group-hover:opacity-100 transition-opacity",
                                                    isMe ? "text-blue-200 hover:text-white" : "text-red-400 hover:text-red-600")}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={scrollRef} />
            </div>
            <div className="p-4 bg-white border-t flex gap-2 items-end">
                <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Mesajınızı yazın..."
                    className="min-h-[50px] max-h-[150px] resize-none focus-visible:ring-blue-500"
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                />
                <Button onClick={handleSend} className="h-[50px] px-6" disabled={!newMessage.trim()}>
                    Gönder
                </Button>
            </div>
        </div>
    );
}

"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

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
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/chat/messages?threadId=${threadId}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [threadId]);

    useEffect(() => {
        if (scrollRef.current) {
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
                fetchMessages();
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
                {loading ? (
                    <div className="text-center text-gray-500 mt-10">Yükleniyor...</div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-gray-400 mt-10">Henüz mesaj yok. Sohbeti başlatın.</div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.senderRole === currentUserRole;
                        return (
                            <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                                <div
                                    className={cn(
                                        "max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm",
                                        isMe
                                            ? "bg-blue-600 text-white rounded-br-none"
                                            : "bg-white border text-gray-800 rounded-bl-none"
                                    )}
                                >
                                    <p className="whitespace-pre-wrap">{msg.message}</p>
                                    <span className={cn("text-[10px] block mt-1 opacity-70", isMe ? "text-blue-100" : "text-gray-400")}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
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

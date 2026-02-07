"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ChatWindow } from "@/components/chat/chat-window";
import { cn } from "@/lib/utils";

interface ChatThread {
    id: string;
    requestId: string;
    displayTitle: string;
    displayCounterparty: string;
    lastMessage: string;
    lastMessageTime: string;
}

export default function ChatsPage() {
    const { data: session } = useSession();
    const [threads, setThreads] = useState<ChatThread[]>([]);
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/chat/threads")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setThreads(data);
                    if (data.length > 0 && !selectedThreadId) {
                        // Optional: Auto-select first? Or wait for user. Let's wait.
                    }
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-8 text-center">Sohbetler yükleniyor...</div>;

    if (!session) return null;

    return (
        <div className="container mx-auto py-8 px-4 h-[calc(100vh-100px)]">
            <h1 className="text-2xl font-bold mb-6">Mesajlarım</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full max-h-[700px]">
                {/* Thread List */}
                <div className="bg-white border rounded-xl overflow-hidden flex flex-col shadow-sm">
                    <div className="p-4 border-b bg-gray-50 font-medium text-gray-700">
                        Sohbetler ({threads.length})
                    </div>
                    <div className="overflow-y-auto flex-1">
                        {threads.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                Henüz bir sohbetiniz yok.
                            </div>
                        ) : (
                            threads.map(thread => (
                                <button
                                    key={thread.id}
                                    onClick={() => setSelectedThreadId(thread.id)}
                                    className={cn(
                                        "w-full text-left p-4 border-b transition-colors hover:bg-gray-50 focus:outline-none",
                                        selectedThreadId === thread.id ? "bg-blue-50 border-l-4 border-l-blue-600" : "border-l-4 border-l-transparent"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-gray-900 truncate pr-2 w-2/3">
                                            {thread.displayCounterparty}
                                        </span>
                                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                            {new Date(thread.lastMessageTime).toLocaleDateString("tr-TR", { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="text-xs text-blue-800 font-medium mb-1 truncate">
                                        {thread.displayTitle}
                                    </div>
                                    <div className="text-sm text-gray-500 truncate">
                                        {thread.lastMessage || "Sohbet başladı."}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="md:col-span-2 h-full">
                    {selectedThreadId ? (
                        <ChatWindow
                            threadId={selectedThreadId}
                            currentUserRole={session.user.role}
                        />
                    ) : (
                        <div className="h-full border rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 p-8 text-center shadow-sm">
                            <div className="max-w-xs">
                                <p className="mb-2 text-lg font-medium text-gray-500">Bir sohbet seçin</p>
                                <p className="text-sm">Mesajlaşmak için soldaki listeden bir kişiye tıklayın.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

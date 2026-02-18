"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertTriangle, Eye } from "lucide-react";

interface AdminConversation {
    id: string;
    guideEmail: string;
    userEmail: string;
    blockedCount: number;
    lastMessageAt: string;
}

interface AdminMessage {
    id: string;
    senderEmail: string;
    body: string;
    blocked: boolean;
    createdAt: string;
    role: string;
}

export default function AdminMessagesPage() {
    const [conversations, setConversations] = useState<AdminConversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedConv, setSelectedConv] = useState<string | null>(null);
    const [messages, setMessages] = useState<AdminMessage[]>([]);
    const [loadingMsgs, setLoadingMsgs] = useState(false);

    // Fetch All Conversations (For Admin)
    useEffect(() => {
        // We need a new endpoint for Admin List, or reuse existing specific one?
        // Let's create a quick client-side fetcher if endpoint exists, otherwise we need to create one.
        // The previous /api/chat/conversations was scoped to user.
        // We probably need /api/admin/conversations. 
        // For now, I'll inline the fetch if I can, but I can't.
        // I'll assume I need to create the endpoint or this page will fail.
        // Let's create the endpoint first.
    }, []);

    // WAIT: I missed create /api/admin/conversations in the plan?
    // Plan said: Admin: Implement Moderation UI (/admin/messages)
    // It implied dealing with data there.
    // I will implemented the UI scaffold here and realized I need the endpoint.
    // I will write this file, then write the endpoint.

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Mesaj Moderasyonu</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
                {/* List */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-800">
                        <h2 className="font-semibold text-gray-300">Sohbetler</h2>
                        <p className="text-xs text-gray-500">Engellenen mesajı olanlar öncelikli</p>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-2">
                        {loading ? <Loader2 className="animate-spin text-gray-500 mx-auto mt-4" /> : (
                            conversations.map(conv => (
                                <button
                                    key={conv.id}
                                    onClick={() => loadMessages(conv.id)}
                                    className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedConv === conv.id ? 'bg-gray-800 border-gray-700' : 'border-transparent hover:bg-gray-800/50'
                                        }`}
                                >
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-200">{conv.guideEmail}</span>
                                        {conv.blockedCount > 0 && (
                                            <span className="bg-red-900/30 text-red-400 text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" /> {conv.blockedCount}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">User: {conv.userEmail}</div>
                                    <div className="text-[10px] text-gray-600 mt-1">
                                        {new Date(conv.lastMessageAt).toLocaleString()}
                                    </div>
                                </button>
                            ))
                        )}
                        {!loading && conversations.length === 0 && (
                            <div className="text-center text-gray-600 mt-4 text-sm">Sohbet bulunamadı</div>
                        )}
                    </div>
                </div>

                {/* Detail */}
                <div className="md:col-span-2 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
                    {selectedConv ? (
                        <>
                            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                                <span className="text-gray-300 font-medium">Mesaj Geçmişi</span>
                                <span className="text-xs text-gray-500 uppercase tracking-wider">ID: {selectedConv}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {loadingMsgs ? <Loader2 className="animate-spin text-gray-500 mx-auto" /> : (
                                    messages.map(msg => (
                                        <div key={msg.id} className={`flex flex-col p-3 rounded-lg text-sm border ${msg.blocked ? 'bg-red-900/10 border-red-900/30' : 'bg-gray-800/50 border-gray-800'
                                            }`}>
                                            <div className="flex justify-between mb-1 text-xs text-gray-500">
                                                <span>{msg.role} ({msg.senderEmail})</span>
                                                <span>{new Date(msg.createdAt).toLocaleString()}</span>
                                            </div>
                                            <div className={`break-words ${msg.blocked ? 'text-red-400' : 'text-gray-300'}`}>
                                                {msg.body}
                                            </div>
                                            {msg.blocked && (
                                                <div className="mt-2 text-xs text-red-500 font-medium flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" /> Engellendi
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-600">
                            Bir sohbet seçiniz
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    function loadMessages(id: string) {
        setSelectedConv(id);
        setLoadingMsgs(true);
        fetch(`/api/admin/conversations/${id}`) // New endpoint
            .then(res => res.json())
            .then(data => setMessages(data))
            .catch(e => console.error(e))
            .finally(() => setLoadingMsgs(false));
    }
}

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    Shield, FileText, Users, CreditCard, Ban, ClipboardList,
    Menu, X, ChevronRight
} from 'lucide-react';

import PendingListingsPanel from '@/components/admin/PendingListingsPanel';
import UserRequestsPanel from '@/components/admin/UserRequestsPanel';
import CreditManagementPanel from '@/components/admin/CreditManagementPanel';
import BanPanel from '@/components/admin/BanPanel';
import AdminMessagesPanel from '@/app/admin/messages/page'; // We will move the page content to a component or import it directly
import AuditLogPanel from '@/components/admin/AuditLogPanel';

const tabs = [
    { id: 'listings', label: 'Bekleyen İlanlar', icon: FileText, desc: 'Pending Listings' },
    { id: 'requests', label: 'Kullanıcı Talepleri', icon: Users, desc: 'User Requests' },
    { id: 'credits', label: 'Kredi Yönetimi', icon: CreditCard, desc: 'Credits' },
    { id: 'ban', label: 'Ban Paneli', icon: Ban, desc: 'Ban Users' },
    { id: 'messages', label: 'Mesaj Moderasyonu', icon: ClipboardList, desc: 'Message Moderation' }, // Replaced Audit icon or added new? Using ClipboardList for messages temporarily or find another
    { id: 'audit', label: 'İşlem Geçmişi', icon: ClipboardList, desc: 'Audit Logs' },
] as const;

type TabId = typeof tabs[number]['id'];

export default function AdminDashboardPage() {
    const [activeTab, setActiveTab] = useState<TabId>('listings');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { data: session, status } = useSession();
    const router = useRouter();

    if (status === 'loading') {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400 text-sm">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (status === 'unauthenticated' || session?.user?.role !== 'ADMIN') {
        router.push('/');
        return null;
    }

    const activeTabData = tabs.find(t => t.id === activeTab)!;

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100">
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-gray-900 border-b border-gray-800 z-50 flex items-center justify-between px-4">
                <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-gray-400 hover:text-white">
                    <Menu className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-500" />
                    <span className="font-semibold text-sm">Admin Panel</span>
                </div>
                <div className="w-10" />
            </header>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div className="lg:hidden fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
                    <aside className="absolute left-0 top-0 bottom-0 w-72 bg-gray-900 border-r border-gray-800">
                        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-emerald-500" />
                                <span className="font-bold text-lg">Admin</span>
                            </div>
                            <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <nav className="p-3 space-y-1">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${isActive
                                            ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                                            : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5 flex-shrink-0" />
                                        <span>{tab.label}</span>
                                        {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                                    </button>
                                );
                            })}
                        </nav>
                    </aside>
                </div>
            )}

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-gray-900 border-r border-gray-800 flex-col z-40">
                <div className="p-5 border-b border-gray-800">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                            <Shield className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <p className="font-bold text-base">Admin Panel</p>
                            <p className="text-xs text-gray-500">UmreBuldum</p>
                        </div>
                    </div>
                </div>
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${isActive
                                    ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                                    }`}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                <span>{tab.label}</span>
                                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                            </button>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-gray-300">
                            {session?.user?.name?.charAt(0)?.toUpperCase() || 'A'}
                        </div>
                        <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{session?.user?.name || 'Admin'}</p>
                            <p className="text-xs text-emerald-500 font-medium">ADMIN</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:ml-64 pt-14 lg:pt-0 min-h-screen">
                {/* Page Header */}
                <div className="border-b border-gray-800 bg-gray-900/50 px-6 py-5">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <span>Admin</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-gray-300">{activeTabData.label}</span>
                    </div>
                    <h1 className="text-xl font-bold text-white">{activeTabData.label}</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{activeTabData.desc}</p>
                </div>

                {/* Panel Content */}
                <div className="p-6">
                    {activeTab === 'listings' && <PendingListingsPanel />}
                    {activeTab === 'requests' && <UserRequestsPanel />}
                    {activeTab === 'credits' && <CreditManagementPanel />}
                    {activeTab === 'ban' && <BanPanel />}
                    {activeTab === 'messages' && <AdminMessagesPanel />}
                    {activeTab === 'audit' && <AuditLogPanel />}
                </div>
            </main>
        </div>
    );
}

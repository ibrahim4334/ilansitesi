import Link from 'next/link';
import { LayoutDashboard, FileText, MessageSquare, BarChart3, Wallet, Settings, Menu, X, Bell, Heart, User, Briefcase, History } from 'lucide-react';
import { useState } from 'react';
import { useSession } from "next-auth/react";

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    badge?: number;
}

const organizerItems: NavItem[] = [
    { label: 'Ana Sayfa', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'İlanlarım', href: '/dashboard/listings', icon: <FileText className="w-5 h-5" />, badge: 12 },
    { label: 'Talepler', href: '/dashboard/requests', icon: <MessageSquare className="w-5 h-5" />, badge: 3 },
    { label: 'Kredi Geçmişi', href: '/dashboard/credits', icon: <History className="w-5 h-5" /> },
    { label: 'Performans', href: '/dashboard/analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { label: 'Gelir', href: '/dashboard/revenue', icon: <Wallet className="w-5 h-5" /> },
    { label: 'Mesajlar', href: '/dashboard/messages', icon: <MessageSquare className="w-5 h-5" />, badge: 5 },
    { label: 'Ayarlar', href: '/dashboard/settings', icon: <Settings className="w-5 h-5" /> },
];

const pilgrimItems: NavItem[] = [
    { label: 'Ana Sayfa', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Taleplerim', href: '/dashboard/requests', icon: <MessageSquare className="w-5 h-5" /> },
    { label: 'Favorilerim', href: '/dashboard/favorites', icon: <Heart className="w-5 h-5" /> },
    { label: 'Mesajlar', href: '/dashboard/messages', icon: <MessageSquare className="w-5 h-5" /> },
    { label: 'Ayarlar', href: '/dashboard/settings', icon: <Settings className="w-5 h-5" /> },
];

const guideItems: NavItem[] = [
    { label: 'Ana Sayfa', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Profilim', href: '/dashboard/profile', icon: <User className="w-5 h-5" /> },
    { label: 'Umreci Adaylarını Bul', href: '/dashboard/applications', icon: <Briefcase className="w-5 h-5" /> },
    { label: 'Kredi Geçmişi', href: '/dashboard/credits', icon: <History className="w-5 h-5" /> },
    { label: 'Mesajlar', href: '/dashboard/messages', icon: <MessageSquare className="w-5 h-5" /> },
    { label: 'Ayarlar', href: '/dashboard/settings', icon: <Settings className="w-5 h-5" /> },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { data: session } = useSession();
    const role = session?.user?.role;

    let navItems = organizerItems; // Default fallback
    let panelTitle = "Panel";

    if (role === 'USER') { // Was umreci
        navItems = pilgrimItems;
        panelTitle = "Umreci Paneli";
    } else if (role === 'GUIDE') { // Was rehber
        navItems = guideItems;
        panelTitle = "Rehber Paneli";
    } else if (role === 'ORGANIZATION') { // Was organizasyon
        navItems = organizerItems;
        panelTitle = "Organizatör Paneli";
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b z-50 flex items-center justify-between px-4">
                <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2">
                    <Menu className="w-6 h-6" />
                </button>
                <span className="font-semibold text-lg">Umre Buldum</span>
                <button className="p-2 -mr-2 relative">
                    <Bell className="w-6 h-6" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
            </header>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div className="lg:hidden fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
                    <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white">
                        <div className="p-4 border-b flex items-center justify-between">
                            <span className="font-bold text-lg">Menu</span>
                            <button onClick={() => setSidebarOpen(false)}>
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <nav className="p-4 space-y-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 text-gray-700"
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    {item.icon}
                                    <span className="flex-1">{item.label}</span>
                                    {item.badge && (
                                        <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                                            {item.badge}
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </nav>
                    </aside>
                </div>
            )}

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r flex-col">
                <div className="p-4 border-b">
                    <span className="font-bold text-xl text-blue-600">Umre Buldum</span>
                    <p className="text-xs text-gray-500 mt-1">{panelTitle}</p>
                </div>
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 text-gray-700"
                        >
                            {item.icon}
                            <span className="flex-1">{item.label}</span>
                            {item.badge && (
                                <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    ))}
                </nav>
                <div className="p-4 border-t">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full">
                            {/* Valid Avatar or Placeholder */}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{session?.user?.name || "Kullanıcı"}</p>
                            <p className="text-xs text-gray-500 capitalize">{session?.user?.role || "Misafir"}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:ml-64 pt-14 lg:pt-0 min-h-screen">
                {children}
            </main>
        </div>
    );
}

import Link from 'next/link';
import { Plus, Megaphone, FileDown, Image } from 'lucide-react';

interface QuickAction {
    label: string;
    icon: React.ReactNode;
    href: string;
    color: string;
    disabled?: boolean;
}

const defaultActions: QuickAction[] = [
    { label: 'Yeni İlan', icon: <Plus className="w-5 h-5" />, href: '/dashboard/listings/new', color: 'bg-blue-500 text-white' },
    { label: 'Kampanya (Yakında)', icon: <Megaphone className="w-5 h-5" />, href: '#', color: 'bg-purple-500 text-white', disabled: true },
    { label: 'Rapor İndir', icon: <FileDown className="w-5 h-5" />, href: '/dashboard/listings', color: 'bg-green-500 text-white' },
    { label: 'Afiş Oluştur', icon: <Image className="w-5 h-5" />, href: '/dashboard/listings', color: 'bg-orange-500 text-white' },
];

interface QuickActionsProps {
    actions?: QuickAction[];
}

export function QuickActions({ actions = defaultActions }: QuickActionsProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {actions.map((action, index) => (
                <Link
                    key={index}
                    href={action.href}
                    className={`${action.color} rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-sm ${action.disabled ? 'opacity-50 pointer-events-none' : ''}`}
                    aria-disabled={action.disabled}
                    tabIndex={action.disabled ? -1 : undefined}
                >
                    {action.icon}
                    <span className="text-sm font-medium text-center">{action.label}</span>
                </Link>
            ))}
        </div>
    );
}


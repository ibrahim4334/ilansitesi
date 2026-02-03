import Link from 'next/link';
import { MessageSquare, Phone, Clock } from 'lucide-react';

interface Request {
    id: string;
    customerName: string;
    listingTitle: string;
    message: string;
    timeAgo: string;
    status: 'new' | 'pending' | 'completed';
    phone?: string;
}

interface RequestCardProps {
    request: Request;
    compact?: boolean;
}

export function RequestCard({ request, compact = false }: RequestCardProps) {
    const statusColors = {
        new: 'bg-blue-500',
        pending: 'bg-yellow-500',
        completed: 'bg-green-500',
    };

    return (
        <div className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
                {/* Status Indicator */}
                <div className={`w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0 ${statusColors[request.status]}`} />

                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2">
                        <h4 className="font-semibold text-gray-900 truncate">{request.customerName}</h4>
                        <span className="text-xs text-gray-500 flex items-center gap-1 flex-shrink-0">
                            <Clock className="w-3 h-3" />
                            {request.timeAgo}
                        </span>
                    </div>

                    {/* Listing Reference */}
                    <p className="text-sm text-blue-600 mt-0.5 truncate">{request.listingTitle}</p>

                    {/* Message Preview */}
                    {!compact && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{request.message}</p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                        <Link
                            href={`/dashboard/requests/${request.id}`}
                            className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded-lg text-center hover:bg-blue-700 transition-colors"
                        >
                            Yanıtla
                        </Link>
                        {request.phone && (
                            <a
                                href={`tel:${request.phone}`}
                                className="w-10 h-10 border rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50"
                            >
                                <Phone className="w-4 h-4" />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

interface RequestListProps {
    requests: Request[];
    showViewAll?: boolean;
}

export function RequestList({ requests, showViewAll = true }: RequestListProps) {
    if (requests.length === 0) {
        return (
            <div className="bg-white rounded-xl border p-8 text-center">
                <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <h3 className="font-medium text-gray-900">Henüz talep yok</h3>
                <p className="text-sm text-gray-500 mt-1">
                    İlanlarınızı öne çıkararak talep almaya başlayın
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Son Talepler</h3>
                {showViewAll && (
                    <Link href="/dashboard/requests" className="text-sm text-blue-600 font-medium">
                        Tümünü Gör
                    </Link>
                )}
            </div>
            <div className="space-y-3">
                {requests.map((request) => (
                    <RequestCard key={request.id} request={request} />
                ))}
            </div>
        </div>
    );
}

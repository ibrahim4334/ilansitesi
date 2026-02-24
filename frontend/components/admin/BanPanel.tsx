'use client';

import { useState } from 'react';
import { Search, Ban as BanIcon, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function BanPanel() {
    const [searchEmail, setSearchEmail] = useState('');
    const [user, setUser] = useState<{ id: string; name: string | null; email: string; role: string | null; isMuted?: boolean; mutedUntil?: string | null } | null>(null);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [banReason, setBanReason] = useState('');
    const [banning, setBanning] = useState(false);
    const [banModal, setBanModal] = useState(false);
    const [muteModal, setMuteModal] = useState(false);
    const [muteReason, setMuteReason] = useState('');
    const [muteDuration, setMuteDuration] = useState('24h');
    const [muting, setMuting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        if (!searchEmail.trim()) return;
        setSearching(true);
        setSearchError('');
        setUser(null);
        setFeedback(null);
        try {
            const res = await fetch(`/api/admin/credits?email=${encodeURIComponent(searchEmail.trim())}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Kullanıcı bulunamadı');
            setUser(data.user);
        } catch (err: any) {
            setSearchError(err.message);
        } finally {
            setSearching(false);
        }
    }

    async function handleBan() {
        if (!user || !banReason.trim()) return;
        setBanning(true);
        setFeedback(null);
        try {
            const res = await fetch('/api/admin/ban', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: user.id, reason: banReason.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Ban işlemi başarısız');
            setFeedback({ type: 'success', message: `${user.email} kullanıcısı banlandı.` });
            setBanModal(false);
            setBanReason('');
            setUser({ ...user, role: 'BANNED' });
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message });
        } finally {
            setBanning(false);
        }
    }

    async function handleMute(isUnmute = false) {
        if (!user || (!isUnmute && !muteReason.trim())) return;
        setMuting(true);
        setFeedback(null);
        try {
            if (isUnmute) {
                const res = await fetch('/api/admin/mute', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, reason: 'Admin unmuted' }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Unmute işlemi başarısız');
                setFeedback({ type: 'success', message: `${user.email} kullanıcısının susturulması kaldırıldı.` });
                setUser({ ...user, isMuted: false, mutedUntil: null });
            } else {
                let mutedUntil;
                if (muteDuration === '24h') {
                    const d = new Date();
                    d.setHours(d.getHours() + 24);
                    mutedUntil = d.toISOString();
                }
                const res = await fetch('/api/admin/mute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, reason: muteReason.trim(), mutedUntil }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Mute işlemi başarısız');
                setFeedback({ type: 'success', message: `${user.email} kullanıcısı susturuldu.` });
                setMuteModal(false);
                setMuteReason('');
                setUser({ ...user, isMuted: true, mutedUntil });
            }
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message });
        } finally {
            setMuting(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="email"
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                        placeholder="Banlanacak kullanıcı e-postası..."
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                    />
                </div>
                <button
                    type="submit"
                    disabled={!searchEmail.trim() || searching}
                    className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                >
                    {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    Ara
                </button>
            </form>

            {feedback && (
                <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${feedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                    {feedback.message}
                </div>
            )}

            {searchError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <p className="text-red-400 text-sm">{searchError}</p>
                </div>
            )}

            {user && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-white">{user.name || user.email}</h3>
                            <p className="text-sm text-gray-400">{user.email}</p>
                            <span className={`inline-flex mt-2 px-2 py-0.5 rounded text-xs font-medium ${user.role === 'BANNED' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                                }`}>
                                {user.role || 'No role'}
                            </span>
                        </div>
                        {user.role !== 'BANNED' && user.role !== 'ADMIN' ? (
                            <div className="flex gap-2">
                                {user.isMuted ? (
                                    <button
                                        onClick={() => handleMute(true)}
                                        disabled={muting}
                                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        {muting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Susturmayı Kaldır'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setMuteModal(true)}
                                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Sustur
                                    </button>
                                )}
                                <button
                                    onClick={() => setBanModal(true)}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                                >
                                    <BanIcon className="w-4 h-4" />
                                    Banla
                                </button>
                            </div>
                        ) : user.role === 'BANNED' ? (
                            <span className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg text-sm font-medium">
                                Zaten Banlı
                            </span>
                        ) : (
                            <span className="px-4 py-2 bg-yellow-500/10 text-yellow-400 rounded-lg text-sm font-medium">
                                Admin banlanamaz
                            </span>
                        )}
                    </div>
                </div>
            )}

            {!user && !searching && !searchError && (
                <div className="text-center py-12">
                    <ShieldAlert className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">Kullanıcı aramak için e-posta girin</p>
                    <p className="text-gray-600 text-sm mt-1">Ban işlemi kullanıcının rolünü BANNED olarak değiştirir ve tüm ilanlarını deaktif eder.</p>
                </div>
            )}

            {/* Ban Reason Modal */}
            {banModal && user && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70" onClick={() => { setBanModal(false); setBanReason(''); }} />
                    <div className="relative bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center">
                                <BanIcon className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Kullanıcıyı Banla</h3>
                                <p className="text-sm text-gray-400">{user.email}</p>
                            </div>
                        </div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Ban Sebebi <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            value={banReason}
                            onChange={(e) => setBanReason(e.target.value)}
                            placeholder="Ban sebebini yazınız..."
                            rows={3}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => { setBanModal(false); setBanReason(''); }}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleBan}
                                disabled={!banReason.trim() || banning}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                            >
                                {banning && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                Banla
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mute Modal */}
            {muteModal && user && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70" onClick={() => { setMuteModal(false); setMuteReason(''); }} />
                    <div className="relative bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-orange-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Kullanıcıyı Sustur</h3>
                                <p className="text-sm text-gray-400">{user.email}</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                    Süre
                                </label>
                                <select
                                    value={muteDuration}
                                    onChange={(e) => setMuteDuration(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                >
                                    <option value="24h">24 Saat (Geçici)</option>
                                    <option value="permanent">Kalıcı</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                    Sebep <span className="text-red-400">*</span>
                                </label>
                                <textarea
                                    value={muteReason}
                                    onChange={(e) => setMuteReason(e.target.value)}
                                    placeholder="Susturma sebebini yazınız..."
                                    rows={3}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => { setMuteModal(false); setMuteReason(''); }}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={() => handleMute(false)}
                                disabled={!muteReason.trim() || muting}
                                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-600/50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                            >
                                {muting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                Sustur
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

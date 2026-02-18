
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Lock, Phone, Mail, MessageSquare, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export default function RequestDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [request, setRequest] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [unlocking, setUnlocking] = useState(false);
    const [showUnlockModal, setShowUnlockModal] = useState(false);

    // Credit Balance (for modal)
    // We would fetch this if we had the same context/SWR here

    useEffect(() => {
        fetch(`/api/requests/${id}`)
            .then(res => {
                if (!res.ok) throw new Error("Failed to load");
                return res.json();
            })
            .then(data => setRequest(data))
            .catch(err => toast.error("Talep detayları yüklenemedi."))
            .finally(() => setLoading(false));
    }, [id]);

    const handleUnlock = async () => {
        setUnlocking(true);
        try {
            const res = await fetch("/api/requests/interest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestId: id })
            });
            const data = await res.json();

            if (res.ok) {
                toast.success("İletişim bilgileri açıldı!");
                // Reload page to get unlocked data
                window.location.reload();
            } else {
                if (data.error === "INSUFFICIENT_CREDITS") {
                    toast.error("Yetersiz bakiye. Kredi yükleyin.");
                    router.push("/dashboard/credits");
                } else if (data.message === "Already expressed interest") {
                    window.location.reload();
                } else {
                    toast.error(data.message || "Bir hata oluştu");
                }
            }
        } catch (e) {
            toast.error("Hata oluştu");
        } finally {
            setUnlocking(false);
            setShowUnlockModal(false);
        }
    };

    if (loading) return <DashboardLayout><div className="p-8 text-center flex justify-center"><Loader2 className="animate-spin" /></div></DashboardLayout>;
    if (!request) return <DashboardLayout><div className="p-8 text-center">Talep bulunamadı.</div></DashboardLayout>;

    const { contactPreferences, contactInfo, hasPaidInterest } = request;
    const canChat = contactPreferences?.chat;

    return (
        <DashboardLayout>
            <div className="container mx-auto py-10 px-4 max-w-4xl">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-1">Talep Detayı</h1>
                        <p className="text-gray-500 text-sm">Talep ID: {id}</p>
                    </div>
                    <Button variant="outline" onClick={() => router.back()}>Geri Dön</Button>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Request Info */}
                    <div className="bg-white border rounded-xl p-6 space-y-4 shadow-sm">
                        <h2 className="font-semibold text-lg border-b pb-2 flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-800 p-1 rounded-lg"><MessageSquare className="w-4 h-4" /></span>
                            Tur Bilgileri
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm text-gray-500 block">Çıkış Şehri</span>
                                <span className="font-medium text-lg">{request.departureCity}</span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500 block">Kişi Sayısı</span>
                                <span className="font-medium text-lg">{request.peopleCount} Kişi</span>
                            </div>
                            <div className="col-span-2">
                                <span className="text-sm text-gray-500 block">Tarih Aralığı</span>
                                <span className="font-medium">{request.dateRange}</span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500 block">Oda Tipi</span>
                                <span className="font-medium capitalize">{request.roomType}</span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500 block">Bütçe</span>
                                <span className="font-medium">{request.budget ? `${request.budget} SAR` : 'Belirtilmedi'}</span>
                            </div>
                        </div>
                        {request.note && (
                            <div className="pt-4 mt-2 border-t">
                                <span className="text-sm text-gray-500 block mb-1">Özel Notlar</span>
                                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg italic text-sm">"{request.note}"</p>
                            </div>
                        )}
                    </div>

                    {/* Contact Logic */}
                    <div className="bg-white border rounded-xl p-6 space-y-6 shadow-sm flex flex-col justify-between">
                        <div>
                            <h2 className="font-semibold text-lg border-b pb-2 flex items-center gap-2 mb-4">
                                <span className="bg-green-100 text-green-800 p-1 rounded-lg"><Phone className="w-4 h-4" /></span>
                                İletişim & Aksiyon
                            </h2>

                            {hasPaidInterest ? (
                                <div className="space-y-4 animate-in fade-in duration-500">
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <p className="text-green-800 text-sm font-medium mb-3 flex items-center gap-2">
                                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                            İletişim Bilgileri Açık
                                        </p>

                                        <div className="space-y-3">
                                            {/* Phone */}
                                            <div className="flex items-center gap-3 p-2 bg-white rounded border">
                                                <div className="bg-gray-100 p-2 rounded-full">
                                                    <Phone className={`w-4 h-4 ${contactInfo?.phone ? 'text-gray-700' : 'text-gray-300'}`} />
                                                </div>
                                                <div>
                                                    <span className="text-xs text-gray-500 block">Telefon</span>
                                                    <span className={`font-medium ${!contactInfo?.phone && 'text-gray-400 italic'}`}>
                                                        {contactInfo?.phone || "Gizli / Paylaşılmadı"}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Email */}
                                            <div className="flex items-center gap-3 p-2 bg-white rounded border">
                                                <div className="bg-gray-100 p-2 rounded-full">
                                                    <Mail className={`w-4 h-4 ${contactInfo?.email ? 'text-gray-700' : 'text-gray-300'}`} />
                                                </div>
                                                <div>
                                                    <span className="text-xs text-gray-500 block">E-posta</span>
                                                    <span className={`font-medium ${!contactInfo?.email && 'text-gray-400 italic'}`}>
                                                        {contactInfo?.email || "Gizli / Paylaşılmadı"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {canChat && (
                                        <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700 h-12 text-lg">
                                            <MessageSquare className="w-5 h-5" />
                                            Mesaj Gönder
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6 text-center py-6">
                                    <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2">
                                        <Lock className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-bold text-gray-900">İletişim Bilgileri Kapalı</h3>
                                        <p className="text-gray-500 text-sm">
                                            Bu kullanıcının iletişim bilgilerini görmek ve mesajlaşmak için kilidi açmalısınız.
                                        </p>
                                    </div>

                                    <div className="text-sm bg-gray-50 p-3 rounded-lg text-left space-y-2">
                                        <p className="font-semibold text-gray-700">Kullanıcı Tercihleri:</p>
                                        <div className="flex gap-2 flex-wrap">
                                            {contactPreferences?.chat && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">Sohbet</span>}
                                            {contactPreferences?.phone && <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">Telefon</span>}
                                            {contactPreferences?.email && <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">E-posta</span>}
                                        </div>
                                    </div>

                                    <Button onClick={() => setShowUnlockModal(true)} className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg shadow-lg shadow-blue-200">
                                        Kilidi Aç & İletişime Geç
                                    </Button>
                                    <p className="text-xs text-gray-400">İşlem bakiyenizden düşülecektir.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Unlock Modal */}
                {showUnlockModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowUnlockModal(false)} />
                        <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="text-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Kilidi Aç</h3>
                                <p className="text-gray-500">
                                    Bu talebin iletişim bilgilerini açmak üzeresiniz.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1 h-11" onClick={() => setShowUnlockModal(false)}>İptal</Button>
                                <Button
                                    className="flex-1 h-11 bg-blue-600 hover:bg-blue-700"
                                    onClick={handleUnlock}
                                    disabled={unlocking}
                                >
                                    {unlocking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    {unlocking ? 'Açılıyor...' : 'Onayla'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

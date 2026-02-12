
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Lock, Phone, Mail, MessageSquare } from "lucide-react";

export default function RequestDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const [request, setRequest] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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

    if (loading) return <div className="p-8 text-center">Yükleniyor...</div>;
    if (!request) return <div className="p-8 text-center">Talep bulunamadı.</div>;

    const { contactConsent, contactInfo } = request;

    return (
        <div className="container mx-auto py-10 px-4 max-w-4xl">
            <h1 className="text-3xl font-bold mb-2">Talep Detayı</h1>
            <p className="text-gray-500 mb-8">Talep ID: {id}</p>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Request Info */}
                <div className="bg-white border rounded-xl p-6 space-y-4">
                    <h2 className="font-semibold text-lg border-b pb-2">Tur Bilgileri</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-sm text-gray-500 block">Çıkış Şehri</span>
                            <span className="font-medium">{request.departureCity}</span>
                        </div>
                        <div>
                            <span className="text-sm text-gray-500 block">Kişi Sayısı</span>
                            <span className="font-medium">{request.peopleCount} Kişi</span>
                        </div>
                        <div>
                            <span className="text-sm text-gray-500 block">Tarih Aralığı</span>
                            <span className="font-medium">{request.dateRange}</span>
                        </div>
                        <div>
                            <span className="text-sm text-gray-500 block">Oda Tipi</span>
                            <span className="font-medium">{request.roomType}</span>
                        </div>
                        <div>
                            <span className="text-sm text-gray-500 block">Bütçe</span>
                            <span className="font-medium">{request.budget ? `${request.budget} SAR` : 'Belirtilmedi'}</span>
                        </div>
                    </div>
                </div>

                {/* Contact Logic */}
                <div className="bg-white border rounded-xl p-6 space-y-6">
                    <h2 className="font-semibold text-lg border-b pb-2">İletişim & Aksiyon</h2>

                    {contactConsent ? (
                        <div className="space-y-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <p className="text-green-800 text-sm font-medium mb-3">
                                    Kullanıcı iletişim bilgilerini paylaşmayı kabul etti.
                                </p>
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <div className="bg-white p-2 rounded-full border">
                                            <Phone className="w-4 h-4 text-gray-600" />
                                        </div>
                                        <span className="font-medium">{contactInfo.phone || "Telefon kayıtlı değil"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <div className="bg-white p-2 rounded-full border">
                                            <Mail className="w-4 h-4 text-gray-600" />
                                        </div>
                                        <span className="font-medium">{contactInfo.email}</span>
                                    </div>
                                </div>
                            </div>
                            <Button className="w-full">
                                Not/Teklif Bırak
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2 text-yellow-800 font-medium">
                                    <Lock className="w-4 h-4" />
                                    <span>Gizli İletişim</span>
                                </div>
                                <p className="text-sm text-yellow-700">
                                    Kullanıcı iletişim bilgilerini paylaşmamayı tercih etti. İletişim sadece platform üzerinden sağlanabilir.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Kullanıcıya Mesaj/Not Gönder</label>
                                <textarea
                                    className="w-full min-h-[100px] p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="Tur teklifiniz veya sorularınız hakkında bilgi verin..."
                                />
                                <Button className="w-full gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    Mesaj Gönder
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

"use client";

import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CampaignsPage() {
    return (
        <div className="container mx-auto py-20 px-4 text-center">
            <div className="max-w-md mx-auto">
                <div className="bg-purple-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <Megaphone className="w-10 h-10 text-purple-600" />
                </div>
                <h1 className="text-3xl font-bold mb-4">Kampanyalar</h1>
                <p className="text-gray-500 mb-8">
                    Özel kampanya ve indirim yönetimi modülü geliştirme aşamasındadır.
                    Çok yakında buradan turlarınız için özel promosyonlar oluşturabileceksiniz.
                </p>
                <Button variant="outline" disabled>Çok Yakında</Button>
            </div>
        </div>
    );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function ToursSort() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleSortChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("sort", value);
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Sıralama:</span>
            <Select
                defaultValue={searchParams.get("sort") || "recommended"}
                onValueChange={handleSortChange}
            >
                <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Sıralama" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="recommended">Önerilen</SelectItem>
                    <SelectItem value="price_asc">Fiyat (Artan)</SelectItem>
                    <SelectItem value="price_desc">Fiyat (Azalan)</SelectItem>
                    <SelectItem value="date_asc">Tarih (Yakın)</SelectItem>
                    <SelectItem value="date_desc">Tarih (Uzak)</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}

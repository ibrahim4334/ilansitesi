import { Button } from "@/components/ui/button";

export default function OrganizerProfile() {
    return (
        <div className="container py-12">
            <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-24 w-24 rounded-full bg-gray-200"></div>
                <h1 className="text-2xl font-bold">Organizatör Profili</h1>
                <p className="text-muted-foreground max-w-md">
                    Bu sayfa yapım aşamasındadır. Burada firma bilgileri, diğer turları ve yorumlar listelenecektir.
                </p>
                <Button variant="outline">Geri Dön</Button>
            </div>
        </div>
    )
}

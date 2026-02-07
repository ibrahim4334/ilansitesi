import { Phone, User, Building } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EmergencyInfoProps {
  guideName: string;
  guidePhone: string;
  agencyName: string;
}

export function EmergencyInfo({ guideName, guidePhone, agencyName }: EmergencyInfoProps) {
  return (
    <Card className="border-2 border-primary bg-primary/5">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl lg:text-2xl">
          <Phone className="h-6 w-6 text-primary" />
          Acil Durum İletişim
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Guide Name */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
            <User className="h-6 w-6 text-foreground" aria-hidden="true" />
          </div>
          <div>
            <p className="text-base text-muted-foreground">Tur Rehberi</p>
            <p className="text-xl font-semibold text-foreground">{guideName}</p>
          </div>
        </div>

        {/* Guide Phone */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
            <Phone className="h-6 w-6 text-foreground" aria-hidden="true" />
          </div>
          <div>
            <p className="text-base text-muted-foreground">Telefon Numarası</p>
            <a
              href={`tel:${guidePhone}`}
              className="text-xl font-semibold text-primary hover:underline"
            >
              {guidePhone}
            </a>
          </div>
        </div>

        {/* Agency */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
            <Building className="h-6 w-6 text-foreground" aria-hidden="true" />
          </div>
          <div>
            <p className="text-base text-muted-foreground">Seyahat Acentesi</p>
            <p className="text-xl font-semibold text-foreground">{agencyName}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

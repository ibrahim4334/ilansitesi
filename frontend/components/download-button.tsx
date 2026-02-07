import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOfflineExportUrl } from "@/lib/api";

interface DownloadButtonProps {
  tourId: number;
  tourTitle: string;
}

export function DownloadButton({ tourId, tourTitle }: DownloadButtonProps) {
  const downloadUrl = getOfflineExportUrl(tourId);

  return (
    <Button
      asChild
      size="lg"
      className="h-16 w-full gap-3 text-lg font-semibold"
    >
      <a
        href={downloadUrl}
        download={`${tourTitle.replace(/\s+/g, "-").toLowerCase()}-tur-plani.html`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <FileText className="h-6 w-6" />
        <span>Çevrimdışı Tur Planını İndir</span>
        <Download className="h-5 w-5" />
      </a>
    </Button>
  );
}

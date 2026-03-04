'use client';

import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { Camera, ExternalLink, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardProfilePage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        city: '',
        bio: '',
        photo: '',
        isIdentityVerified: false,
    });

    useEffect(() => {
        fetch('/api/guide/profile')
            .then((res) => res.json())
            .then((data) => {
                if (data.userId) {
                    setFormData({
                        fullName: data.fullName || '',
                        phone: data.phone || '',
                        city: data.city || '',
                        bio: data.bio || '', // Handle null
                        photo: data.photo || '',
                        isIdentityVerified: data.isIdentityVerified || false,
                    });
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const compressImageToWebP = (file: File, maxWidth = 800): Promise<File> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    ctx?.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                                type: "image/webp",
                                lastModified: Date.now(),
                            });
                            resolve(newFile);
                        } else {
                            reject(new Error("Canvas to Blob failed"));
                        }
                    }, "image/webp", 0.8); // 80% quality WEBP
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const originalFile = e.target.files[0];

        // Simple validation
        if (originalFile.size > 15 * 1024 * 1024) { // Increased to 15MB to allow raw camera but compress it down
            toast.error("Dosya boyutu başlangıç için 15MB'dan küçük olmalıdır.");
            return;
        }

        setUploading(true);
        try {
            const compressedFile = await compressImageToWebP(originalFile);
            const data = new FormData();
            data.append("file", compressedFile);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: data,
            });
            const json = await res.json();
            if (res.ok) {
                setFormData(prev => ({ ...prev, photo: json.url }));
                toast.success("Fotoğraf yüklendi.");
            } else {
                toast.error(json.error || "Yükleme başarısız.");
            }
        } catch (err) {
            toast.error("Yükleme hatası.");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/guide/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                toast.success('Profil güncellendi.');
                // Redirect to public profile
                if (session?.user?.id) {
                    router.push(`/guides/${session.user.id}`);
                }
            } else {
                toast.error('Hata oluştu.');
            }
        } catch {
            toast.error('Sunucu hatası.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="p-8 text-center">Yükleniyor...</div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto py-10 px-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Profilim</h1>
                    {session?.user?.id && (
                        <Link href={`/guides/${session.user.id}`} target="_blank">
                            <Button variant="outline" className="gap-2">
                                <ExternalLink className="w-4 h-4" />
                                Profili Görüntüle
                            </Button>
                        </Link>
                    )}
                </div>

                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Profile Image Section */}
                        <div className="flex flex-col items-center gap-4 py-4 border-b">
                            <div className="relative w-24 h-24 rounded-full bg-gray-100 border-2 border-gray-200 overflow-hidden flex items-center justify-center">
                                {formData.photo ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={formData.photo} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <Camera className="w-8 h-8 text-gray-400" />
                                )}
                                {uploading && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-3">
                                {/* Camera Input */}
                                <div className="relative">
                                    <Label htmlFor="camera-upload" className="flex items-center gap-2 cursor-pointer bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                                        <Camera className="w-4 h-4" />
                                        {uploading ? "Bekleyin..." : "Kameradan Çek"}
                                    </Label>
                                    <Input
                                        id="camera-upload"
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={handleFileChange}
                                        disabled={uploading}
                                    />
                                </div>

                                {/* Gallery Input */}
                                <div className="relative">
                                    <Label htmlFor="gallery-upload" className="flex items-center gap-2 cursor-pointer bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                                        {uploading ? "Bekleyin..." : "Galeriden Seç"}
                                    </Label>
                                    <Input
                                        id="gallery-upload"
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        disabled={uploading}
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 text-center">
                                Dosyalarınız web için otomatik sıkıştırılarak (WebP) depolanır.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Ad Soyad</Label>
                                <Input
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label>Telefon (WhatsApp)</Label>
                                <Input
                                    value={formData.phone}
                                    placeholder="+90 555..."
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Şehir</Label>
                            <Input
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <Label>Hakkında (Biyografi)</Label>
                            <Textarea
                                rows={4}
                                value={formData.bio}
                                placeholder="Kendinizi ve tecrübelerinizi tanıtın..."
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                required
                            />
                        </div>



                        <div className="pt-4">
                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={saving}>
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Umre Buldum',
    description: 'En iyi umre turlarını bulun',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="tr">
            <body className={cn(inter.className, "min-h-screen bg-background font-sans antialiased")}>
                <div className="relative flex min-h-screen flex-col">
                    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <div className="container flex h-14 items-center">
                            <div className="mr-4 hidden md:flex">
                                <a className="mr-6 flex items-center space-x-2" href="/">
                                    <span className="hidden font-bold sm:inline-block">
                                        Umre Buldum
                                    </span>
                                </a>
                            </div>
                            <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                                <div className="w-full flex-1 md:w-auto md:flex-none">
                                    {/* Search placeholder */}
                                </div>
                                <nav className="flex items-center">
                                    {/* Nav placeholder */}
                                </nav>
                            </div>
                        </div>
                    </header>
                    <main className="flex-1">
                        {children}
                    </main>
                    <footer className="py-6 md:px-8 md:py-0">
                        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                                © 2024 Umre Buldum. Tüm hakları saklıdır.
                            </p>
                        </div>
                    </footer>
                </div>
            </body>
        </html>
    )
}

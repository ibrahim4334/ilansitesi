"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Phone, User, LogOut, LayoutDashboard, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserMenu } from "@/components/user-menu";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <span className="text-2xl font-bold text-primary-foreground">U</span>
          </div>
          <span className="text-2xl font-bold tracking-tight text-foreground">
            Umrebuldum
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 lg:flex">
          <Link
            href="/tours"
            className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
          >
            Umre Turları
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
          >
            Hakkımızda
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
          >
            İletişim
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-4">
          <a
            href="tel:+908501234567"
            className="hidden xl:flex items-center gap-2 text-sm font-medium text-foreground/80 mr-4 transition-colors hover:text-primary"
          >
            <Phone className="h-4 w-4" />
            0850 123 45 67
          </a>

          {!isLoading && (
            <>
              {session?.user ? (
                <UserMenu />
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" asChild className="text-sm font-medium">
                    <Link href="/login">Giriş Yap</Link>
                  </Button>
                  <Button asChild className="text-sm font-semibold">
                    <Link href="/login">Kayıt Ol</Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-foreground lg:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Menüyü kapat" : "Menüyü aç"}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="border-t border-border bg-card lg:hidden">
          <nav className="flex flex-col gap-2 p-4">
            {session?.user && (
              <div className="mb-4 flex items-center gap-3 px-5 py-2 bg-muted/50 rounded-xl">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                  <AvatarFallback>{getInitials(session.user.name || session.user.email)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{session.user.name || "Kullanıcı"}</span>
                  <span className="text-xs text-muted-foreground">{session.user.email}</span>
                  {session.user.role && (
                    <span className="text-xs text-primary font-semibold uppercase mt-0.5">
                      {session.user.role}
                    </span>
                  )}
                </div>
              </div>
            )}

            <Link
              href="/tours"
              className="rounded-xl px-5 py-3 text-lg font-medium text-foreground transition-colors hover:bg-secondary"
              onClick={() => setIsMenuOpen(false)}
            >
              Umre Turları
            </Link>
            <Link
              href="/about"
              className="rounded-xl px-5 py-3 text-lg font-medium text-foreground transition-colors hover:bg-secondary"
              onClick={() => setIsMenuOpen(false)}
            >
              Hakkımızda
            </Link>
            <Link
              href="/contact"
              className="rounded-xl px-5 py-3 text-lg font-medium text-foreground transition-colors hover:bg-secondary"
              onClick={() => setIsMenuOpen(false)}
            >
              İletişim
            </Link>

            {session?.user ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-xl px-5 py-3 text-lg font-medium text-foreground transition-colors hover:bg-secondary flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <LayoutDashboard className="h-5 w-5" />
                  Panelim
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMenuOpen(false);
                  }}
                  className="rounded-xl px-5 py-3 text-lg font-medium text-red-500 transition-colors hover:bg-secondary flex items-center gap-2 w-full text-left"
                >
                  <LogOut className="h-5 w-5" />
                  Çıkış Yap
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3 mt-4 px-2">
                <Button variant="outline" size="lg" asChild>
                  <Link href="/login" onClick={() => setIsMenuOpen(false)}>Giriş Yap</Link>
                </Button>
                <Button size="lg" asChild>
                  <Link href="/login" onClick={() => setIsMenuOpen(false)}>Kayıt Ol</Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

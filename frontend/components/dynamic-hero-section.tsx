"use client"

import dynamic from "next/dynamic"

export const DynamicHeroSection = dynamic(
    () => import("@/components/hero-section").then(m => m.HeroSection),
    { ssr: false }
)

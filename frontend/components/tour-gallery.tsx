"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TourGalleryProps {
  images: string[];
  title: string;
}

export function TourGallery({ images, title }: TourGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Use featured image if no gallery, or create array with featured
  const galleryImages = images.length > 0 ? images : ["/placeholder-tour.jpg"];

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      {/* Main Gallery */}
      <div className="relative overflow-hidden rounded-2xl">
        {/* Main Image */}
        <div
          className="relative aspect-[16/9] cursor-pointer sm:aspect-[2/1] lg:aspect-[5/2]"
          onClick={() => setIsModalOpen(true)}
          onKeyDown={(e) => e.key === "Enter" && setIsModalOpen(true)}
          role="button"
          tabIndex={0}
          aria-label="Open image gallery"
        >
          <Image
            src={galleryImages[currentIndex] || "/placeholder.svg"}
            alt={`${title} - Image ${currentIndex + 1}`}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
          />
          
          {/* Image Counter */}
          {galleryImages.length > 1 && (
            <div className="absolute bottom-4 right-4 rounded-lg bg-foreground/80 px-3 py-1.5 text-sm font-medium text-background">
              {currentIndex + 1} / {galleryImages.length}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        {galleryImages.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-4 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-4 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}
      </div>

      {/* Thumbnail Strip */}
      {galleryImages.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {galleryImages.map((image, index) => (
            <button
              key={index}
              type="button"
              className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-lg transition-all ${
                index === currentIndex
                  ? "ring-2 ring-primary ring-offset-2"
                  : "opacity-70 hover:opacity-100"
              }`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`View image ${index + 1}`}
              aria-current={index === currentIndex ? "true" : undefined}
            >
              <Image
                src={image || "/placeholder.svg"}
                alt={`${title} thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="112px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/95"
          onClick={() => setIsModalOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Image gallery"
        >
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 h-12 w-12 rounded-full text-background hover:bg-background/20 hover:text-background"
            onClick={() => setIsModalOpen(false)}
            aria-label="Close gallery"
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Modal Image */}
          <div
            className="relative h-[80vh] w-[90vw] max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={galleryImages[currentIndex] || "/placeholder.svg"}
              alt={`${title} - Image ${currentIndex + 1}`}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>

          {/* Modal Navigation */}
          {galleryImages.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 h-14 w-14 -translate-y-1/2 rounded-full text-background hover:bg-background/20 hover:text-background"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 h-14 w-14 -translate-y-1/2 rounded-full text-background hover:bg-background/20 hover:text-background"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                aria-label="Next image"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          {/* Modal Counter */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-lg bg-background/20 px-4 py-2 text-lg font-medium text-background">
            {currentIndex + 1} / {galleryImages.length}
          </div>
        </div>
      )}
    </>
  );
}

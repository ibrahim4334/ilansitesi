"""
Umrebuldum Poster Service - FastAPI Application
Afiş üretimi için mikroservis
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import httpx
import os
from datetime import datetime

app = FastAPI(
    title="Umrebuldum Poster Service",
    description="İlan afişi üretim servisi",
    version="1.0.0"
)

# CORS - WordPress ve mobil uygulamadan erişim
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://umrebuldum.com",
        "https://www.umrebuldum.com",
        "http://localhost:3000",  # Dev
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# MODELS
# ============================================

class ListingData(BaseModel):
    """WordPress'ten gelen ilan verisi"""
    listing_id: int
    title: str
    description: Optional[str] = None
    price: Optional[str] = None
    location: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_whatsapp: Optional[str] = None

class PosterRequest(BaseModel):
    """Afiş üretim isteği"""
    listing: ListingData
    template: str = "default"
    size: str = "instagram"  # instagram, story, facebook, whatsapp
    watermark: bool = True

class PosterResponse(BaseModel):
    """Afiş üretim yanıtı"""
    success: bool
    poster_url: Optional[str] = None
    job_id: Optional[str] = None
    message: str

class WebhookPayload(BaseModel):
    """WordPress webhook payload"""
    action: str  # listing_created, listing_updated
    listing_id: int
    timestamp: str

# ============================================
# POSTER TEMPLATES
# ============================================

POSTER_SIZES = {
    "instagram": (1080, 1080),
    "story": (1080, 1920),
    "facebook": (1200, 630),
    "whatsapp": (800, 800),
    "twitter": (1200, 675),
}

TEMPLATES = {
    "default": {
        "bg_color": "#1a1a2e",
        "accent_color": "#ffc107",
        "text_color": "#ffffff",
        "font": "Inter-Bold.ttf",
    },
    "modern": {
        "bg_color": "#0f0f0f",
        "accent_color": "#00d4ff",
        "text_color": "#ffffff",
        "font": "Montserrat-Bold.ttf",
    },
    "umre": {
        "bg_color": "#1e3a5f",
        "accent_color": "#c9a227",
        "text_color": "#ffffff",
        "font": "Amiri-Bold.ttf",
    },
}

# ============================================
# ENDPOINTS
# ============================================

@app.get("/")
async def root():
    return {"service": "Umrebuldum Poster Service", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.post("/api/v1/generate", response_model=PosterResponse)
async def generate_poster(request: PosterRequest, background_tasks: BackgroundTasks):
    """
    Afiş üretimi endpoint'i
    Senkron veya asenkron çalışabilir
    """
    try:
        # Validate template
        if request.template not in TEMPLATES:
            raise HTTPException(status_code=400, detail=f"Invalid template: {request.template}")
        
        # Validate size
        if request.size not in POSTER_SIZES:
            raise HTTPException(status_code=400, detail=f"Invalid size: {request.size}")
        
        # Generate job ID
        job_id = f"poster_{request.listing.listing_id}_{int(datetime.utcnow().timestamp())}"
        
        # Add to background task queue
        background_tasks.add_task(
            process_poster_generation,
            job_id=job_id,
            listing=request.listing,
            template=request.template,
            size=request.size,
            watermark=request.watermark
        )
        
        return PosterResponse(
            success=True,
            job_id=job_id,
            message="Poster generation started"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/webhook/listing")
async def wordpress_webhook(payload: WebhookPayload, background_tasks: BackgroundTasks):
    """
    WordPress'ten gelen webhook
    Yeni ilan oluşturulduğunda otomatik afiş üret
    """
    if payload.action == "listing_created":
        # WordPress API'den ilan detaylarını çek
        background_tasks.add_task(
            fetch_and_generate,
            listing_id=payload.listing_id
        )
        return {"status": "accepted", "listing_id": payload.listing_id}
    
    return {"status": "ignored", "action": payload.action}

@app.get("/api/v1/status/{job_id}")
async def get_job_status(job_id: str):
    """
    Afiş üretim durumu kontrolü
    """
    # Redis'ten job durumu çek
    # Şimdilik mock
    return {
        "job_id": job_id,
        "status": "completed",
        "poster_url": f"https://cdn.umrebuldum.com/posters/{job_id}.png"
    }

@app.get("/api/v1/templates")
async def list_templates():
    """
    Mevcut şablonları listele
    """
    return {
        "templates": list(TEMPLATES.keys()),
        "sizes": list(POSTER_SIZES.keys())
    }

# ============================================
# BACKGROUND TASKS
# ============================================

async def process_poster_generation(
    job_id: str,
    listing: ListingData,
    template: str,
    size: str,
    watermark: bool
):
    """
    Afiş üretim işlemi (background task)
    """
    from poster_generator import PosterGenerator
    
    generator = PosterGenerator(
        template=TEMPLATES[template],
        size=POSTER_SIZES[size]
    )
    
    poster_path = generator.create(
        title=listing.title,
        price=listing.price,
        location=listing.location,
        image_url=listing.image_url,
        watermark=watermark
    )
    
    # S3'e yükle
    # poster_url = upload_to_s3(poster_path, job_id)
    
    # WordPress'e callback gönder
    # await notify_wordpress(listing.listing_id, poster_url)
    
    return poster_path

async def fetch_and_generate(listing_id: int):
    """
    WordPress'ten ilan verisi çek ve afiş üret
    """
    wp_api_url = os.getenv("WORDPRESS_API_URL", "https://umrebuldum.com/wp-json")
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{wp_api_url}/hivepress/v1/listings/{listing_id}"
        )
        
        if response.status_code == 200:
            listing_data = response.json()
            # Afiş üret
            # ...

# ============================================
# STARTUP
# ============================================

@app.on_event("startup")
async def startup_event():
    print("🚀 Poster Service started")
    # Redis bağlantısı, font yükleme vb.

@app.on_event("shutdown")
async def shutdown_event():
    print("👋 Poster Service shutting down")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

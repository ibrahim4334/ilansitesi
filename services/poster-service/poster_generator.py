"""
Poster Generator - Pillow ile afiş üretimi
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
from typing import Tuple, Optional
import httpx
import io
import os

class PosterGenerator:
    """Afiş üretim sınıfı"""
    
    def __init__(self, template: dict, size: Tuple[int, int]):
        self.template = template
        self.width, self.height = size
        self.fonts_dir = os.path.join(os.path.dirname(__file__), "fonts")
        
    def create(
        self,
        title: str,
        price: Optional[str] = None,
        location: Optional[str] = None,
        image_url: Optional[str] = None,
        watermark: bool = True
    ) -> str:
        """
        Afiş oluştur ve dosya yolunu döndür
        """
        # Canvas oluştur
        canvas = Image.new("RGB", (self.width, self.height), self.template["bg_color"])
        draw = ImageDraw.Draw(canvas)
        
        # Arka plan görseli varsa ekle
        if image_url:
            canvas = self._add_background_image(canvas, image_url)
            draw = ImageDraw.Draw(canvas)
        
        # Gradient overlay
        canvas = self._add_gradient_overlay(canvas)
        draw = ImageDraw.Draw(canvas)
        
        # Başlık
        self._draw_title(draw, title)
        
        # Fiyat
        if price:
            self._draw_price(draw, price)
        
        # Konum
        if location:
            self._draw_location(draw, location)
        
        # Logo/Watermark
        if watermark:
            self._add_watermark(canvas)
        
        # Accent bar
        self._draw_accent_bar(draw)
        
        # Kaydet
        output_path = f"/tmp/poster_{id(self)}.png"
        canvas.save(output_path, "PNG", quality=95)
        
        return output_path
    
    def _load_font(self, size: int) -> ImageFont.FreeTypeFont:
        """Font yükle"""
        font_path = os.path.join(self.fonts_dir, self.template.get("font", "Inter-Bold.ttf"))
        try:
            return ImageFont.truetype(font_path, size)
        except:
            return ImageFont.load_default()
    
    def _add_background_image(self, canvas: Image.Image, image_url: str) -> Image.Image:
        """Arka plan görseli ekle"""
        try:
            response = httpx.get(image_url, timeout=10)
            if response.status_code == 200:
                bg_image = Image.open(io.BytesIO(response.content))
                
                # Resize ve crop (cover mode)
                bg_ratio = bg_image.width / bg_image.height
                canvas_ratio = self.width / self.height
                
                if bg_ratio > canvas_ratio:
                    new_height = self.height
                    new_width = int(new_height * bg_ratio)
                else:
                    new_width = self.width
                    new_height = int(new_width / bg_ratio)
                
                bg_image = bg_image.resize((new_width, new_height), Image.Resampling.LANCZOS)
                
                # Center crop
                left = (new_width - self.width) // 2
                top = (new_height - self.height) // 2
                bg_image = bg_image.crop((left, top, left + self.width, top + self.height))
                
                # Blur efekti
                bg_image = bg_image.filter(ImageFilter.GaussianBlur(radius=3))
                
                canvas.paste(bg_image, (0, 0))
        except Exception as e:
            print(f"Background image error: {e}")
        
        return canvas
    
    def _add_gradient_overlay(self, canvas: Image.Image) -> Image.Image:
        """Gradient overlay ekle"""
        overlay = Image.new("RGBA", (self.width, self.height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)
        
        # Bottom to top gradient
        for y in range(self.height):
            alpha = int(200 * (y / self.height))
            draw.line([(0, y), (self.width, y)], fill=(0, 0, 0, alpha))
        
        canvas = canvas.convert("RGBA")
        canvas = Image.alpha_composite(canvas, overlay)
        return canvas.convert("RGB")
    
    def _draw_title(self, draw: ImageDraw.Draw, title: str):
        """Başlık çiz"""
        font_size = min(self.width // 12, 72)
        font = self._load_font(font_size)
        
        # Word wrap
        words = title.split()
        lines = []
        current_line = ""
        
        for word in words:
            test_line = f"{current_line} {word}".strip()
            bbox = draw.textbbox((0, 0), test_line, font=font)
            if bbox[2] - bbox[0] < self.width - 80:
                current_line = test_line
            else:
                if current_line:
                    lines.append(current_line)
                current_line = word
        if current_line:
            lines.append(current_line)
        
        # Çiz
        y = self.height - 150 - (len(lines) * (font_size + 10))
        for line in lines:
            bbox = draw.textbbox((0, 0), line, font=font)
            x = (self.width - (bbox[2] - bbox[0])) // 2
            draw.text((x, y), line, fill=self.template["text_color"], font=font)
            y += font_size + 10
    
    def _draw_price(self, draw: ImageDraw.Draw, price: str):
        """Fiyat çiz"""
        font_size = min(self.width // 10, 56)
        font = self._load_font(font_size)
        
        bbox = draw.textbbox((0, 0), price, font=font)
        x = (self.width - (bbox[2] - bbox[0])) // 2
        y = self.height - 100
        
        draw.text((x, y), price, fill=self.template["accent_color"], font=font)
    
    def _draw_location(self, draw: ImageDraw.Draw, location: str):
        """Konum çiz"""
        font_size = min(self.width // 20, 28)
        font = self._load_font(font_size)
        
        text = f"📍 {location}"
        bbox = draw.textbbox((0, 0), text, font=font)
        x = (self.width - (bbox[2] - bbox[0])) // 2
        y = 40
        
        draw.text((x, y), text, fill=self.template["text_color"], font=font)
    
    def _draw_accent_bar(self, draw: ImageDraw.Draw):
        """Alt accent bar"""
        bar_height = 8
        draw.rectangle(
            [0, self.height - bar_height, self.width, self.height],
            fill=self.template["accent_color"]
        )
    
    def _add_watermark(self, canvas: Image.Image):
        """Logo/watermark ekle"""
        draw = ImageDraw.Draw(canvas)
        font = self._load_font(18)
        
        text = "umrebuldum.com"
        bbox = draw.textbbox((0, 0), text, font=font)
        x = self.width - (bbox[2] - bbox[0]) - 20
        y = self.height - 35
        
        draw.text((x, y), text, fill="#ffffff80", font=font)

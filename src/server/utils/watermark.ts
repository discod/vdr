interface WatermarkOptions {
  userEmail: string;
  userName: string;
  timestamp: Date;
  ipAddress?: string;
  dataRoomName: string;
  customText?: string;
}

export class WatermarkService {
  private static instance: WatermarkService;

  static getInstance(): WatermarkService {
    if (!WatermarkService.instance) {
      WatermarkService.instance = new WatermarkService();
    }
    return WatermarkService.instance;
  }

  generateWatermarkText(options: WatermarkOptions): string {
    const lines = [
      'CONFIDENTIAL',
      `Viewed by: ${options.userName} (${options.userEmail})`,
      `Data Room: ${options.dataRoomName}`,
      `Date: ${options.timestamp.toLocaleDateString()} ${options.timestamp.toLocaleTimeString()}`,
    ];

    if (options.ipAddress) {
      lines.push(`IP: ${options.ipAddress}`);
    }

    if (options.customText) {
      lines.push(options.customText);
    }

    return lines.join('\n');
  }

  generateWatermarkCSS(options: WatermarkOptions): string {
    const watermarkText = this.generateWatermarkText(options);
    
    return `
      .watermark-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
        overflow: hidden;
      }
      
      .watermark-text {
        position: absolute;
        color: rgba(0, 0, 0, 0.1);
        font-family: Arial, sans-serif;
        font-size: 14px;
        font-weight: bold;
        line-height: 1.4;
        white-space: pre-line;
        transform: rotate(-45deg);
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
      }
      
      .watermark-pattern {
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background-image: repeating-linear-gradient(
          45deg,
          transparent,
          transparent 100px,
          rgba(0, 0, 0, 0.02) 100px,
          rgba(0, 0, 0, 0.02) 200px
        );
      }
    `;
  }

  generateWatermarkHTML(options: WatermarkOptions): string {
    const watermarkText = this.generateWatermarkText(options);
    const css = this.generateWatermarkCSS(options);
    
    return `
      <style>${css}</style>
      <div class="watermark-overlay">
        <div class="watermark-pattern"></div>
        <div class="watermark-text" style="top: 20%; left: 20%;">${watermarkText}</div>
        <div class="watermark-text" style="top: 40%; left: 40%;">${watermarkText}</div>
        <div class="watermark-text" style="top: 60%; left: 60%;">${watermarkText}</div>
        <div class="watermark-text" style="top: 80%; left: 80%;">${watermarkText}</div>
      </div>
    `;
  }

  // For PDF watermarking, you would typically use libraries like:
  // - pdf-lib for client-side PDF manipulation
  // - PDFtk or similar for server-side PDF processing
  // - Canvas API for image watermarking
  
  async applyPDFWatermark(
    pdfBuffer: Buffer, 
    options: WatermarkOptions
  ): Promise<Buffer> {
    try {
      // Import pdf-lib dynamically to avoid bundling issues
      const { PDFDocument, rgb, degrees } = await import('pdf-lib');
      
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pages = pdfDoc.getPages();
      const watermarkText = this.generateWatermarkText(options);
      
      // Apply watermark to each page
      pages.forEach(page => {
        const { width, height } = page.getSize();
        
        // Add diagonal watermark text across the page
        const fontSize = Math.min(width, height) * 0.03; // Responsive font size
        
        // Multiple watermark instances for better coverage
        const positions = [
          { x: width * 0.2, y: height * 0.3, rotation: -45 },
          { x: width * 0.5, y: height * 0.6, rotation: -45 },
          { x: width * 0.8, y: height * 0.2, rotation: -45 },
          { x: width * 0.3, y: height * 0.8, rotation: -45 },
        ];
        
        positions.forEach(pos => {
          page.drawText(watermarkText, {
            x: pos.x,
            y: pos.y,
            size: fontSize,
            color: rgb(0.7, 0.7, 0.7),
            opacity: 0.3,
            rotate: degrees(pos.rotation),
          });
        });
        
        // Add border watermark
        page.drawText('CONFIDENTIAL', {
          x: 50,
          y: height - 30,
          size: 10,
          color: rgb(0.5, 0.5, 0.5),
          opacity: 0.5,
        });
      });
      
      const watermarkedPdf = await pdfDoc.save();
      return Buffer.from(watermarkedPdf);
    } catch (error) {
      console.error('Failed to apply PDF watermark:', error);
      // Return original if watermarking fails
      return pdfBuffer;
    }
  }

  async applyImageWatermark(
    imageBuffer: Buffer,
    options: WatermarkOptions
  ): Promise<Buffer> {
    try {
      // Import sharp dynamically to avoid bundling issues
      const sharp = await import('sharp');
      
      const image = sharp.default(imageBuffer);
      const metadata = await image.metadata();
      const { width = 800, height = 600 } = metadata;
      
      const watermarkText = this.generateWatermarkText(options);
      
      // Create SVG watermark
      const fontSize = Math.min(width, height) * 0.03;
      const watermarkSvg = `
        <svg width="${width}" height="${height}">
          <defs>
            <pattern id="watermark" patternUnits="userSpaceOnUse" width="300" height="200">
              <text x="0" y="100" font-family="Arial" font-size="${fontSize}" 
                    fill="rgba(128,128,128,0.3)" transform="rotate(-45 150 100)">
                ${watermarkText.split('\n')[0]}
              </text>
              <text x="0" y="120" font-family="Arial" font-size="${fontSize * 0.7}" 
                    fill="rgba(128,128,128,0.25)" transform="rotate(-45 150 100)">
                ${options.userName}
              </text>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#watermark)" />
        </svg>
      `;
      
      const watermarkBuffer = Buffer.from(watermarkSvg);
      
      const watermarkedImage = await image
        .composite([{ 
          input: watermarkBuffer, 
          blend: 'overlay' 
        }])
        .toBuffer();
      
      return watermarkedImage;
    } catch (error) {
      console.error('Failed to apply image watermark:', error);
      // Return original if watermarking fails
      return imageBuffer;
    }
  }
}

export const watermarkService = WatermarkService.getInstance();

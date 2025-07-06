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
    // This is a placeholder for PDF watermarking functionality
    // In a real implementation, you would use pdf-lib or similar:
    
    /*
    import { PDFDocument, rgb } from 'pdf-lib';
    
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    const watermarkText = this.generateWatermarkText(options);
    
    pages.forEach(page => {
      const { width, height } = page.getSize();
      page.drawText(watermarkText, {
        x: width / 2,
        y: height / 2,
        size: 12,
        color: rgb(0.8, 0.8, 0.8),
        opacity: 0.3,
        rotate: degrees(-45),
      });
    });
    
    return await pdfDoc.save();
    */
    
    console.log('PDF watermark would be applied with options:', options);
    return pdfBuffer; // Return original for now
  }

  async applyImageWatermark(
    imageBuffer: Buffer,
    options: WatermarkOptions
  ): Promise<Buffer> {
    // This is a placeholder for image watermarking functionality
    // In a real implementation, you would use Sharp, Canvas API, or similar:
    
    /*
    import sharp from 'sharp';
    
    const watermarkSvg = `
      <svg width="200" height="100">
        <text x="10" y="20" font-family="Arial" font-size="12" fill="rgba(0,0,0,0.3)" transform="rotate(-45 100 50)">
          ${this.generateWatermarkText(options)}
        </text>
      </svg>
    `;
    
    const watermarkBuffer = Buffer.from(watermarkSvg);
    
    return await sharp(imageBuffer)
      .composite([{ input: watermarkBuffer, gravity: 'center', blend: 'overlay' }])
      .toBuffer();
    */
    
    console.log('Image watermark would be applied with options:', options);
    return imageBuffer; // Return original for now
  }
}

export const watermarkService = WatermarkService.getInstance();

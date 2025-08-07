/**
 * FileSignatureValidator - Lightweight file type detection using magic numbers
 * 
 * Validates file types by checking their binary signatures (magic numbers)
 * instead of relying on file extensions which can be spoofed.
 * 
 * Size: ~2KB when minified
 */
export class FileSignatureValidator {
  /**
   * File signatures database
   * Each signature contains the bytes to match and the corresponding MIME type
   */
  private static readonly signatures: Array<{
    bytes: number[];
    mime: string;
    offset?: number;
    name?: string;
  }> = [
    // Images
    { bytes: [0xFF, 0xD8, 0xFF], mime: 'image/jpeg', name: 'JPEG' },
    { bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], mime: 'image/png', name: 'PNG' },
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], mime: 'image/gif', name: 'GIF87a' },
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], mime: 'image/gif', name: 'GIF89a' },
    { bytes: [0x52, 0x49, 0x46, 0x46], mime: 'image/webp', offset: 0, name: 'WebP' }, // Needs WEBP check at offset 8
    { bytes: [0x42, 0x4D], mime: 'image/bmp', name: 'BMP' },
    { bytes: [0x00, 0x00, 0x01, 0x00], mime: 'image/x-icon', name: 'ICO' },
    { bytes: [0x49, 0x49, 0x2A, 0x00], mime: 'image/tiff', name: 'TIFF (little-endian)' },
    { bytes: [0x4D, 0x4D, 0x00, 0x2A], mime: 'image/tiff', name: 'TIFF (big-endian)' },
    
    // Documents
    { bytes: [0x25, 0x50, 0x44, 0x46], mime: 'application/pdf', name: 'PDF' }, // %PDF
    { bytes: [0x50, 0x4B, 0x03, 0x04], mime: 'application/zip', name: 'ZIP/DOCX/XLSX' }, // Also covers DOCX, XLSX, PPTX
    { bytes: [0x50, 0x4B, 0x05, 0x06], mime: 'application/zip', name: 'ZIP (empty)' },
    { bytes: [0x50, 0x4B, 0x07, 0x08], mime: 'application/zip', name: 'ZIP (spanned)' },
    { bytes: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1], mime: 'application/vnd.ms-office', name: 'MS Office' }, // Old .doc, .xls, .ppt
    
    // Video
    { bytes: [0x66, 0x74, 0x79, 0x70], mime: 'video/mp4', offset: 4, name: 'MP4' }, // ftyp at offset 4
    { bytes: [0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70], mime: 'video/quicktime', name: 'MOV' },
    { bytes: [0x52, 0x49, 0x46, 0x46], mime: 'video/avi', offset: 0, name: 'AVI' }, // Needs AVI check at offset 8
    { bytes: [0x1A, 0x45, 0xDF, 0xA3], mime: 'video/webm', name: 'WebM' },
    { bytes: [0x00, 0x00, 0x01, 0xBA], mime: 'video/mpeg', name: 'MPEG' },
    { bytes: [0x00, 0x00, 0x01, 0xB3], mime: 'video/mpeg', name: 'MPEG' },
    
    // Audio
    { bytes: [0x49, 0x44, 0x33], mime: 'audio/mpeg', name: 'MP3 with ID3' }, // ID3v2
    { bytes: [0xFF, 0xFB], mime: 'audio/mpeg', name: 'MP3' }, // MP3 without ID3
    { bytes: [0xFF, 0xF3], mime: 'audio/mpeg', name: 'MP3' }, // MP3 without ID3 (protected)
    { bytes: [0xFF, 0xF2], mime: 'audio/mpeg', name: 'MP3' }, // MP3 without ID3 (MPEG-4)
    { bytes: [0x52, 0x49, 0x46, 0x46], mime: 'audio/wav', offset: 0, name: 'WAV' }, // Needs WAVE check at offset 8
    { bytes: [0x4F, 0x67, 0x67, 0x53], mime: 'audio/ogg', name: 'OGG' },
    { bytes: [0x66, 0x4C, 0x61, 0x43], mime: 'audio/flac', name: 'FLAC' },
    { bytes: [0x4D, 0x34, 0x41, 0x20], mime: 'audio/mp4', name: 'M4A' },
    
    // Text (these don't have magic numbers, handled separately)
    // We'll detect these by content analysis or extension
    
    // Archives
    { bytes: [0x52, 0x61, 0x72, 0x21, 0x1A, 0x07], mime: 'application/x-rar-compressed', name: 'RAR' },
    { bytes: [0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C], mime: 'application/x-7z-compressed', name: '7Z' },
    { bytes: [0x1F, 0x8B, 0x08], mime: 'application/gzip', name: 'GZIP' },
    { bytes: [0x42, 0x5A, 0x68], mime: 'application/x-bzip2', name: 'BZIP2' },
  ];

  /**
   * Detect file type from a File object
   * @param file - The file to analyze
   * @returns The detected MIME type or null if unknown
   */
  static async detect(file: File): Promise<string | null> {
    // Read first 64 bytes (enough for most signatures)
    const buffer = await file.slice(0, 64).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    // Check each signature
    for (const sig of this.signatures) {
      const offset = sig.offset || 0;
      
      // Check if we have enough bytes
      if (bytes.length < offset + sig.bytes.length) {
        continue;
      }
      
      // Check if bytes match
      let match = true;
      for (let i = 0; i < sig.bytes.length; i++) {
        if (bytes[offset + i] !== sig.bytes[i]) {
          match = false;
          break;
        }
      }
      
      if (match) {
        // Special handling for RIFF-based formats (WebP, WAV, AVI)
        if (sig.bytes[0] === 0x52 && sig.bytes[1] === 0x49 && sig.bytes[2] === 0x46 && sig.bytes[3] === 0x46) {
          // Check RIFF type at offset 8-11
          if (bytes.length >= 12) {
            const riffType = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
            if (riffType === 'WEBP') return 'image/webp';
            if (riffType === 'WAVE') return 'audio/wav';
            if (riffType.startsWith('AVI')) return 'video/avi';
          }
          continue; // Skip if we can't determine RIFF type
        }
        
        // Special handling for MP4/MOV (check ftyp box)
        if (sig.mime === 'video/mp4' && offset === 4) {
          // Check for various MP4 compatible brands
          const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
          if (['isom', 'iso2', 'mp41', 'mp42', 'M4V ', 'M4A ', 'f4v ', 'f4a '].includes(brand)) {
            return 'video/mp4';
          }
          if (brand === 'qt  ') {
            return 'video/quicktime';
          }
        }
        
        return sig.mime;
      }
    }
    
    // Check for text files (no magic numbers)
    if (this.isProbablyTextFile(file.name, bytes)) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      switch (ext) {
        case 'txt': return 'text/plain';
        case 'csv': return 'text/csv';
        case 'json': return 'application/json';
        case 'xml': return 'application/xml';
        case 'html': return 'text/html';
        case 'css': return 'text/css';
        case 'js': return 'application/javascript';
        case 'ts': return 'application/typescript';
        case 'md': return 'text/markdown';
        default: return 'text/plain';
      }
    }
    
    return null;
  }

  /**
   * Check if file is probably a text file by analyzing content
   * @param filename - The file name
   * @param bytes - First bytes of the file
   * @returns True if likely a text file
   */
  private static isProbablyTextFile(filename: string, bytes: Uint8Array): boolean {
    // Check common text file extensions
    const textExtensions = ['txt', 'csv', 'json', 'xml', 'html', 'css', 'js', 'ts', 'md', 'log', 'ini', 'cfg', 'yml', 'yaml'];
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext && textExtensions.includes(ext)) {
      // Verify it's actually text by checking for non-printable characters
      for (let i = 0; i < Math.min(bytes.length, 64); i++) {
        const byte = bytes[i];
        // Allow printable ASCII, tab, newline, carriage return
        if (byte !== 0 && byte < 0x20 && byte !== 0x09 && byte !== 0x0A && byte !== 0x0D) {
          return false; // Found non-text character
        }
      }
      return true;
    }
    return false;
  }

  /**
   * Get a human-readable name for a MIME type
   * @param mimeType - The MIME type
   * @returns A friendly name for the file type
   */
  static getFriendlyName(mimeType: string): string {
    const mimeToName: Record<string, string> = {
      'image/jpeg': 'JPEG Image',
      'image/png': 'PNG Image',
      'image/gif': 'GIF Image',
      'image/webp': 'WebP Image',
      'image/bmp': 'Bitmap Image',
      'image/tiff': 'TIFF Image',
      'image/x-icon': 'Icon',
      'application/pdf': 'PDF Document',
      'application/zip': 'ZIP Archive',
      'application/vnd.ms-office': 'Microsoft Office Document',
      'video/mp4': 'MP4 Video',
      'video/quicktime': 'QuickTime Video',
      'video/avi': 'AVI Video',
      'video/webm': 'WebM Video',
      'video/mpeg': 'MPEG Video',
      'audio/mpeg': 'MP3 Audio',
      'audio/wav': 'WAV Audio',
      'audio/ogg': 'OGG Audio',
      'audio/flac': 'FLAC Audio',
      'audio/mp4': 'M4A Audio',
      'text/plain': 'Text File',
      'text/csv': 'CSV File',
      'application/json': 'JSON File',
      'application/xml': 'XML File',
      'text/html': 'HTML File',
      'text/css': 'CSS File',
      'application/javascript': 'JavaScript File',
      'application/typescript': 'TypeScript File',
      'text/markdown': 'Markdown File',
    };
    
    return mimeToName[mimeType] || mimeType;
  }

  /**
   * Check if a file type is supported
   * @param file - The file to check
   * @param supportedMimeTypes - Array of supported MIME types
   * @returns Object with validation result
   */
  static async validate(
    file: File, 
    supportedMimeTypes: string[]
  ): Promise<{
    valid: boolean;
    detectedType: string | null;
    message?: string;
  }> {
    const detectedType = await this.detect(file);
    
    if (!detectedType) {
      return {
        valid: false,
        detectedType: null,
        message: `Unknown file type for ${file.name}`
      };
    }
    
    if (!supportedMimeTypes.includes(detectedType)) {
      return {
        valid: false,
        detectedType,
        message: `File type ${this.getFriendlyName(detectedType)} is not supported`
      };
    }
    
    return {
      valid: true,
      detectedType
    };
  }
}
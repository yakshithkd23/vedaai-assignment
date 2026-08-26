'use client';

/**
 * Converts a File (PDF or image) into an array of base64 PNG data URLs, one
 * per page. Images pass through as a single "page". PDFs are rendered
 * client-side with pdfjs-dist onto a <canvas>, which keeps the app free of
 * any server-side native dependencies (no poppler/ghostscript needed), so it
 * deploys cleanly to Vercel or any Node hosting.
 */
export async function fileToPageImages(file: File): Promise<string[]> {
  if (file.type === 'application/pdf') {
    return renderPdfToImages(file);
  }
  if (file.type.startsWith('image/')) {
    return [await fileToDataUrl(file)];
  }
  throw new Error(`Unsupported file type: ${file.type || file.name}`);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function renderPdfToImages(file: File): Promise<string[]> {
  // Dynamic import keeps pdfjs out of the server bundle entirely.
  const pdfjsLib = await import('pdfjs-dist');
  // Use the CDN worker matching the pinned package version so we don't need
  // to fuss with bundler-specific worker asset copying.
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const images: string[] = [];
  const RENDER_SCALE = 2; // upscale for crisper OCR on handwriting/small print

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: RENDER_SCALE });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get canvas context for PDF rendering.');

    await page.render({ canvasContext: context, viewport }).promise;
    images.push(canvas.toDataURL('image/png'));
  }

  return images;
}

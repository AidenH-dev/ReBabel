async function isCapacitorNative() {
  try {
    const { Capacitor } = await import('@capacitor/core');
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export async function downloadPdf(DocumentComponent, props, filename) {
  const { pdf } = await import('@react-pdf/renderer');
  const blob = await pdf(<DocumentComponent {...props} />).toBlob();

  const isNative = await isCapacitorNative();

  // On Capacitor (iOS/Android), use Web Share API to trigger the native share sheet
  // which lets users save to Files, AirDrop, etc.
  if (isNative && navigator.canShare) {
    const file = new File([blob], filename, { type: 'application/pdf' });
    if (navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: filename });
      return;
    }
  }

  // Fallback: standard browser download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

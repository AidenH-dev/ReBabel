export async function downloadPdf(DocumentComponent, props, filename) {
  const { pdf } = await import('@react-pdf/renderer');
  const blob = await pdf(<DocumentComponent {...props} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

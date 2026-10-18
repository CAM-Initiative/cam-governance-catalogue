// Media selection is shared by web, print and static publication.
// A declared MIME type cannot turn a Markdown/text URL into an image.
export function incidentArtefactMediaKind(url, mediaType) {
  if (typeof url !== "string") return undefined;
  let path;
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return undefined;
    path = parsed.pathname.toLowerCase();
  } catch { return undefined; }
  const mime = typeof mediaType === "string" ? mediaType.split(";")[0].trim().toLowerCase() : "";
  if (/\.(png|jpe?g|gif|webp|avif|svg)$/.test(path)) return !mime || mime.startsWith("image/") ? "image" : undefined;
  if (/\.(mp4|webm|og[gv]|m4v|mov)$/.test(path)) return !mime || mime.startsWith("video/") ? "video" : undefined;
  if (/\.pdf$/.test(path)) return !mime || mime === "application/pdf" ? "document" : undefined;
  return undefined;
}

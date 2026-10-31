// L6 (0.9.9): only data:image, blob: or https URLs are used as the Glass background; quotes, brackets and spaces are escaped.
export function safeBgUrl(v) { const u = String(v || ''); return /^(data:image\/(png|jpe?g|webp|gif);base64,|blob:|https:\/\/)/i.test(u) ? u.replace(/["'()\\\s]/g, c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')) : ''; }

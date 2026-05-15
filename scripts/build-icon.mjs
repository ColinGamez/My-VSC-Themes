import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const assetDir = new URL("../assets/", import.meta.url);
const iconPath = new URL("icon.png", assetDir);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="70" y1="40" x2="450" y2="470" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#fa824c"/>
      <stop offset="0.55" stop-color="#381206"/>
      <stop offset="1" stop-color="#00d7ff"/>
    </linearGradient>
    <linearGradient id="bolt" x1="152" y1="82" x2="360" y2="420" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffbf69"/>
      <stop offset="0.52" stop-color="#fa824c"/>
      <stop offset="1" stop-color="#ff4fd8"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="20" flood-color="#120602" flood-opacity="0.45"/>
    </filter>
  </defs>
  <rect width="512" height="512" rx="108" fill="#180602"/>
  <rect x="32" y="32" width="448" height="448" rx="88" fill="url(#bg)" filter="url(#shadow)"/>
  <path d="M151 115h210c27 0 49 22 49 49v184c0 27-22 49-49 49H151c-27 0-49-22-49-49V164c0-27 22-49 49-49Z" fill="#180602" opacity="0.86"/>
  <path d="M171 178l-54 78 54 78h54l-53-78 53-78h-54Z" fill="#ffbf69"/>
  <path d="M341 178l54 78-54 78h-54l53-78-53-78h54Z" fill="#00d7ff"/>
  <path d="M265 154l-58 203h45l58-203h-45Z" fill="url(#bolt)"/>
  <circle cx="384" cy="128" r="20" fill="#ff4fd8"/>
  <circle cx="128" cy="384" r="20" fill="#fa824c"/>
</svg>`;

await mkdir(assetDir, { recursive: true });
await sharp(Buffer.from(svg)).resize(256, 256).png().toFile(fileURLToPath(iconPath));

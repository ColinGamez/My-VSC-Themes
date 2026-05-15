import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const assetDir = new URL("../assets/", import.meta.url);
const iconPath = new URL("icon.png", assetDir);
const logoPath = new URL("logo-mark.png", assetDir);
const bannerPath = new URL("brand-banner.png", assetDir);
const socialPath = new URL("social-preview.png", assetDir);

const markSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
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

const bannerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="520" viewBox="0 0 1400 520">
  <defs>
    <linearGradient id="bannerBg" x1="0" y1="0" x2="1400" y2="520" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#180602"/>
      <stop offset="0.46" stop-color="#281008"/>
      <stop offset="1" stop-color="#06111f"/>
    </linearGradient>
    <radialGradient id="orangeGlow" cx="0" cy="0" r="1" gradientTransform="translate(232 96) rotate(43) scale(460 320)" gradientUnits="userSpaceOnUse">
      <stop stop-color="#fa824c" stop-opacity=".72"/>
      <stop offset="1" stop-color="#fa824c" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="blueGlow" cx="0" cy="0" r="1" gradientTransform="translate(1120 90) rotate(129) scale(430 270)" gradientUnits="userSpaceOnUse">
      <stop stop-color="#00d7ff" stop-opacity=".48"/>
      <stop offset="1" stop-color="#00d7ff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1400" height="520" fill="url(#bannerBg)"/>
  <rect width="1400" height="520" fill="url(#orangeGlow)"/>
  <rect width="1400" height="520" fill="url(#blueGlow)"/>
  <g transform="translate(96 86) scale(.68)">
    ${markSvg.replace(/<svg[^>]*>|<\/svg>/g, "")}
  </g>
  <text x="488" y="200" font-family="Segoe UI, Arial, sans-serif" font-size="70" font-weight="900" fill="#fff4df">Colin's VS Code Themes</text>
  <text x="492" y="276" font-family="Segoe UI, Arial, sans-serif" font-size="30" font-weight="700" fill="#ffbf69">32 themes, file icons, presets, and commands.</text>
  <g font-family="Consolas, Cascadia Code, monospace" font-size="24" font-weight="700">
    <rect x="494" y="342" width="164" height="50" rx="10" fill="#fa824c"/>
    <text x="534" y="375" fill="#180602">orange</text>
    <rect x="676" y="342" width="172" height="50" rx="10" fill="#00d7ff"/>
    <text x="718" y="375" fill="#06111f">icons</text>
    <rect x="866" y="342" width="178" height="50" rx="10" fill="#ff4fd8"/>
    <text x="902" y="375" fill="#180602">presets</text>
    <rect x="1062" y="342" width="196" height="50" rx="10" fill="#ffbf69"/>
    <text x="1100" y="375" fill="#180602">seasonal</text>
  </g>
</svg>`;

await mkdir(assetDir, { recursive: true });
await sharp(Buffer.from(markSvg)).resize(256, 256).png().toFile(fileURLToPath(iconPath));
await sharp(Buffer.from(markSvg)).resize(512, 512).png().toFile(fileURLToPath(logoPath));
await sharp(Buffer.from(bannerSvg)).png().toFile(fileURLToPath(bannerPath));
await sharp(Buffer.from(bannerSvg)).resize(1200, 630).png().toFile(fileURLToPath(socialPath));

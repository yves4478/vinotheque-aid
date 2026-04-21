import sharp from "sharp";
import { mkdir } from "fs/promises";

await mkdir("assets", { recursive: true });

const iconSvg = `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" rx="220" fill="#1a0500"/>
  <text x="512" y="680" font-family="Georgia,serif" font-size="600"
        font-weight="bold" fill="#c8956c" text-anchor="middle">V</text>
</svg>`;

await sharp(Buffer.from(iconSvg)).png().toFile("assets/icon.png");
await sharp(Buffer.from(iconSvg)).png().toFile("assets/adaptive-icon.png");

const splashSvg = `<svg width="2048" height="2048" xmlns="http://www.w3.org/2000/svg">
  <rect width="2048" height="2048" fill="#1a0500"/>
  <text x="1024" y="1100" font-family="Georgia,serif" font-size="800"
        font-weight="bold" fill="#c8956c" text-anchor="middle">V</text>
  <text x="1024" y="1280" font-family="Georgia,serif" font-size="120"
        fill="#c8956c88" text-anchor="middle" letter-spacing="20">VINOTHEQUE</text>
</svg>`;

await sharp(Buffer.from(splashSvg)).png().toFile("assets/splash.png");

console.log("Assets generated.");

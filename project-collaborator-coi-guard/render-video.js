const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const reportsDir = path.join(__dirname, "reports");
const reportPath = path.join(reportsDir, "coi-access-report.json");
const ppmPath = path.join(reportsDir, "summary.ppm");
const mp4Path = path.join(reportsDir, "demo.mp4");

if (!fs.existsSync(reportPath)) {
  throw new Error("Run demo.js before render-video.js");
}

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const width = 960;
const height = 540;
const pixels = Buffer.alloc(width * height * 3);

function rgb(hex) {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16)
  ];
}

function rect(x, y, w, h, color) {
  const [r, g, b] = rgb(color);
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue;
      const i = (yy * width + xx) * 3;
      pixels[i] = r;
      pixels[i + 1] = g;
      pixels[i + 2] = b;
    }
  }
}

rect(0, 0, width, height, "#101827");
rect(48, 145, 250, 185, "#0f766e");
rect(355, 145, 250, 185, "#92400e");
rect(662, 145, 250, 185, "#991b1b");
rect(48, 375, 864, 70, "#1f2937");
rect(70, 188, 40 + report.summary.allow * 52, 70, "#5eead4");
rect(377, 188, 40 + report.summary.stewardReview * 52, 70, "#fde68a");
rect(684, 188, 40 + report.summary.hold * 52, 70, "#fecaca");

fs.writeFileSync(
  ppmPath,
  Buffer.concat([Buffer.from(`P6\n${width} ${height}\n255\n`), pixels])
);

execFileSync("ffmpeg", [
  "-y",
  "-loop",
  "1",
  "-i",
  ppmPath,
  "-vf",
  "format=yuv420p",
  "-t",
  "5",
  "-r",
  "30",
  mp4Path
], { stdio: "inherit" });

console.log(mp4Path);

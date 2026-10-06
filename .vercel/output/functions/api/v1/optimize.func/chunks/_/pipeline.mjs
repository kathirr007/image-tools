import { c as createError } from './nitro.mjs';
import sharp from 'sharp';

const MAX_UPLOAD_BYTES = 45e5;
const ALLOWED_OUTPUT_FORMATS = /* @__PURE__ */ new Set(["jpeg", "png", "webp", "avif"]);
const ALLOWED_FITS = /* @__PURE__ */ new Set(["cover", "contain", "inside", "fill"]);
function parseIntOrUndefined(v) {
  if (v === void 0 || v === null || v === "")
    return void 0;
  const n = Number.parseInt(String(v), 10);
  return Number.isFinite(n) ? n : void 0;
}
function parseOptions(input, opts) {
  var _a, _b, _c, _d;
  const rawFormat = String((_a = input.format) != null ? _a : "original").toLowerCase();
  const format = rawFormat === "original" ? "original" : rawFormat;
  if (format !== "original" && !ALLOWED_OUTPUT_FORMATS.has(format))
    throw createError({ statusCode: 400, statusMessage: `Unsupported format: ${rawFormat}` });
  const qualityRaw = input.quality === void 0 ? opts.defaultQuality : Number(input.quality);
  const quality = Math.round(Number(qualityRaw));
  if (!Number.isFinite(quality) || quality < 10 || quality > 100)
    throw createError({ statusCode: 400, statusMessage: "quality must be 10-100" });
  const width = parseIntOrUndefined(input.width);
  const height = parseIntOrUndefined(input.height);
  if (width !== void 0 && (width < 1 || width > 4e3))
    throw createError({ statusCode: 400, statusMessage: "width must be 1-4000" });
  if (height !== void 0 && (height < 1 || height > 4e3))
    throw createError({ statusCode: 400, statusMessage: "height must be 1-4000" });
  const fit = String((_b = input.fit) != null ? _b : "inside").toLowerCase();
  if (!ALLOWED_FITS.has(fit))
    throw createError({ statusCode: 400, statusMessage: `Unsupported fit: ${fit}` });
  const stripMetadata = String((_c = input.stripMetadata) != null ? _c : "true") !== "false";
  const lossless = String((_d = input.lossless) != null ? _d : "false") === "true";
  return { format, quality, width, height, fit, stripMetadata, lossless };
}
function outputFileName(originalName, format, suffix) {
  var _a, _b;
  const base = (_b = (_a = (originalName != null ? originalName : "image").split("/").pop()) == null ? void 0 : _a.split("\\").pop()) != null ? _b : "image";
  const stem = base.includes(".") ? base.slice(0, base.lastIndexOf(".")) : base;
  const safe = stem.replace(/[^\w.-]+/g, "-").slice(0, 80) || "image";
  return `${safe}-${suffix}.${format}`;
}

function detectInputFormat(meta) {
  var _a;
  return ((_a = meta.format) != null ? _a : "unknown").toLowerCase();
}
async function processImage(input, options) {
  let pipeline = sharp(input, { failOn: "none" }).rotate();
  const meta = await sharp(input).metadata();
  const inputFormat = detectInputFormat(meta);
  let target = options.format === "original" ? inputFormat : options.format;
  if (target === "jpg")
    target = "jpeg";
  if (target === "tiff" || target === "unknown")
    target = "png";
  if (options.width !== void 0 || options.height !== void 0) {
    pipeline = pipeline.resize({
      width: options.width,
      height: options.height,
      fit: options.fit,
      withoutEnlargement: true
    });
  }
  const needsFlatten = target === "jpeg" && (meta.hasAlpha || inputFormat === "png");
  if (needsFlatten)
    pipeline = pipeline.flatten({ background: "#ffffff" });
  if (!options.stripMetadata)
    pipeline = pipeline.keepMetadata();
  switch (target) {
    case "jpeg":
      pipeline = pipeline.jpeg({ quality: options.quality, mozjpeg: true });
      break;
    case "png":
      pipeline = pipeline.png({
        compressionLevel: 9,
        palette: !options.lossless ? true : false
      });
      break;
    case "webp":
      pipeline = pipeline.webp({ quality: options.quality, lossless: options.lossless, effort: 4 });
      break;
    case "avif":
      pipeline = pipeline.avif({ quality: options.quality, lossless: options.lossless, effort: 4 });
      break;
    default:
      throw new Error(`Unsupported target format: ${target}`);
  }
  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  return { data: Buffer.from(data), info, format: target === "jpeg" ? "jpg" : target };
}

export { MAX_UPLOAD_BYTES as M, processImage as a, outputFileName as o, parseOptions as p };
//# sourceMappingURL=pipeline.mjs.map

import { d as defineEventHandler, c as createError, r as readMultipartFormData, s as setResponseHeaders } from '../../../_/nitro.mjs';
import { M as MAX_UPLOAD_BYTES, p as parseOptions, a as processImage, o as outputFileName } from '../../../_/pipeline.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'sharp';

const optimize_post = defineEventHandler(async (event) => {
  var _a, _b;
  if (event.method !== "POST")
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  const parts = await readMultipartFormData(event);
  const filePart = parts == null ? void 0 : parts.find((p) => {
    var _a2;
    return p.name === "image" && ((_a2 = p.data) == null ? void 0 : _a2.length);
  });
  if (!filePart)
    throw createError({ statusCode: 400, statusMessage: 'Missing "image" file field' });
  if (filePart.data.length > MAX_UPLOAD_BYTES)
    throw createError({ statusCode: 413, statusMessage: "File too large for serverless (max ~4.5MB on Vercel Hobby)" });
  const fields = {};
  for (const p of parts != null ? parts : []) {
    if (!p.name || p.name === "image" || p.data === void 0)
      continue;
    fields[p.name] = p.data.toString("utf8");
  }
  const options = parseOptions(fields, { defaultQuality: 80 });
  let result;
  try {
    result = await processImage(Buffer.from(filePart.data), options);
  } catch (err) {
    throw createError({ statusCode: 422, statusMessage: `Could not process image: ${err.message}` });
  }
  const originalSize = filePart.data.length;
  const optimizedSize = result.data.length;
  const savings = originalSize > 0 ? Math.round((1 - optimizedSize / originalSize) * 1e3) / 10 : 0;
  const downloadName = outputFileName(filePart.filename, result.format, "optimized");
  setResponseHeaders(event, {
    "Content-Type": `image/${result.format === "jpg" ? "jpeg" : result.format}`,
    "Content-Disposition": `attachment; filename="${downloadName}"`,
    "X-Original-Size": String(originalSize),
    "X-Optimized-Size": String(optimizedSize),
    "X-Savings-Percent": String(savings),
    "X-Output-Format": result.format,
    "X-Output-Width": String((_a = result.info.width) != null ? _a : ""),
    "X-Output-Height": String((_b = result.info.height) != null ? _b : "")
  });
  return result.data;
});

export { optimize_post as default };
//# sourceMappingURL=optimize.post.mjs.map

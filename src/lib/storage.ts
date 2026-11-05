import https from "https";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ufwokmxbnjiwwqktwliv.supabase.co";

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_-l5Y1hDMkOAr7VfFnCTM4A_dHlvNWqu";

export const BUCKET_NAME = "documents";

/**
 * Uploads a Buffer directly to Supabase Storage Bucket and returns the public CDN URL.
 * Uses native https with 60s timeout to safely handle multi-megabyte files across international CDNs.
 */
export async function uploadBufferToSupabase(
  buffer: Buffer,
  mimeType: string,
  filePath: string,
  retries = 2
): Promise<string> {
  const cleanPath = filePath.replace(/^\/+/, "");

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await new Promise<string>((resolve, reject) => {
        const url = new URL(
          `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${cleanPath}`
        );

        const req = https.request(
          url,
          {
            method: "POST",
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
              "Content-Type": mimeType || "image/jpeg",
              "x-upsert": "true",
              "Content-Length": buffer.length,
            },
            timeout: 60000,
          },
          (res) => {
            let body = "";
            res.on("data", (chunk) => (body += chunk));
            res.on("end", () => {
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                resolve(
                  `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${cleanPath}`
                );
              } else {
                reject(
                  new Error(
                    `Supabase storage error [${res.statusCode}]: ${body}`
                  )
                );
              }
            });
          }
        );

        req.on("timeout", () => {
          req.destroy();
          reject(new Error("Supabase Storage upload timeout"));
        });

        req.on("error", reject);
        req.write(buffer);
        req.end();
      });
    } catch (err: any) {
      if (attempt < retries) {
        console.warn(
          `Storage upload retry ${attempt + 1}/${retries} for ${cleanPath}: ${err.message}`
        );
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      } else {
        throw err;
      }
    }
  }

  throw new Error("Upload failed after retries");
}

/**
 * Uploads a base64 Data URL (e.g. data:image/jpeg;base64,...) to Supabase Storage.
 * If already a CDN URL (starts with http), returns it untouched.
 */
export async function uploadBase64ToSupabase(
  base64Str: string,
  filePath: string
): Promise<string> {
  if (!base64Str || typeof base64Str !== "string") {
    return "";
  }

  // Already a hosted URL (CDN or Supabase Storage)
  if (base64Str.startsWith("http://") || base64Str.startsWith("https://")) {
    return base64Str;
  }

  let mimeType = "image/jpeg";
  let extension = "jpg";
  let base64Data = base64Str;

  if (base64Str.startsWith("data:")) {
    const matches = base64Str.match(/^data:([a-zA-Z0-9\/+-]+);base64,(.+)$/);
    if (matches) {
      mimeType = matches[1];
      base64Data = matches[2];

      if (mimeType.includes("png")) extension = "png";
      else if (mimeType.includes("webp")) extension = "webp";
      else if (mimeType.includes("gif")) extension = "gif";
      else if (mimeType.includes("pdf")) extension = "pdf";
      else extension = "jpg";
    }
  }

  // Append extension if not already present
  const hasExt = /\.[a-zA-Z0-9]{3,4}$/.test(filePath);
  const finalPath = hasExt ? filePath : `${filePath}.${extension}`;

  const buffer = Buffer.from(base64Data, "base64");
  return uploadBufferToSupabase(buffer, mimeType, finalPath);
}

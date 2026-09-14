import sharp from "sharp";

export const MAX_IMAGE_INPUT_BYTES = 20 * 1024 * 1024;
export const MAX_IMAGE_OUTPUT_BYTES = 500 * 1024;
export const IMAGE_PRESETS = {
  listing: { width: 1200, height: 800 },
  square: { width: 512, height: 512 },
} as const;
export type ImagePreset = keyof typeof IMAGE_PRESETS;

const invalidImage = (message: string) => Object.assign(new Error(message), { status: 400 });

// Gallery uploads can arrive together. Bound concurrent image decoding memory.
let active = 0;
const waiting: Array<() => void> = [];

export async function normalizeImage(input: Buffer, preset: ImagePreset = "listing"): Promise<Buffer> {
  if (input.length > MAX_IMAGE_INPUT_BYTES) throw invalidImage("Maximum image size is 20MB.");
  if (active >= 2) await new Promise<void>((resolve) => waiting.push(resolve));
  else active++;
  try {
    const image = sharp(input, { limitInputPixels: 40_000_000, failOn: "warning" });
    const metadata = await image.metadata();
    if (!["jpeg", "png", "webp"].includes(metadata.format || "") || (metadata.pages || 1) > 1) {
      throw invalidImage("Choose a static JPEG, PNG, or WEBP image.");
    }
    const { width, height } = IMAGE_PRESETS[preset];
    const resized = image.rotate().resize(width, height, {
      fit: "contain",
      background: preset === "square" ? { r: 255, g: 255, b: 255, alpha: 0 } : "#ffffff",
    });
    for (const quality of [82, 70, 55, 40]) {
      const output = await resized.clone().webp({ quality, effort: 4 }).toBuffer();
      if (output.length <= MAX_IMAGE_OUTPUT_BYTES) return output;
    }
    throw invalidImage("This image could not be compressed. Please choose another image.");
  } catch (error: any) {
    if (error?.status) throw error;
    throw invalidImage("The image is damaged or exceeds the 40-megapixel limit. Choose another image.");
  } finally {
    const next = waiting.shift();
    if (next) next();
    else active--;
  }
}

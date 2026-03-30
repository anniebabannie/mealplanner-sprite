import type { Route } from "./+types/api.generate-image";
import OpenAI from "openai";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import sharp from "sharp";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const { title } = await request.json();
  if (!title || typeof title !== "string") {
    return Response.json({ error: "Title is required" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }

  const bucket = process.env.TIGRIS_BUCKET;
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  if (!bucket || !endpoint) {
    return Response.json({ error: "Tigris storage not configured" }, { status: 500 });
  }

  // Generate image
  const client = new OpenAI({ apiKey });

  const drinkKeywords = /\b(drink|drinks|smoothie|smoothies|juice|juices|shake|shakes|cocktail|cocktails|mocktail|mocktails|latte|lattes|coffee|espresso|tea|lemonade|soda|water|beer|wine|spirits|liquor|punch|brew|frappe|milkshake)\b/i;
  const isDrink = drinkKeywords.test(title);

  const prompt = isDrink
    ? `Professional beverage photography of ONLY ${title} and nothing else. The glass or cup contains strictly and exclusively ${title} — no extra garnishes, food items, or props not part of the description. Shot from a slight side angle, clean minimal background, natural daylight, photorealistic, ultra-detailed textures, no text, no watermarks.`
    : `Overhead food photography of ONLY ${title} and nothing else. The plate contains strictly and exclusively ${title} — no additional sides, garnishes, sauces, or extra food items that are not part of the description. Shot from directly above, professional restaurant plating, natural daylight, photorealistic, ultra-detailed textures, no text, no watermarks.`;

  let response;
  try {
    response = await client.images.generate({
    model: "gpt-image-1.5",
    prompt,
    n: 1,
    size: "1024x1536",
    quality: "high",
    });
  } catch (e: any) {
    return Response.json({ error: `Image generation error: ${e.error?.message ?? e.message ?? "unknown"}` }, { status: 500 });
  }

  const b64 = response.data[0]?.b64_json;
  if (!b64) {
    return Response.json({ error: "Failed to generate image" }, { status: 500 });
  }

  const resized = await sharp(Buffer.from(b64, "base64"))
    .resize(512, 768)
    .png()
    .toBuffer();

  // Upload to Tigris
  const s3 = new S3Client({
    region: process.env.AWS_REGION ?? "auto",
    endpoint,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  const key = `dishes/${randomUUID()}.png`;
  try {
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: resized,
      ContentType: "image/png",
    }));
  } catch (e: any) {
    return Response.json({ error: `Storage error: ${e.message ?? e.Code ?? "unknown"}` }, { status: 500 });
  }

  const imageUrl = `https://${bucket}.t3.tigrisfiles.io/${key}`;
  return Response.json({ imageUrl });
}

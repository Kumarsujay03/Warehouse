import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    return NextResponse.json({ data: [] });
  }

  try {
    const auth = Buffer.from(`${API_KEY}:${API_SECRET}`).toString("base64");

    // Use Search API with asset_folder (for DAM/dynamic folder mode)
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          expression: `asset_folder="avatars"`,
          max_results: 20,
          sort_by: [{ field: "created_at", direction: "desc" }],
        }),
      }
    );

    if (!res.ok) {
      // Fallback: list all images and filter by asset_folder
      const fallbackRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image?type=upload&max_results=100`,
        { headers: { Authorization: `Basic ${auth}` } }
      );

      if (!fallbackRes.ok) {
        return NextResponse.json({ data: [] });
      }

      const fallbackData = await fallbackRes.json();
      const avatars = (fallbackData.resources || []).filter(
        (r: Record<string, unknown>) => r.asset_folder === "avatars"
      );
      return NextResponse.json({ data: avatars });
    }

    const data = await res.json();
    return NextResponse.json({ data: data.resources || [] });
  } catch (err) {
    console.error("Avatars error:", err);
    return NextResponse.json({ data: [] });
  }
}

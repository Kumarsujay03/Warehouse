import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";
import { uploadToCloudinary } from "@/lib/cloudinary";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const folder = searchParams.get("folder") || "Assests_warehouse";
  const postId = searchParams.get("post_id");

  // If requesting media for a specific post, fetch from Supabase directly
  if (postId) {
    const supabase = await createServiceRoleClient();
    const { data } = await supabase
      .from("media")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: false });
    return NextResponse.json({ data: data || [] });
  }

  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    return NextResponse.json({ data: [], error: "Cloudinary not configured" });
  }

  try {
    const auth = Buffer.from(`${API_KEY}:${API_SECRET}`).toString("base64");

    // Use Search API with asset_folder (works with DAM/dynamic folders)
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          expression: `asset_folder="${folder}"`,
          max_results: 50,
          sort_by: [{ field: "created_at", direction: "desc" }],
        }),
      }
    );

    if (!res.ok) {
      // Fallback: list all and filter client-side
      const fallbackRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image?type=upload&max_results=100`,
        { headers: { Authorization: `Basic ${auth}` } }
      );

      if (!fallbackRes.ok) {
        return NextResponse.json({ data: [] });
      }

      const fallbackData = await fallbackRes.json();
      const filtered = (fallbackData.resources || []).filter(
        (r: Record<string, unknown>) => r.asset_folder === folder
      );
      const mapped = filtered.map((r: Record<string, unknown>) => ({
        id: r.public_id as string,
        public_id: r.public_id as string,
        url: r.secure_url as string,
        format: r.format as string,
        resource_type: (r.resource_type as string) || "image",
        bytes: (r.bytes as number) || 0,
        width: (r.width as number) || null,
        height: (r.height as number) || null,
        folder,
        created_at: r.created_at as string,
      }));
      return NextResponse.json({ data: mapped });
    }

    const data = await res.json();
    const mapped = (data.resources || []).map((r: Record<string, unknown>) => ({
      id: r.public_id as string,
      public_id: r.public_id as string,
      url: r.secure_url as string,
      format: r.format as string,
      resource_type: (r.resource_type as string) || "image",
      bytes: (r.bytes as number) || 0,
      width: (r.width as number) || null,
      height: (r.height as number) || null,
      folder,
      created_at: r.created_at as string,
    }));

    return NextResponse.json({ data: mapped });
  } catch (err) {
    return NextResponse.json({
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch",
    });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const folder = (formData.get("folder") as string) || "Assests_warehouse";
  const postId = formData.get("post_id") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  try {
    const result = await uploadToCloudinary(file, folder);

    // Also track in Supabase media table
    const supabase = await createServiceRoleClient();
    const { data: mediaRow } = await supabase.from("media").insert({
      public_id: result.public_id,
      url: result.secure_url,
      format: result.format,
      resource_type: result.resource_type,
      bytes: result.bytes,
      width: result.width || null,
      height: result.height || null,
      folder,
      post_id: postId || null,
    }).select().single();

    return NextResponse.json({
      data: {
        id: mediaRow?.id || result.public_id,
        public_id: result.public_id,
        url: result.secure_url,
        format: result.format,
        resource_type: result.resource_type,
        bytes: result.bytes,
        width: result.width || null,
        height: result.height || null,
        folder,
        post_id: postId || null,
      },
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}

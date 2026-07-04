import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";
import { deleteCloudinaryResource } from "@/lib/cloudinary";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;

  // The id could be a UUID (from supabase) or a public_id (from cloudinary)
  // Try to get from supabase first
  const supabase = await createServiceRoleClient();
  const { data: media } = await supabase
    .from("media")
    .select("public_id, resource_type")
    .eq("id", id)
    .single();

  const publicId = media?.public_id || decodeURIComponent(id);
  const resourceType = media?.resource_type || "image";

  // Delete from Cloudinary
  try {
    await deleteCloudinaryResource(publicId, resourceType);
  } catch {
    // Continue even if Cloudinary deletion fails
  }

  // Delete from database if it exists there
  if (media) {
    await supabase.from("media").delete().eq("id", id);
  }

  return NextResponse.json({ success: true });
}

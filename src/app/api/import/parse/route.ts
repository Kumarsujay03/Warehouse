import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

/**
 * Parser for content plans. Supports multiple formats:
 * 
 * 1. Combined plan (posts with nested resources array + hook)
 * 2. Flat post array (title, category, status, etc.)
 * 3. Weekly resources (grouped by week with nested resources)
 * 4. HTML tables
 * 5. Markdown headings
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const content = await file.text();
  const filename = file.name.toLowerCase();

  try {
    let parsed;
    if (filename.endsWith(".json")) {
      parsed = parseJSON(content);
    } else if (filename.endsWith(".md")) {
      parsed = parseMarkdown(content);
    } else {
      parsed = parseHTML(content);
    }

    return NextResponse.json({ data: parsed });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Parse failed" },
      { status: 400 }
    );
  }
}

interface ParsedPost {
  title: string;
  category: string;
  status: string;
  publish_date: string;
  goal: string;
  hook: string;
  resource_url: string;
  resource_type: string;
  resources: Array<{ type: string; title: string; url: string }>;
}

function parseJSON(content: string): ParsedPost[] {
  const data = JSON.parse(content);
  const items = Array.isArray(data) ? data : data.posts || data.items || [];

  if (items.length === 0) return [];

  // Detect format: combined plan (has "resources" array + "hook")
  if (items[0].resources && Array.isArray(items[0].resources) && items[0].title) {
    return items.map((item: Record<string, unknown>) => ({
      title: (item.title as string) || "Untitled",
      category: (item.category as string) || (item.week_theme as string) || "",
      status: (item.status as string) || "draft",
      publish_date: (item.publish_date as string) || "",
      goal: (item.goal as string) || "",
      hook: (item.hook as string) || "",
      resource_url: (item.resources as Array<Record<string, string>>)?.[0]?.url || "",
      resource_type: (item.resources as Array<Record<string, string>>)?.[0]?.type || "",
      resources: ((item.resources as Array<Record<string, string>>) || []).map((r) => ({
        type: r.type || "article",
        title: r.title || "",
        url: r.url || "",
      })),
    }));
  }

  // Detect: weekly resources format (has "resources" but no "title" at top level)
  if (items[0].resources && Array.isArray(items[0].resources) && !items[0].title) {
    const flattened: ParsedPost[] = [];
    for (const week of items) {
      const theme = (week.theme as string) || "";
      for (const res of (week.resources as Array<Record<string, string>>) || []) {
        flattened.push({
          title: res.title || "Untitled",
          category: theme,
          status: "draft",
          publish_date: "",
          goal: res.time || res.read_time || "",
          hook: "",
          resource_url: res.url || "",
          resource_type: res.type || guessResourceType(res.url || ""),
          resources: [],
        });
      }
    }
    return flattened;
  }

  // Standard flat array
  return items.map((item: Record<string, string>) => ({
    title: item.title || "Untitled",
    category: item.category || "",
    status: item.status || "draft",
    publish_date: item.publish_date || item.date || "",
    goal: item.goal || "",
    hook: item.hook || "",
    resource_url: item.resource_url || item.url || item.link || "",
    resource_type: item.resource_type || guessResourceType(item.resource_url || item.url || ""),
    resources: [],
  }));
}

function parseHTML(content: string): ParsedPost[] {
  const results: ParsedPost[] = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  const tagStripRegex = /<[^>]*>/g;
  const hrefRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/i;

  let rowMatch;
  let isFirstRow = true;

  while ((rowMatch = rowRegex.exec(content)) !== null) {
    const rowContent = rowMatch[1];
    if (isFirstRow && (rowContent.includes("<th") || rowContent.includes("<TH"))) {
      isFirstRow = false;
      continue;
    }
    isFirstRow = false;

    const cells: string[] = [];
    const cellsRaw: string[] = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      cellsRaw.push(cellMatch[1]);
      cells.push(cellMatch[1].replace(tagStripRegex, "").trim());
    }
    cellRegex.lastIndex = 0;

    if (cells.length >= 1) {
      let resourceUrl = "";
      for (const raw of cellsRaw) {
        const hrefMatch = hrefRegex.exec(raw);
        if (hrefMatch) { resourceUrl = hrefMatch[1]; break; }
      }
      if (!resourceUrl && cells.length > 5 && cells[5]?.startsWith("http")) {
        resourceUrl = cells[5];
      }

      results.push({
        title: cells[0] || "Untitled",
        category: cells[1] || "",
        status: cells[2] || "draft",
        publish_date: cells[3] || "",
        goal: cells[4] || "",
        hook: "",
        resource_url: resourceUrl,
        resource_type: guessResourceType(resourceUrl),
        resources: [],
      });
    }
  }

  if (results.length === 0) {
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let liMatch;
    while ((liMatch = liRegex.exec(content)) !== null) {
      const raw = liMatch[1];
      const text = raw.replace(/<[^>]*>/g, "").trim();
      const hrefMatch = hrefRegex.exec(raw);
      if (text) {
        results.push({
          title: text, category: "", status: "draft", publish_date: "", goal: "", hook: "",
          resource_url: hrefMatch ? hrefMatch[1] : "",
          resource_type: hrefMatch ? guessResourceType(hrefMatch[1]) : "",
          resources: [],
        });
      }
    }
  }

  return results;
}

function parseMarkdown(content: string): ParsedPost[] {
  const results: ParsedPost[] = [];
  const lines = content.split("\n");
  let currentTitle = "";
  let currentUrl = "";

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.+)/);
    if (headingMatch) {
      if (currentTitle) {
        results.push({
          title: currentTitle, category: "", status: "draft", publish_date: "", goal: "", hook: "",
          resource_url: currentUrl, resource_type: guessResourceType(currentUrl), resources: [],
        });
      }
      currentTitle = headingMatch[1].trim();
      currentUrl = "";
    }
    const urlMatch = line.match(/https?:\/\/[^\s)]+/);
    if (urlMatch && !currentUrl) currentUrl = urlMatch[0];
  }

  if (currentTitle) {
    results.push({
      title: currentTitle, category: "", status: "draft", publish_date: "", goal: "", hook: "",
      resource_url: currentUrl, resource_type: guessResourceType(currentUrl), resources: [],
    });
  }

  return results;
}

function guessResourceType(url: string): string {
  if (!url) return "";
  const lower = url.toLowerCase();
  if (lower.includes("youtube") || lower.includes("vimeo") || lower.includes("youtu.be")) return "video";
  if (lower.includes("arxiv") || lower.includes("paper") || lower.includes("doi.org")) return "paper";
  if (lower.includes("udemy") || lower.includes("coursera") || lower.includes("course")) return "course";
  if (lower.includes("book") || lower.includes("amazon.com/dp")) return "book";
  return "article";
}

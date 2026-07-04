// Database row types

export interface User {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  must_change_password: boolean;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  title: string;
  category: string;
  status: "idea" | "draft" | "ready" | "scheduled" | "published" | "archived";
  publish_date: string | null;
  goal: string | null;
  hook: string | null;
  body: string | null;
  notes: string | null;
  resource_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Resource {
  id: string;
  title: string;
  type: "paper" | "video" | "book" | "article" | "course";
  url: string | null;
  author: string | null;
  description: string | null;
  notes: string | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Media {
  id: string;
  public_id: string;
  url: string;
  format: string;
  resource_type: string;
  bytes: number;
  width: number | null;
  height: number | null;
  folder: string;
  post_id: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  status: "active" | "completed" | "paused" | "archived";
  url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export interface PostTag {
  post_id: string;
  tag_id: string;
}

export interface Import {
  id: string;
  filename: string;
  format: string;
  status: "pending" | "processing" | "completed" | "failed";
  records_imported: number;
  errors: string | null;
  created_at: string;
}

export interface Settings {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}

// UI/Form types

export interface PostFormData {
  title: string;
  category: string;
  status: Post["status"];
  publish_date: string;
  goal: string;
  hook: string;
  body: string;
  notes: string;
  resource_id: string;
  tags: string[];
}

export interface ResourceFormData {
  title: string;
  type: Resource["type"];
  url: string;
  author: string;
  description: string;
  notes: string;
  project_id: string;
}

export interface ProjectFormData {
  title: string;
  description: string;
  status: Project["status"];
  url: string;
}

export type SearchResult = {
  type: "post" | "resource" | "project" | "media" | "tag";
  id: string;
  title: string;
  subtitle?: string;
};

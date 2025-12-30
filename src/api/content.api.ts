import { api } from "@/api/axios";

export async function getContentList() {
  const res = await api.get("/admin/content");
  return res.data;
}

export async function createContent(payload: any) {
  const res = await api.post("/admin/content", payload);
  return res.data;
}

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import type { Paginated, Capsule } from "@/api/Content/types";
import { educationGetById, educationSearch } from "@/api/Content/Content.api";
import { isProbablyMongoId } from "@/pages/Content/utils/contentForm";

export function useContentQuery(params: { text: string; idFilter: string; page: number; limit: number }) {
  const { text, idFilter, page, limit } = params;

  return useQuery<Paginated<Capsule>>({
    queryKey: ["education.search", { text, idFilter, page, limit }],
    queryFn: async () => {
      const id = idFilter.trim();
      if (id && isProbablyMongoId(id)) {
        const one = await educationGetById(id);
        return { data: [one], meta: { total: 1, page: 1, limit, pages: 1 } };
      }
      return educationSearch({ text, page, limit });
    },
    retry: 0,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
    throwOnError: false,
    // React Query v5 ya no recomienda onError para side effects repetidos,
    // pero aquí con retry:0 y UI controlada, funciona bien.
    onError: () => toast.error("No se pudo cargar el contenido. Revisa baseURL/token."),
  });
}

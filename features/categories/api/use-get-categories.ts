import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/hono";

export const useGetCategories = () => {
  const query = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await client.api.categories.$get();

      // This is the best way to catch an error using hono api, we can use try catch block because we're not working with fetch and axios
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};

// Re-usable hook

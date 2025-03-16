import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/hono";

export const useGetAccount = (id?: string) => {
  const query = useQuery({
    enabled: !!id, // ensures that this query only run if the id is available
    queryKey: ["account", { id }],
    queryFn: async () => {
      const response = await client.api.accounts[":id"].$get({ param: { id } });

      // This is the best way to catch an error using hono api, we can use try catch block because we're not working with fetch and axios
      if (!response.ok) {
        throw new Error("Failed to fetch account");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};

// Re-usable hook

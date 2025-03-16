import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/hono";
import { convertAmountFromMiliunits } from "@/lib/utils";

export const useGetTransaction = (id?: string) => {
  const query = useQuery({
    enabled: !!id, // ensures that this query only run if the id is available
    queryKey: ["transaction", { id }],
    queryFn: async () => {
      const response = await client.api.transactions[":id"].$get({
        param: { id },
      });

      // This is the best way to catch an error using hono api, we can use try catch block because we're not working with fetch and axios
      if (!response.ok) {
        throw new Error("Failed to fetch transaction");
      }

      const { data } = await response.json();

      return {
        ...data,
        amount: convertAmountFromMiliunits(data.amount),
      };
    },
  });

  return query;
};

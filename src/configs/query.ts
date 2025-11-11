import { MutationCache, QueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const mutationCache = new MutationCache({
  onSuccess: () => {},
  onError: (error: any) => {
    toast.error(error.message);
  },
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: 24 * 60 * 60 * 1000,
    },
  },
  mutationCache,
});

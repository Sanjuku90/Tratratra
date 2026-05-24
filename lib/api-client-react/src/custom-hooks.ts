import { useMutation } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export function useClosePosition() {
  return useMutation({
    mutationFn: (id: number) =>
      customFetch<{ pnl: number; closedPrice: number }>(`/api/trades/position/${id}/close`, {
        method: "POST",
      }),
  });
}

export function useResetDemo() {
  return useMutation({
    mutationFn: () =>
      customFetch<{ demoBalance: number }>("/api/account/reset-demo", {
        method: "POST",
      }),
  });
}

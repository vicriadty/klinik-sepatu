import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelOrder,
  changeOrderStatus,
  fetchOrder,
  fetchOrders,
  type OrderListParams,
  type OrderStatus,
} from "../../services/orderApi";

export function useOrdersList(params: OrderListParams) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => fetchOrders(params),
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => fetchOrder(id ?? ""),
    enabled: id !== undefined && id !== "",
  });
}

export function useChangeOrderStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ status, note }: { status: OrderStatus; note?: string }) =>
      changeOrderStatus(id, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useCancelOrder(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason?: string) => cancelOrder(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

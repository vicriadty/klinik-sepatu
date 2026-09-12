import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCategory,
  createService,
  deleteCategory,
  deleteService,
  fetchCategories,
  fetchService,
  fetchServices,
  setServiceActive,
  updateService,
  type CategoryPayload,
  type ServiceListParams,
  type ServicePayload,
} from "../../services/serviceApi";

export function useServiceCategories() {
  return useQuery({
    queryKey: ["service-categories"],
    queryFn: fetchCategories,
  });
}

export function useServices(params: ServiceListParams) {
  return useQuery({
    queryKey: ["services", params],
    queryFn: () => fetchServices(params),
  });
}

export function useService(id: string | undefined) {
  return useQuery({
    queryKey: ["services", id],
    queryFn: () => fetchService(id ?? ""),
    enabled: id !== undefined && id !== "",
  });
}

function useInvalidateCatalog() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["services"] });
    queryClient.invalidateQueries({ queryKey: ["service-categories"] });
  };
}

export function useCreateService() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (payload: ServicePayload) => createService(payload),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateService(id: string) {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (payload: Partial<ServicePayload>) =>
      updateService(id, payload),
    onSuccess: () => invalidate(),
  });
}

export function useSetServiceActive() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      setServiceActive(id, active),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteService() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (id: number) => deleteService(id),
    onSuccess: () => invalidate(),
  });
}

export function useCreateCategory() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (payload: CategoryPayload) => createCategory(payload),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteCategory() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => invalidate(),
  });
}

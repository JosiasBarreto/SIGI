import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as services from '../services';

// Reusable hook generator
function createHooks(serviceKey: keyof typeof services, queryKeyBase: string) {
  const service = services[serviceKey] as any;

  return {
    useGetAll: (params?: services.BaseServiceParams) => 
      useQuery({
        queryKey: [queryKeyBase, params],
        // Adapt response if we need array compatibility for components expecting just plain arrays
        queryFn: async () => {
          const res = await service.getAll(params);
          // Attach full paginated data, but if old component accesses .data, it might break. 
          // Since we can't break existing components immediately, we can return the array directly 
          // and attach pagination metadata to it, or return the PaginatedResponse wrapper.
          // For transition safety, returning the array but tacking on pagination as a prop:
          const arr = res.data || [];
          (arr as any).pagination = res.pagination;
          return arr;
        }
      }),

    useGetById: (id: string, enabled = true) =>
      useQuery({
        queryKey: [queryKeyBase, id],
        queryFn: () => service.getById(id),
        enabled: !!id && enabled
      }),

    useCreate: () => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (item: any) => service.create(item),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKeyBase] })
      });
    },

    useUpdate: () => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ id, item }: { id: string, item: any }) => service.update(id, item),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKeyBase] })
      });
    },

    useDelete: () => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (id: string) => service.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKeyBase] })
      });
    }
  };
}

export const useUsers = createHooks('userService', 'users');
export const useProducts = createHooks('productService', 'products');
export const useIngredients = createHooks('ingredientService', 'ingredients');
export const useMaterials = createHooks('materialService', 'materials');
export const useOrders = createHooks('orderService', 'orders');
export const useEvents = createHooks('eventService', 'events');
export const useWarehouse = createHooks('warehouseService', 'warehouse');
export const useProduction = createHooks('productionService', 'production');
export const useFinancial = createHooks('financialService', 'financial');
export const useClients = createHooks('clientService', 'clients');
export const useRequests = createHooks('requestService', 'requests');

export function useDashboardStats() {
   return useQuery({
     queryKey: ['dashboard', 'stats'],
     queryFn: () => services.dashboardService.getStats()
   });
}

export * from './useComercial';

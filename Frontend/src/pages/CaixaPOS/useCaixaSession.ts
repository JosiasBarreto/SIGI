import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { financialService } from "../../services";

export function useCaixaSession() {
  const queryClient = useQueryClient();

  const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const userId = currentUser?.id || currentUser?.email || "anonymous";

  const { data: openCaixa = null, isLoading: isLoadingCaixas } = useQuery({
    queryKey: ["minha-sessao-caixa", userId],
    queryFn: () => financialService.getMinhaSessao(),
    staleTime: 1000 * 30, // 30s
  });

  const caixaId = openCaixa?.id || null;

  const abrirMutation = useMutation({
    mutationFn: (valor: number) => financialService.abrir(valor),
    onSuccess: (caixa) => {
      // The API has already created the session. Update this operator's cache
      // immediately instead of waiting for a refetch before enabling the POS.
      queryClient.setQueryData(["minha-sessao-caixa", userId], caixa);
      queryClient.invalidateQueries({ queryKey: ["caixas"] });
      toast.success("Fundo de maneio registado com sucesso. Caixa aberto.");
    },
    onError: (err: any) => {
      if (err?.status === 409 || err?.response?.status === 409) {
        queryClient.invalidateQueries({ queryKey: ["minha-sessao-caixa"] });
        toast.info("A sua sessão de caixa já se encontra aberta.");
      } else {
        toast.error(err?.message || "Erro ao abrir o caixa.");
      }
    }
  });

  const fecharMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: any }) =>
      financialService.fechar(id, payload),
    onSuccess: () => {
      queryClient.setQueryData(["minha-sessao-caixa", userId], null);
      queryClient.invalidateQueries({ queryKey: ["caixas"] });
      toast.success("O turno de caixa foi encerrado com sucesso.");
    },
    onError: (err: any) => {
      if (err?.status === 404 || err?.response?.status === 404) {
        queryClient.invalidateQueries({ queryKey: ["minha-sessao-caixa"] });
        toast.error("Sessão de caixa não encontrada.");
      } else {
        toast.error(err?.message || "Erro ao fechar caixa.");
      }
    },
  });

  const movimentoMutation = useMutation({
    mutationFn: ({ tipo, valor, descricao, forma_pagamento = "Dinheiro" }: { tipo: string; valor: number; descricao?: string; forma_pagamento?: string }) => {
      if (!caixaId) throw new Error("Não existe uma sessão de caixa aberta para registar movimentos.");
      return financialService.movimento(String(caixaId), tipo, valor, descricao || tipo, forma_pagamento);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["minha-sessao-caixa"] });
      queryClient.invalidateQueries({ queryKey: ["caixas"] });
      toast.success("Movimento de caixa registado.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao registar movimento.");
    }
  });

  return {
    openCaixa,
    caixaId,
    isCaixaAberta: !!openCaixa,
    isLoadingCaixas,
    abrirMutation,
    fecharMutation,
    movimentoMutation,
  };
}

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { financialService } from "../../services";

export function useCaixaSession() {
  const queryClient = useQueryClient();

  const { data: caixasResponse, isLoading: isLoadingCaixas } = useQuery({
    queryKey: ["caixas"],
    queryFn: () => financialService.getAll(),
  });

  const caixas = caixasResponse?.items || caixasResponse || [];
  const openCaixa = Array.isArray(caixas)
    ? caixas.find((caixa: any) => caixa.estado === "Aberto")
    : null;
  const caixaId = openCaixa?.id || null;

  useEffect(() => {
    if (openCaixa) {
      localStorage.setItem('isCaixaAberta', 'true');
    } else {
      localStorage.setItem('isCaixaAberta', 'false');
    }
  }, [openCaixa]);

  const abrirMutation = useMutation({
    mutationFn: (valor: number) => financialService.abrir(valor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caixas"] });
      toast.success("Fundo de maneio registado com sucesso.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao abrir o caixa.");
    }
  });

  const fecharMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: any }) =>
      financialService.fechar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caixas"] });
      toast.success("O turno foi encerrado com sucesso.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao fechar caixa.");
    },
  });

  const movimentoMutation = useMutation({
    mutationFn: ({ tipo, valor, descricao }: { tipo: string; valor: number; descricao?: string }) =>
      financialService.movimento(String(caixaId), tipo, valor, descricao || tipo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caixas"] });
      toast.success("Movimento registado.");
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

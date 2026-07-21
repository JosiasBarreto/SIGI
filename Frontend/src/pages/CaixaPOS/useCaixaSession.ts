import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { financialService } from "../../services";

export function useCaixaSession() {
  const queryClient = useQueryClient();

  const { data: caixasResponse } = useQuery({
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
  });

  const fecharMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: any }) =>
      financialService.fechar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caixas"] });
      toast.success("O turno foi encerrado com sucesso.");
    },
    onError: () => {
      toast.error("Erro ao fechar caixa na API.");
    },
  });

  const movimentoMutation = useMutation({
    mutationFn: ({ tipo, valor }: { tipo: string; valor: number }) =>
      financialService.movimento(String(caixaId), tipo, valor, tipo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caixas"] });
      toast.success("Movimento registado.");
    },
  });

  const handleAbrirCaixa = () => {
    Swal.fire({
      title: "Abrir Caixa",
      text: "Insira o valor de fundo de maneio:",
      input: "number",
      showCancelButton: true,
      confirmButtonText: "Abrir Caixa",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        abrirMutation.mutate(Number(result.value) || 0);
      }
    });
  };

  const handleFecharCaixa = () => {
    if (!caixaId) return;

    Swal.fire({
      title: "Encerramento de Caixa",
      html: `
        <div class="text-left space-y-3">
          <p class="text-xs text-gray-500 mb-4">Insira os valores físicos contados no caixa para reconciliação:</p>
          <div class="mb-2">
            <label class="block text-xs font-bold text-gray-700">Valor em Dinheiro (STD)</label>
            <input id="swal-dinheiro" type="number" step="0.01" class="swal2-input w-full m-0" placeholder="0.00">
          </div>
          <div class="mb-2">
            <label class="block text-xs font-bold text-gray-700">Valor em Transferências (STD)</label>
            <input id="swal-transferencia" type="number" step="0.01" class="swal2-input w-full m-0" placeholder="0.00">
          </div>
          <div class="mb-2">
            <label class="block text-xs font-bold text-gray-700">Valor em Cartão / POS (STD)</label>
            <input id="swal-pos" type="number" step="0.01" class="swal2-input w-full m-0" placeholder="0.00">
          </div>
          <div class="mb-2">
            <label class="block text-xs font-bold text-gray-700">Justificação de Divergência</label>
            <textarea id="swal-justificativa" class="swal2-textarea w-full m-0 h-20" placeholder="Obrigatório em caso de diferença com o valor esperado..."></textarea>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Encerrar Turno",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        const dinheiro = parseFloat(
          (document.getElementById("swal-dinheiro") as HTMLInputElement).value || "0"
        );
        const transferencia = parseFloat(
          (document.getElementById("swal-transferencia") as HTMLInputElement).value || "0"
        );
        const pos = parseFloat(
          (document.getElementById("swal-pos") as HTMLInputElement).value || "0"
        );
        const justificativa = (
          document.getElementById("swal-justificativa") as HTMLTextAreaElement
        ).value;

        const totalEsperado = Number(openCaixa?.valor_final ?? openCaixa?.valor_inicial ?? 0);
        const totalDeclarado = dinheiro + transferencia + pos;
        const isDivergente = Math.abs(totalEsperado - totalDeclarado) > 0.01;

        if (isDivergente && !justificativa.trim()) {
          Swal.showValidationMessage("Uma divergência foi detetada. Justificação é obrigatória!");
          return false;
        }

        return {
          valor_declarado_dinheiro: dinheiro,
          valor_declarado_transferencia: transferencia,
          valor_declarado_pos: pos,
          explicacao_divergencia: justificativa,
        };
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        fecharMutation.mutate({ id: caixaId, payload: result.value });
      }
    });
  };

  const handleSangria = () => {
    if (!caixaId) return;
    Swal.fire({
      title: "Registar Sangria",
      text: "Valor a retirar do caixa:",
      input: "number",
      showCancelButton: true,
      confirmButtonText: "Registar",
    }).then(
      (result) =>
        result.isConfirmed &&
        movimentoMutation.mutate({ tipo: "Sangria", valor: Number(result.value) })
    );
  };

  const handleReforco = () => {
    if (!caixaId) return;
    Swal.fire({
      title: "Registar Reforço",
      text: "Valor a adicionar ao caixa:",
      input: "number",
      showCancelButton: true,
      confirmButtonText: "Registar",
    }).then(
      (result) =>
        result.isConfirmed &&
        movimentoMutation.mutate({ tipo: "Reforço", valor: Number(result.value) })
    );
  };

  return {
    openCaixa,
    caixaId,
    isCaixaAberta: !!openCaixa,
    handleAbrirCaixa,
    handleFecharCaixa,
    handleSangria,
    handleReforco,
  };
}

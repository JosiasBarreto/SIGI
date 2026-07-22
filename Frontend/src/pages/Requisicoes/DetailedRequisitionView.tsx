import React, { useState, useMemo } from "react";
import { Package, Wrench, CheckCircle2, TrendingUp, RotateCcw, FileText, Eye, Printer } from "lucide-react";
import { cn, formatCurrency } from "../../lib/utils";
import Swal from "sweetalert2";
import { useAuth } from "../../components/AuthContext";
import { DataTable } from "../../components/Common/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import Modal from "../../components/Common/Modal";

export function DetailedRequisitionView({
  req,
  onAction,
  isProcessing,
  onClose
}: {
  req: any;
  onAction: (action: "aprovar" | "entregar" | "devolver" | "encerrar", payload?: any) => void;
  isProcessing: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  
  const handlePrint = () => {
    const config = JSON.parse(localStorage.getItem("sigi_config") || "{}");
    const companyName = config.empresa || config.nome || "Sabor Imbatível, Lda.";
    const companyNif = config.nif || "500123456";
    const companyLocation = config.endereco || config.localizacao || "Luanda, Angola";
    const companyContact = config.telefone || config.contacto || "+244 923 456 789";
    const currencySym = config.moeda_simbolo || "Kz";

    // Determine occurrences
    const occurrences = req.itens?.filter(
      (item: any) => (Number(item.quantidade_danificada) || 0) > 0 || (Number(item.quantidade_perdida) || 0) > 0
    ) || [];

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      Swal.fire("Erro ao imprimir", "Por favor, permita pop-ups para visualizar a ficha de impressão.", "error");
      return;
    }

    const itemsHtml = req.itens?.map((item: any) => {
      const sol = Number(item.quantidade_solicitada) || 0;
      const apr = Number(item.quantidade_aprovada) || 0;
      const ent = Number(item.quantidade_entregue) || 0;
      const dev = Number(item.quantidade_devolvida) || 0;
      const dan = Number(item.quantidade_danificada) || 0;
      const per = Number(item.quantidade_perdida) || 0;
      const price = Number(item.preco_venda || item.preco_custo || 0);
      const valTotal = apr * price;

      const formattedPrice = price > 0 ? `${price.toFixed(2)} ${currencySym}` : "-";
      const formattedTotal = valTotal > 0 ? `${valTotal.toFixed(2)} ${currencySym}` : "-";

      return `
        <tr>
          <td>
            <div style="font-weight: bold; font-size: 13px;">${item.nome || `Item ID #${item.item_id}`}</div>
            <div style="font-size: 10px; color: #666; font-family: monospace;">${item.codigo || "-"}</div>
          </td>
          <td style="text-transform: uppercase; font-size: 11px; font-weight: bold;">${item.tipo_item}</td>
          <td style="text-align: center; font-weight: bold;">${sol} ${item.unidade_medida || "un"}</td>
          <td style="text-align: center; font-weight: bold; color: #1e3a8a;">${apr} ${item.unidade_medida || "un"}</td>
          <td style="text-align: center; font-weight: bold; color: #047857;">${ent} ${item.unidade_medida || "un"}</td>
          <td style="text-align: center;">${item.tipo_item === 'Material' ? `${dev} un` : '-'}</td>
          <td style="text-align: right;">${formattedPrice}</td>
          <td style="text-align: right; font-weight: bold;">${formattedTotal}</td>
        </tr>
      `;
    }).join("") || "<tr><td colspan='8' style='text-align: center;'>Nenhum item registado.</td></tr>";

    const occurrencesHtml = occurrences.map((item: any) => {
      const dan = Number(item.quantidade_danificada) || 0;
      const per = Number(item.quantidade_perdida) || 0;
      const totalOcc = dan + per;
      return `
        <div style="border-bottom: 1px solid #fed7d7; padding: 8px 0; margin-bottom: 5px;">
          <div style="font-weight: bold; color: #c53030; font-size: 12px;">
            ${item.nome} (${item.codigo || '-'})
          </div>
          <div style="font-size: 11px; margin-top: 3px;">
            <strong>Quantidade Afetada:</strong> ${totalOcc} un 
            (${dan > 0 ? `${dan} Danificado` : ""} ${per > 0 ? `${per} Perdido` : ""})
          </div>
          <div style="font-size: 11px; font-style: italic; color: #4a5568; margin-top: 3px; background: #fff5f5; padding: 6px; border-radius: 4px; border-left: 3px solid #f56565;">
            "<strong>Causa/Justificação:</strong> ${item.justificacao || 'Nenhuma justificação registada.'}"
          </div>
        </div>
      `;
    }).join("");

    const totalEstimated = req.itens?.reduce((acc: number, item: any) => {
      const apr = Number(item.quantidade_aprovada) || 0;
      const price = Number(item.preco_venda || item.preco_custo || 0);
      return acc + (apr * price);
    }, 0) || 0;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ficha de Requisicao - ${req.numero || `#${req.id}`}</title>
        <style>
          body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            color: #1e293b;
            background-color: #ffffff;
            margin: 0;
            padding: 40px;
            font-size: 13px;
            line-height: 1.5;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            border-bottom: 3px solid #0f172a;
            padding-bottom: 20px;
          }
          .company-title {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            margin: 0 0 5px 0;
            letter-spacing: -0.5px;
          }
          .company-info {
            font-size: 11px;
            color: #475569;
            line-height: 1.4;
          }
          .doc-title-block {
            text-align: right;
          }
          .doc-title {
            font-size: 15px;
            font-weight: 900;
            color: #1e3a8a;
            text-transform: uppercase;
            margin: 0 0 5px 0;
            letter-spacing: 0.5px;
          }
          .doc-num {
            font-size: 18px;
            font-weight: 900;
            color: #0f172a;
            font-family: monospace;
          }
          .meta-grid {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
          }
          .meta-grid td {
            padding: 12px 15px;
            border: 1px solid #e2e8f0;
            width: 50%;
            vertical-align: top;
          }
          .meta-label {
            font-size: 9px;
            text-transform: uppercase;
            font-weight: 800;
            color: #64748b;
            letter-spacing: 0.5px;
            margin-bottom: 3px;
          }
          .meta-val {
            font-size: 13px;
            font-weight: 700;
            color: #0f172a;
          }
          .table-items {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .table-items th {
            background-color: #0f172a;
            color: #ffffff;
            font-size: 10px;
            text-transform: uppercase;
            font-weight: 800;
            letter-spacing: 0.5px;
            padding: 10px 12px;
            border: 1px solid #1e293b;
            text-align: left;
          }
          .table-items td {
            padding: 10px 12px;
            border: 1px solid #e2e8f0;
            vertical-align: middle;
          }
          .table-items tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .total-row {
            background-color: #f1f5f9 !important;
            font-weight: bold;
          }
          .occurrences-section {
            background-color: #fffaf0;
            border: 2px solid #ea580c;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 30px;
          }
          .occurrences-header {
            color: #c2410c;
            font-size: 13px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
            border-bottom: 1px solid #fed7aa;
            padding-bottom: 5px;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .occurrences-note {
            margin-top: 10px;
            font-size: 10.5px;
            font-weight: 700;
            color: #9a3412;
            background: #ffedd5;
            padding: 8px;
            border-radius: 6px;
          }
          .obs-box {
            background-color: #f8fafc;
            border-left: 4px solid #94a3b8;
            padding: 12px;
            border-radius: 4px;
            font-size: 12px;
            margin-bottom: 35px;
          }
          .signatures-table {
            width: 100%;
            margin-top: 60px;
            border-collapse: collapse;
          }
          .signatures-table td {
            width: 33.33%;
            text-align: center;
            padding: 0 15px;
            vertical-align: top;
          }
          .sig-line {
            border-top: 1.5px solid #0f172a;
            margin-top: 45px;
            padding-top: 8px;
            font-size: 11px;
            font-weight: bold;
            color: #334155;
            text-transform: uppercase;
          }
          .sig-subtitle {
            font-size: 9px;
            color: #64748b;
            margin-top: 2px;
          }
          @media print {
            body {
              padding: 20px;
              font-size: 12px;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td>
              <h1 class="company-title">${companyName}</h1>
              <div class="company-info">
                NIF: <strong>${companyNif}</strong><br>
                Localização: ${companyLocation}<br>
                Contacto: ${companyContact}
              </div>
            </td>
            <td class="doc-title-block">
              <div class="doc-title">Ficha de Requisição</div>
              <div class="doc-num">${req.numero || `#${req.id}`}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 3px;">
                Estado: <strong>${req.estado}</strong>
              </div>
            </td>
          </tr>
        </table>

        <table class="meta-grid">
          <tr>
            <td>
              <div class="meta-label">Setor Requerente</div>
              <div class="meta-val">${req.sector}</div>
              
              <div class="meta-label" style="margin-top: 10px;">Turno de Operação</div>
              <div class="meta-val">${req.turno_nome || "Geral"}</div>
            </td>
            <td>
              <div class="meta-label">Responsável / Requerente</div>
              <div class="meta-val">${req.responsavel_nome || `ID #${req.responsavel_id}`}</div>

              <div class="meta-label" style="margin-top: 10px;">Data de Emissão</div>
              <div class="meta-val">${new Date(req.data_requisicao).toLocaleString()}</div>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="background-color: #f1f5f9; padding: 10px 15px;">
              <div style="display: flex; justify-content: space-between; font-size: 11px;">
                <span>Tipo de Ficha: <strong>Reclamação/Requisição ${req.tipo}</strong></span>
                <span>Data do Documento: <strong>${new Date().toLocaleDateString()}</strong></span>
              </div>
            </td>
          </tr>
        </table>

        <table class="table-items">
          <thead>
            <tr>
              <th>Artigo / Código</th>
              <th>Tipo</th>
              <th style="text-align: center;">Qtd Solicitada</th>
              <th style="text-align: center;">Qtd Aprovada</th>
              <th style="text-align: center;">Qtd Entregue</th>
              <th style="text-align: center;">Qtd Devolvida</th>
              <th style="text-align: right;">P. Unitário</th>
              <th style="text-align: right;">Total Estimado</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
            <tr class="total-row">
              <td colspan="6" style="text-align: right; font-weight: 800;">VALOR TOTAL ESTIMADO DA FICHA:</td>
              <td colspan="2" style="text-align: right; font-weight: 900; color: #1e3a8a; font-size: 14px;">
                ${totalEstimated.toFixed(2)} ${currencySym}
              </td>
            </tr>
          </tbody>
        </table>

        ${req.observacoes ? `
          <div class="obs-box">
            <div style="font-weight: 800; font-size: 9px; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; margin-bottom: 4px;">Observações do Documento</div>
            <div>${req.observacoes}</div>
          </div>
        ` : ""}

        ${occurrences.length > 0 ? `
          <div class="occurrences-section">
            <div class="occurrences-header">
              ⚠️ REGISTO DE OCORRÊNCIAS / INCIDENTES DE CONTROLO
            </div>
            ${occurrencesHtml}
            <div class="occurrences-note">
              NOTA DE FISCALIZAÇÃO: Esta ficha contém o registo de quebras ou perdas de materiais reutilizáveis durante a operação do turno. As ocorrências foram arquivadas no sistema de controlo de quebras para efeitos de responsabilização e auditoria física.
            </div>
          </div>
        ` : ""}

        <table class="signatures-table">
          <tr>
            <td>
              <div class="sig-line">Entregue por (Armazém)</div>
              <div class="sig-subtitle">Assinatura / Carimbo</div>
            </td>
            <td>
              <div class="sig-line">Recebido por (Requerente)</div>
              <div class="sig-subtitle">Assinatura / Carimbo</div>
            </td>
            <td>
              <div class="sig-line">Controlador de Materiais</div>
              <div class="sig-subtitle">Assinatura / Carimbo</div>
            </td>
          </tr>
        </table>

        <div style="margin-top: 60px; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px dashed #e2e8f0; padding-top: 10px;" class="no-print">
          Documento gerado eletronicamente em ${new Date().toLocaleString()} por ${user?.name || 'Utilizador do Sistema'}. <br>
          <button onclick="window.print();" style="margin-top: 10px; padding: 6px 15px; background: #0f172a; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">Imprimir Documento</button>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const [approvedQuantities, setApprovedQuantities] = useState<Record<number, number>>(() => {
    const qtys: Record<number, number> = {};
    req.itens?.forEach((item: any) => {
      qtys[item.id] = Number(item.quantidade_aprovada) || Number(item.quantidade_solicitada) || 0;
    });
    return qtys;
  });

  const [deliveryObservation, setDeliveryObservation] = useState(
    "Entrega efetuada na totalidade do que foi aprovado."
  );

  // Material devolucoes state mapping
  const [devolucoes, setDevolucoes] = useState<Record<number, {
    quantidade_devolvida: number;
    quantidade_danificada: number;
    quantidade_perdida: number;
    observacao: string;
    justificacao: string;
  }>>(() => {
    const devs: Record<number, any> = {};
    req.itens?.forEach((item: any) => {
      if (item.tipo_item === "Material") {
        devs[item.id] = {
          quantidade_devolvida: Number(item.quantidade_entregue) || Number(item.quantidade_aprovada) || 0,
          quantidade_danificada: 0,
          quantidade_perdida: 0,
          observacao: "",
          justificacao: ""
        };
      }
    });
    return devs;
  });

  const handleApproveSubmit = () => {
    const payload = {
      itens: Object.keys(approvedQuantities).map((idStr) => {
        const itemId = Number(idStr);
        return {
          id: itemId,
          quantidade_aprovada: Number(approvedQuantities[itemId])
        };
      })
    };
    onAction("aprovar", payload);
  };

  const handleDeliverySubmit = () => {
    onAction("entregar", { observacao: deliveryObservation });
  };

  const handleDevolucaoSubmit = () => {
    // We only send returns for materials
    const materialsOnly = req.itens?.filter((i: any) => i.tipo_item === "Material") || [];
    
    // Check missing justifications for damages or losses
    const missingJustification = materialsOnly.some((item: any) => {
      const dev = devolucoes[item.id];
      const hasIssues = (dev?.quantidade_danificada || 0) > 0 || (dev?.quantidade_perdida || 0) > 0;
      return hasIssues && !dev?.justificacao?.trim();
    });

    if (missingJustification) {
      Swal.fire(
        "Justificação Obrigatória",
        "Por favor, indique uma justificação para quaisquer materiais danificados ou perdidos.",
        "warning"
      );
      return;
    }

    const payload = materialsOnly.map((item: any) => {
      const dev = devolucoes[item.id];
      return {
        material_id: Number(item.item_id),
        quantidade_devolvida: Number(dev?.quantidade_devolvida || 0),
        quantidade_danificada: Number(dev?.quantidade_danificada || 0),
        quantidade_perdida: Number(dev?.quantidade_perdida || 0),
        observacao: dev?.observacao || "",
        justificacao: dev?.justificacao || ""
      };
    });

    onAction("devolver", payload);
  };

  const handleEncerraSubmit = () => {
    Swal.fire({
      title: "Encerrar Requisição?",
      text: "Quaisquer materiais não devolvidos gerarão ocorrências automáticas de perda no sistema. Esta ação é irreversível.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim, Encerrar!",
      cancelButtonText: "Cancelar"
    }).then((res) => {
      if (res.isConfirmed) {
        onAction("encerrar");
      }
    });
  };

  const isArmazemOrAdmin = ["Administrador", "Armazém"].includes(user?.role || "");
  const canDevolve = ["Administrador", "Controlador de Materiais", "Armazém"].includes(user?.role || "");

  const [viewItemDetails, setViewItemDetails] = useState<any>(null);

  const itemColumns = useMemo<ColumnDef<any, any>[]>(() => {
    const cols: ColumnDef<any, any>[] = [
      {
        accessorKey: "nome",
        header: "Artigo",
        cell: ({ row }) => (
          <div>
            <div className="font-bold">{row.original.nome || `Item ID #${row.original.item_id}`}</div>
            <div className="text-[10px] text-gray-400 font-mono mt-0.5">{row.original.codigo || "-"}</div>
          </div>
        )
      },
      {
        accessorKey: "tipo_item",
        header: "Tipo",
        cell: ({ row }) => {
          const isMat = row.original.tipo_item === "Material";
          return (
            <span className={cn("inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider", isMat ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400")}>
              {isMat ? <Wrench size={10} /> : <Package size={10} />}
              {row.original.tipo_item}
            </span>
          );
        }
      },
      {
        accessorKey: "quantidade_solicitada",
        header: "Qtd Req.",
        cell: ({ row }) => (
          <span className="font-bold">
            {Number(row.original.quantidade_solicitada)} <span className="text-[10px] font-semibold text-gray-400 uppercase">{row.original.unidade_medida || "un"}</span>
          </span>
        )
      },
      {
        id: "qtd_apro",
        header: "Qtd Apro.",
        cell: ({ row }) => {
          const item = row.original;
          if (req.estado === "Pendente" || (req.estado === "Aprovada" && isArmazemOrAdmin)) {
            return (
              <input
                type="number"
                step="any"
                value={approvedQuantities[item.id] ?? ""}
                onChange={(e) => setApprovedQuantities(prev => ({ ...prev, [item.id]: Number(e.target.value) }))}
                className="w-20 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-2 py-1 rounded font-bold text-center text-xs outline-none focus:border-primary shadow-inner"
              />
            );
          }
          return <span className="font-bold text-blue-600 dark:text-blue-400">{Number(item.quantidade_aprovada)} {item.unidade_medida || "un"}</span>;
        }
      }
    ];

    if (req.estado !== "Pendente") {
      cols.push({
        id: "qtd_entr",
        header: "Qtd Entr.",
        cell: ({ row }) => <span className="font-bold text-emerald-600 dark:text-emerald-400">{Number(row.original.quantidade_entregue)} {row.original.unidade_medida || "un"}</span>
      });
      cols.push({
        id: "qtd_dev",
        header: "Qtd Dev.",
        cell: ({ row }) => {
          const item = row.original;
          if ((req.estado === "Devolvida" || req.estado === "Encerrada") && item.tipo_item === "Material") {
            return <span className="font-bold text-gray-800 dark:text-gray-200">{Number(item.quantidade_devolvida) || 0} un</span>;
          }
          return <span className="text-gray-300">-</span>;
        }
      });
      cols.push({
        id: "qtd_dan",
        header: "Qtd Dan/Per",
        cell: ({ row }) => {
          const item = row.original;
          if ((req.estado === "Devolvida" || req.estado === "Encerrada" || req.estado === "Devolucao Parcial") && item.tipo_item === "Material") {
            return <span className="font-bold text-rose-500">{(Number(item.quantidade_danificada) || 0) + (Number(item.quantidade_perdida) || 0)} un</span>;
          }
          return <span className="text-gray-300">-</span>;
        }
      });
    }

    

    cols.push({
      id: "acoes",
      header: "Ações",
      cell: ({ row }) => (
        <button
          onClick={() => setViewItemDetails(row.original)}
          className="text-primary hover:text-primary-hover bg-primary/10 hover:bg-primary/20 p-2 rounded-xl transition-all flex items-center justify-center font-bold"
          title="Ver mais detalhes"
        >
          <Eye size={16} /> Ver mais
        </button>
      )
    });

    return cols;
  }, [req, isArmazemOrAdmin, canDevolve, approvedQuantities]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Information Cards Header block */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Responsável</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white uppercase truncate">
            {req.responsavel_nome || `ID #${req.responsavel_id}`}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Setor / Turno</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white uppercase truncate">
            {req.sector} {req.turno_nome ? `• ${req.turno_nome}` : ""} ({req.tipo})
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Data Criação</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white font-mono">
            {new Date(req.data_requisicao).toLocaleDateString()} {new Date(req.data_requisicao).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Estado</p>
          <span
            className={cn(
              "inline-block text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider",
              req.estado === "Pendente" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" :
              req.estado === "Aprovada" ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" :
              req.estado === "Em Uso" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" :
              "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
            )}
          >
            {req.estado}
          </span>
        </div>
      </div>

      {req.observacoes && (
        <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/10 text-xs">
          <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">
            Observações Gerais do Requerente
          </p>
          <p className="text-gray-700 dark:text-gray-300 font-medium">{req.observacoes}</p>
        </div>
      )}

      {/* Detailed Items List */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <FileText size={14} className="text-primary" />
          Relação de Itens da Ficha
        </h3>

        <div className="overflow-x-auto">
          <DataTable
            data={req.itens || []}
            columns={itemColumns}
            searchPlaceholder="Pesquisar itens..."
          />
        </div>
      </div>

      {/* ==========================================
          WORKFLOW ACTIONS DEPENDING ON ACTIVE STATE
          ========================================== */}

      {/* Pendente: Let Admin / Armazém Approve */}
      {req.estado === "Pendente" && (
        <div className="bg-gray-50 dark:bg-gray-800/20 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-blue-500" size={24} />
            <div>
              <h4 className="font-black text-xs uppercase tracking-wider text-gray-800 dark:text-gray-200">
                Aprovação da Requisição
              </h4>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">
                Defina as quantidades autorizadas a sair do armazém
              </p>
            </div>
          </div>
          {isArmazemOrAdmin ? (
            <div className="flex justify-between items-center gap-4 pt-2">
              <span className="text-xs text-gray-500 font-medium">
                Reveja os campos acima e altere caso queira aprovar parcialmente.
              </span>
              <button
                onClick={handleApproveSubmit}
                disabled={isProcessing}
                className="bg-primary hover:bg-primary-hover text-white font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl shadow-md transition-all disabled:opacity-50 active:scale-95 shrink-0"
              >
                {isProcessing ? "A processar..." : "Confirmar e Aprovar Ficha"}
              </button>
            </div>
          ) : (
            <p className="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
              Apenas utilizadores com cargos de Administrador ou Armazém podem aprovar requisições.
            </p>
          )}
        </div>
      )}

      {/* Aprovada: Confirm Delivery & Inventory Deduction */}
      {req.estado === "Aprovada" && (
        <div className="bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/10 space-y-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-emerald-500" size={24} />
            <div>
              <h4 className="font-black text-xs uppercase tracking-wider text-gray-800 dark:text-gray-200">
                Registo de Entrega (Baixa Física no Stock)
              </h4>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">
                Os artigos sairão fisicamente do armazém e baixarão as quantidades disponíveis
              </p>
            </div>
          </div>
          {isArmazemOrAdmin ? (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">
                  Anotação / Nota de Entrega
                </label>
                <input
                  type="text"
                  value={deliveryObservation}
                  onChange={(e) => setDeliveryObservation(e.target.value)}
                  placeholder="Ex: Entrega efetuada sem anomalias no ato de levantamento"
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-2.5 rounded-xl text-xs font-semibold outline-none focus:border-primary shadow-sm"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleDeliverySubmit}
                  disabled={isProcessing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl shadow-md transition-all disabled:opacity-50 active:scale-95"
                >
                  {isProcessing ? "A processar..." : "Confirmar Entrega e Dar Baixa de Stock"}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
              Apenas operadores do Armazém ou Administradores podem despachar e registar entregas.
            </p>
          )}
        </div>
      )}

      {/* Em Uso: Let controllers manage Material Returns or final Closure */}
      {req.estado === "Em Uso" && (
        <div className="space-y-6">
          {/* Detailed Reusable Materials returns logger */}
          {req.itens?.some((i: any) => i.tipo_item === "Material") && (
            <div className="bg-blue-500/5 p-5 rounded-2xl border border-blue-500/10 space-y-4">
              <div className="flex items-center gap-3">
                <RotateCcw className="text-blue-500" size={24} />
                <div>
                  <h4 className="font-black text-xs uppercase tracking-wider text-gray-800 dark:text-gray-200">
                    Registo de Devoluções de Materiais Reutilizáveis
                  </h4>
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">
                    Controlo de devoluções no final do turno (Tabuleiros, Utensílios, Recipientes)
                  </p>
                </div>
              </div>

              {canDevolve ? (
                <div className="space-y-4 pt-2">
                  {req.itens
                    ?.filter((item: any) => item.tipo_item === "Material")
                    .map((item: any) => {
                      const dev = devolucoes[item.id] || {
                        quantidade_devolvida: 0,
                        quantidade_danificada: 0,
                        quantidade_perdida: 0,
                        observacao: "",
                        justificacao: ""
                      };
                      const hasIssues = (dev.quantidade_danificada || 0) > 0 || (dev.quantidade_perdida || 0) > 0;

                      return (
                        <div
                          key={item.id}
                          className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 p-4 rounded-xl space-y-3 shadow-sm"
                        >
                          <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-800/60 pb-2">
                            <span className="font-bold text-xs text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                              <Wrench size={12} className="text-blue-500" />
                              {item.nome}
                            </span>
                            <span className="text-[10px] text-gray-400 uppercase font-bold">
                              Entregues: {Number(item.quantidade_entregue)} {item.unidade_medida || "un"}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">
                                Devolvido em Bom Estado
                              </label>
                              <input
                                type="number"
                                min="0"
                                max={item.quantidade_entregue}
                                value={dev.quantidade_devolvida}
                                onChange={(e) =>
                                  setDevolucoes({
                                    ...devolucoes,
                                    [item.id]: { ...dev, quantidade_devolvida: Number(e.target.value) }
                                  })
                                }
                                className="w-full bg-gray-50 dark:bg-surface-dark border border-gray-200 dark:border-gray-800 px-2 py-1.5 rounded-lg font-bold text-xs outline-none focus:border-primary shadow-inner"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-amber-500 uppercase tracking-widest block">
                                Quantidade Danificada
                              </label>
                              <input
                                type="number"
                                min="0"
                                max={item.quantidade_entregue}
                                value={dev.quantidade_danificada}
                                onChange={(e) =>
                                  setDevolucoes({
                                    ...devolucoes,
                                    [item.id]: { ...dev, quantidade_danificada: Number(e.target.value) }
                                  })
                                }
                                className="w-full bg-gray-50 dark:bg-surface-dark border border-gray-200 dark:border-gray-800 px-2 py-1.5 rounded-lg font-bold text-xs outline-none focus:border-primary shadow-inner"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-rose-500 uppercase tracking-widest block">
                                Quantidade Perdida
                              </label>
                              <input
                                type="number"
                                min="0"
                                max={item.quantidade_entregue}
                                value={dev.quantidade_perdida}
                                onChange={(e) =>
                                  setDevolucoes({
                                    ...devolucoes,
                                    [item.id]: { ...dev, quantidade_perdida: Number(e.target.value) }
                                  })
                                }
                                className="w-full bg-gray-50 dark:bg-surface-dark border border-gray-200 dark:border-gray-800 px-2 py-1.5 rounded-lg font-bold text-xs outline-none focus:border-primary shadow-inner"
                              />
                            </div>
                          </div>

                          {/* Justificação - obrigatória se houver perdas/danos */}
                          {hasIssues && (
                            <div className="space-y-1 border-t border-gray-50 dark:border-gray-800/40 pt-2 animate-fade-in">
                              <label className="text-[9px] font-black text-rose-500 uppercase tracking-widest block">
                                Justificação da Ocorrência *
                              </label>
                              <input
                                type="text"
                                value={dev.justificacao}
                                onChange={(e) =>
                                  setDevolucoes({
                                    ...devolucoes,
                                    [item.id]: { ...dev, justificacao: e.target.value }
                                  })
                                }
                                required
                                placeholder="Indique a causa (Ex: Um tabuleiro caiu e entortou na prensa do forno)"
                                className="w-full bg-rose-500/5 border border-rose-500/20 px-3 py-2 rounded-xl text-xs font-semibold outline-none focus:border-rose-500 shadow-sm"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleDevolucaoSubmit}
                      disabled={isProcessing}
                      className="bg-primary hover:bg-primary-hover text-white font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl shadow-md transition-all disabled:opacity-50 active:scale-95"
                    >
                      {isProcessing ? "A processar..." : "Registar Devoluções e perdas"}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
                  Apenas controladores de materiais, operadores ou administradores podem registar devoluções.
                </p>
              )}
            </div>
          )}

          {/* Final Closure button block */}
          {isArmazemOrAdmin && (
            <div className="bg-gray-900 dark:bg-surface-dark text-white p-5 rounded-2xl border border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-black text-xs uppercase tracking-wider">
                  Encerramento Definitivo da Ficha
                </h4>
                <p className="text-[10px] text-gray-400 uppercase font-semibold mt-0.5">
                  Terminar o processo de requisição física. Qualquer material pendente gera quebra automática.
                </p>
              </div>
              <button
                onClick={handleEncerraSubmit}
                disabled={isProcessing}
                className="bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl transition-all shadow-md active:scale-95"
              >
                {isProcessing ? "A encerrar..." : "Encerrar Requisição"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Close button at the very bottom */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={handlePrint}
          className="px-5 py-3 font-bold text-white bg-blue-600 hover:bg-blue-700 transition uppercase text-[10px] active:scale-95 rounded-xl flex items-center gap-1.5 shadow-sm"
          title="Gerar e Imprimir Ficha de Requisição Oficial"
        >
          <Printer size={14} /> Imprimir Ficha
        </button>
        <button
          onClick={onClose}
          className="px-6 py-3 font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition uppercase text-[10px] active:scale-95 border-2 border-gray-100 dark:border-gray-800 rounded-xl"
        >
          Fechar Visualização
        </button>
      </div>

      <Modal
        isOpen={!!viewItemDetails}
        onClose={() => setViewItemDetails(null)}
        title="Detalhes do Artigo"
        maxWidth="max-w-md"
      >
        {viewItemDetails && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Artigo</p>
              <div className="flex items-center gap-2">
                {viewItemDetails.tipo_item === "Material" ? <Wrench size={16} className="text-primary" /> : <Package size={16} className="text-primary" />}
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {viewItemDetails.nome || `Item ID #${viewItemDetails.item_id}`}
                </p>
              </div>
              <p className="text-[10px] text-gray-400 font-mono mt-1">{viewItemDetails.codigo || "Sem código associado"}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Quantidade Solicitada</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white font-mono">
                  {Number(viewItemDetails.quantidade_solicitada)} {viewItemDetails.unidade_medida || "un"}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Quantidade Aprovada</p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {Number(viewItemDetails.quantidade_aprovada) || 0} {viewItemDetails.unidade_medida || "un"}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Quantidade Devolvida</p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {Number(viewItemDetails.quantidade_devolvida) || 0} {viewItemDetails.unidade_medida || "un"}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Quantidade Danificada</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white font-mono">
                  {Number(viewItemDetails.quantidade_danificada) || 0} {viewItemDetails.unidade_medida || "un"}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Quantidade Perdida</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white font-mono">
                  {Number(viewItemDetails.quantidade_perdida) || 0} {viewItemDetails.unidade_medida || "un"}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Anotações do Item</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                {viewItemDetails.observacao || "Nenhuma anotação registada para este item."}
              </p>
            </div>
            
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setViewItemDetails(null)}
                className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold px-6 py-2 rounded-xl transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

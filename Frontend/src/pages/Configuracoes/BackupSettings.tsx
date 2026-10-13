import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Download, RotateCcw, Trash2, Plus, UploadCloud, AlertCircle } from "lucide-react";
import { DataTable } from "../../components/Common/DataTable";
import { backupService, BackupItemDTO } from "../../services";

export default function BackupSettings() {
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [restoringFilename, setRestoringFilename] = useState<string | null>(null);
  const [uploadingRestore, setUploadingRestore] = useState<boolean>(false);
  const [creatingBackup, setCreatingBackup] = useState<boolean>(false);

  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ["backups", pagination],
    queryFn: () => backupService.getBackups({ page: pagination.pageIndex + 1, per_page: pagination.pageSize }),
  });

  const createMutation = useMutation({
    mutationFn: () => backupService.create(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backups"] });
      toast.success("Snapshot .sql criado com sucesso!");
    },
    onError: (err: any) => toast.error(err?.message || "Falha ao criar snapshot."),
  });

  const deleteMutation = useMutation({
    mutationFn: (filename: string) => backupService.delete(filename),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backups"] });
      toast.success("Backup eliminado.");
    },
    onError: (err: any) => toast.error(err?.message || "Erro ao eliminar backup."),
  });

  const handleDownloadBackup = async (filename: string) => {
    try {
      await backupService.download(filename);
      toast.info(`A iniciar descarregamento de "${filename}"...`);
    } catch (error: any) {
      toast.error(error?.message || "Erro ao descarregar ficheiro.");
    }
  };

  const handleRestoreServerBackup = async (filename: string) => {
    if (!window.confirm(`Tem a certeza que deseja restaurar a base de dados a partir de "${filename}"?`)) return;
    setRestoringFilename(filename);
    try {
      await backupService.restoreServerFile(filename);
      toast.success("Base de dados restaurada!");
    } catch (error: any) {
      toast.error(error?.message || "Erro no restauro.");
    } finally {
      setRestoringFilename(null);
    }
  };

  const handleRestoreUploadFile = async (file: File) => {
    if (!file.name.endsWith('.sql')) { toast.error("Ficheiro inválido."); return; }
    if (!window.confirm(`Restaurar a partir de "${file.name}"?`)) return;
    setUploadingRestore(true);
    try {
      await backupService.restoreUpload(file);
      toast.success("Restaurado com sucesso!");
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Erro no restauro.");
    } finally {
      setUploadingRestore(false);
    }
  };

  const columns = [
    { accessorKey: "filename", header: "Ficheiro" },
    { accessorKey: "date", header: "Data" },
    { accessorKey: "formatted_size", header: "Tamanho" },
    { accessorKey: "type", header: "Tipo" },
    { id: "acoes", header: "Ações", cell: (info: any) => {
      const bk = info.row.original;
      return (
        <div className="flex gap-2">
          <button onClick={() => handleDownloadBackup(bk.filename)} className="text-primary text-xs font-bold">Download</button>
          <button onClick={() => handleRestoreServerBackup(bk.filename)} disabled={restoringFilename === bk.filename} className="text-amber-600 text-xs font-bold">Restaurar</button>
          <button onClick={() => deleteMutation.mutate(bk.filename)} className="text-red-500 text-xs font-bold">Eliminar</button>
        </div>
      );
    }}
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <DataTable
          data={response?.items || []}
          columns={columns}
          isLoading={isLoading}
          manualPagination
          pageCount={response?.pages || 0}
          paginationState={pagination}
          onPaginationChange={setPagination}
        />
        <button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2"
        >
          <Plus size={16} /> Criar Novo Snapshot
        </button>
      </div>
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark p-6 rounded-2xl shadow-sm text-center space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5 justify-center">
                <UploadCloud className="text-primary hover:animate-pulse" size={20} />
                Carregar Ficheiro .SQL para Restauro
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Envie um ficheiro .sql de cópia de segurança para restaurar a base de dados do servidor.
              </p>

              <div className="border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-primary/50 cursor-pointer p-6 rounded-xl transition text-center space-y-2">
                <UploadCloud className="mx-auto text-gray-400" size={36} />
                <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200">
                  {uploadingRestore ? "A carregar e restaurar..." : "Arraste ou selecione o ficheiro .sql"}
                </p>
                <input
                  type="file"
                  accept=".sql"
                  disabled={uploadingRestore}
                  className="hidden"
                  id="backup-restore-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleRestoreUploadFile(file);
                    }
                  }}
                />
                <label
                  htmlFor="backup-restore-input"
                  className="block text-[11px] font-bold text-primary hover:underline cursor-pointer mt-1"
                >
                  Procurar ficheiro
                </label>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl flex gap-2 text-left text-[10px] text-amber-800 dark:text-amber-300 border border-amber-100 dark:border-amber-900/50">
                <AlertCircle className="shrink-0 text-amber-600 dark:text-amber-400" size={16} />
                <div>
                  <span className="font-bold block">
                    Aviso Importante de Restauro:
                  </span>
                  O restauro substitui os dados atuais da base de dados do servidor.
                </div>
              </div>
            </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { clientService } from '../../services';
import { toast } from 'react-toastify';
import Modal from './Modal';

const DEFAULT_NIF = '999999999';

interface QuickClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (client: any) => void;
}

export default function QuickClientModal({ isOpen, onClose, onCreated }: QuickClientModalProps) {
  const [nome, setNome] = useState('');
  const [nif, setNif] = useState(DEFAULT_NIF);
  const [morada, setMorada] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNome('');
      setNif(DEFAULT_NIF);
      setMorada('');
      setEmail('');
    }
  }, [isOpen]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const clientName = nome.trim();
    if (!clientName) {
      toast.error('O nome do cliente é obrigatório.');
      return;
    }

    setIsSaving(true);
    try {
      const client = await clientService.create({
        nome: clientName,
        nif: nif.trim() || DEFAULT_NIF,
        morada: morada.trim() || undefined,
        email: email.trim() || undefined,
      });
      onCreated(client);
      toast.success(`Cliente ${clientName} criado com sucesso.`);
      onClose();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.msg ||
        error?.response?.data?.message ||
        error?.message ||
        'Não foi possível criar o cliente.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Criação Rápida de Cliente"
      maxWidth="max-w-xl"
      footer={(
        <>
          <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            Cancelar
          </button>
          <button form="quick-client-form" type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover disabled:opacity-60 rounded-lg">
            {isSaving ? 'A guardar...' : 'Criar Cliente'}
          </button>
        </>
      )}
    >
      <form id="quick-client-form" onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="sm:col-span-2 space-y-1.5">
          <span className="block text-xs font-bold text-gray-700 dark:text-gray-300">Nome <span className="text-red-500">*</span></span>
          <input autoFocus required value={nome} onChange={(event) => setNome(event.target.value)} maxLength={100} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-primary focus:outline-none" placeholder="Nome do cliente" />
        </label>
        <label className="space-y-1.5">
          <span className="block text-xs font-bold text-gray-700 dark:text-gray-300">NIF</span>
          <input value={nif} onChange={(event) => setNif(event.target.value)} maxLength={20} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-primary focus:outline-none" />
        </label>
        <label className="space-y-1.5">
          <span className="block text-xs font-bold text-gray-700 dark:text-gray-300">Email</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={100} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-primary focus:outline-none" placeholder="cliente@email.com" />
        </label>
        <label className="sm:col-span-2 space-y-1.5">
          <span className="block text-xs font-bold text-gray-700 dark:text-gray-300">Morada</span>
          <input value={morada} onChange={(event) => setMorada(event.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-primary focus:outline-none" placeholder="Morada (opcional)" />
        </label>
      </form>
    </Modal>
  );
}

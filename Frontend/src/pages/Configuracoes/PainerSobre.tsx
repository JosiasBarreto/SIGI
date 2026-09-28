import React, { useState } from 'react';
import {
  Info,
  Building2,
  Code2,
  Mail,
  Phone,
  Globe,
  Github,
  Linkedin,
  Send,
  Copy,
  Check,
  Activity,
  Terminal,
  Cpu,
  Layers,
  ShieldCheck,
  ExternalLink,
  Edit3,
  Save,
  X,
  FileText,
  Clock,
  Sparkles,
  Server,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ShoppingCart,
  Boxes,
  ChefHat,
  Receipt,
  Truck,
  HardDriveDownload,
  Users,
  MapPin
} from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

export interface DeveloperProfile {
  id: string;
  nome: string;
  cargo: string;
  especialidade: string;
  email: string;
  telefone: string;
  whatsapp: string;
  cidade: string;
  pais: string;
  github?: string;
  linkedin?: string;
  bio: string;
}

const DEFAULT_DEVELOPERS: DeveloperProfile[] = [
  {
    id: "josias",
    nome: "Eng. Josias Barreto",
    cargo: "Engenheiro de Software & Desenvolvedor Full-Stack",
    especialidade: "Aplicações Web de Alto Desempenho, Arquitetura de ERPs & APIs Distribuídas",
    email: "josiasbarreto11@gmail.com",
    telefone: "+239 9956478",
    whatsapp: "+2399956478",
    cidade: "São Tomé",
    pais: "São Tomé e Príncipe",
    github: "https://github.com/josiasbarreto",
    linkedin: "https://linkedin.com/in/josiasbarreto",
    bio: "Engenheiro de software são-tomense responsável pela arquitetura do sistema SIGI, implementação do núcleo full-stack, segurança de dados, interfaces e gestão de inventário e vendas para a Sabor Imbatível."
  },
  {
    id: "antonio",
    nome: "Eng. António de Assunção",
    cargo: "Engenheiro de Software & Desenvolvedor Full-Stack",
    especialidade: "Sistemas de Gestão Integrada, Engenharia Web & Integração de Serviços",
    email: "stptic@gmail.com",
    telefone: "+239 9916658",
    whatsapp: "+2399916658",
    cidade: "São Tomé",
    pais: "São Tomé e Príncipe",
    github: "https://github.com/antoniodeassuncao",
    linkedin: "https://linkedin.com/in/antoniodeassuncao",
    bio: "Engenheiro de software são-tomense co-autor do sistema SIGI, responsável pela orquestração de módulos de produção industrial, parametrização fiscal de São Tomé e Príncipe, infraestrutura e estabilidade da plataforma."
  }
];

const SYSTEM_MODULES = [
  {
    icon: ShoppingCart,
    titulo: "POS & Faturação de Balcão",
    descricao: "Gestão ágil de vendas a retalho, emissão rápida de faturas e recibos térmicos em Dobras (STN), controlo de turnos e fecho diário de caixa."
  },
  {
    icon: Boxes,
    titulo: "Stock & Gestão de Inventário",
    descricao: "Múltiplos armazéns, contagem física em modo auditoria cega, rastreabilidade de desvios, transferências internas, paginação universal e quarentena."
  },
  {
    icon: ChefHat,
    titulo: "Produção Industrial (KDS)",
    descricao: "Planeamento e controlo de ordens de fabrico com fichas técnicas de matérias-primas e ecrãs separados para Cozinha e Pastelaria."
  },
  {
    icon: Receipt,
    titulo: "Gestão Fiscal & Contabilidade",
    descricao: "Parametrização de taxas de imposto, conformidade com a Direção dos Impostos de São Tomé e Príncipe, documentos retificativos e mapa de faturação."
  },
  {
    icon: Truck,
    titulo: "Compras & Fornecedores",
    descricao: "Entradas por lote, controlo de custos de aquisição em Dobras, margens de rentabilidade e gestão rigorosa de matérias-primas e ingredientes."
  },
  {
    icon: HardDriveDownload,
    titulo: "Backups & Segurança de Dados",
    descricao: "Geração de snapshots .sql nativos do servidor, download direto de cópias de segurança criptografadas e módulo de restauro assistido."
  }
];

const RELEASE_FEATURES = [
  {
    versao: "v1.0.0",
    data: "Versão Inicial • Setembro 2026",
    titulo: "Lançamento Oficial da Plataforma SIGI",
    descricao: "Primeira versão estável do Sistema Integrado de Gestão Interna (SIGI), concebido para a empresa Sabor Imbatível em São Tomé e Príncipe. Inclui POS completo, gestão de stock multi-armazém com auditoria cega, painel KDS de produção para Cozinha e Pastelaria, tesouraria em Dobras (STN) e sistema de cópias de segurança reais.",
    tipo: "Release Inicial"
  }
];

export const PainelSobre: React.FC = () => {
  const [developers, setDevelopers] = useState<DeveloperProfile[]>(() => {
    try {
      const saved = localStorage.getItem('sigi_developers_team');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignora erro de parsing
    }
    return DEFAULT_DEVELOPERS;
  });

  const [editingDevId, setEditingDevId] = useState<string | null>(null);
  const [tempDev, setTempDev] = useState<DeveloperProfile | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Diagnóstico de Conexão à API
  const [pingStatus, setPingStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [pingMessage, setPingMessage] = useState<string>('');

  const activeApiUrl = apiClient.defaults.baseURL || 'https://f088-197-159-166-222.ngrok-free.app/api';

  const handleCopy = (text: string, label: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`${label} copiado para a área de transferência!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleStartEdit = (dev: DeveloperProfile) => {
    setEditingDevId(dev.id);
    setTempDev({ ...dev });
  };

  const handleSaveDev = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempDev) return;
    const updated = developers.map(d => d.id === tempDev.id ? tempDev : d);
    setDevelopers(updated);
    try {
      localStorage.setItem('sigi_developers_team', JSON.stringify(updated));
    } catch {
      // Ignora
    }
    setEditingDevId(null);
    setTempDev(null);
    toast.success("Informações do desenvolvedor atualizadas com sucesso!");
  };

  const handleResetTeam = () => {
    setDevelopers(DEFAULT_DEVELOPERS);
    setEditingDevId(null);
    setTempDev(null);
    localStorage.removeItem('sigi_developers_team');
    toast.info("Restauradas as informações originais da equipa de desenvolvimento.");
  };

  const handleTestPing = async () => {
    setPingStatus('testing');
    const start = performance.now();
    try {
      await apiClient.get('/v1/configuracoes', { timeout: 7000 });
      const latency = Math.round(performance.now() - start);
      setPingLatency(latency);
      setPingStatus('success');
      setPingMessage(`Conexão operacional e estável. Latência: ${latency} ms`);
      toast.success(`API online! Tempo de resposta: ${latency} ms`);
    } catch (err: any) {
      const latency = Math.round(performance.now() - start);
      setPingLatency(latency);
      if (err.response) {
        setPingStatus('success');
        setPingMessage(`Servidor acessível (HTTP ${err.response.status}). Latência: ${latency} ms`);
        toast.info(`Servidor contactado com sucesso (${latency} ms).`);
      } else {
        setPingStatus('error');
        setPingMessage(err?.message || 'Sem resposta do gateway do backend.');
        toast.error('Não foi possível estabelecer ligação ao servidor backend.');
      }
    }
  };

  const handleExportDiagnostics = () => {
    const diagnosticReport = {
      sistema: {
        nome: "SIGI",
        descricao: "Sistema Integrado de Gestão Interna",
        versao: "1.0.0",
        cliente: "Sabor Imbatível",
        pais: "São Tomé e Príncipe",
        cidade: "São Tomé",
        moeda_padrao: "Dobra (STN)",
        data_geracao: new Date().toISOString()
      },
      ambiente: {
        mode: import.meta.env.MODE,
        api_mode: import.meta.env.VITE_API_MODE || 'real',
        base_url: activeApiUrl,
        user_agent: navigator.userAgent
      },
      equipa_desenvolvedores: developers
    };

    const blob = new Blob([JSON.stringify(diagnosticReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sigi_sobre_diagnostico_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Ficha técnica do SIGI exportada com sucesso!");
  };

  return (
    <div className="space-y-6">
      {/* 1. Secção Hero: Sobre a Aplicação (SIGI - Sabor Imbatível) */}
      <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white shadow-md shrink-0">
              <Building2 size={32} />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  SIGI
                </h2>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                  v1.0.0 • Primeira Versão
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Sistema Integrado de Gestão Interna & Produção Industrial
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400 pt-0.5">
                <span>Cliente: Sabor Imbatível</span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1">
                  <MapPin size={12} className="text-primary" />
                  São Tomé, São Tomé e Príncipe
                </span>
                <span aria-hidden="true">·</span>
                <span>Moeda: Dobra (STN)</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportDiagnostics}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition"
              title="Descarregar ficha técnica e diagnóstico em JSON"
            >
              <FileText size={14} />
              Exportar Ficha Técnica
            </button>

            <button
              onClick={handleTestPing}
              disabled={pingStatus === 'testing'}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm transition disabled:opacity-50"
            >
              <Activity size={14} className={pingStatus === 'testing' ? 'animate-spin' : ''} />
              {pingStatus === 'testing' ? 'A Testar API...' : 'Diagnosticar Conexão'}
            </button>
          </div>
        </div>

        {/* Descrição e Propósito do SIGI */}
        <div className="pt-6 space-y-3">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Sobre o Sistema
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed max-w-5xl">
            O <strong>SIGI (Sistema Integrado de Gestão Interna)</strong> é a solução tecnológica central desenvolvida sob medida para a empresa <strong>Sabor Imbatível</strong> em <strong>São Tomé e Príncipe</strong>. A aplicação centraliza e sincroniza em tempo real as vendas e faturamentos de balcão (POS), o planeamento e controlo da produção industrial (KDS para Cozinha e Pastelaria), o rigoroso controlo de stocks com contagens cegas e quarentena, a tesouraria em Dobras (STN) e a garantia de continuidade com cópias de segurança automáticas.
          </p>
        </div>
      </div>

      {/* 2. Módulos Operacionais Integrados */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 px-1">
          <Layers size={17} className="text-primary" />
          Módulos Integrados na Aplicação
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SYSTEM_MODULES.map((mod, idx) => {
            const ModIcon = mod.icon;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm space-y-2 hover:border-primary/40 transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <ModIcon size={18} />
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                    {mod.titulo}
                  </h4>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {mod.descricao}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Equipa de Engenharia & Desenvolvedores de São Tomé */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users size={17} className="text-primary" />
              Equipa de Desenvolvimento de Software
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Engenheiros de software de São Tomé e Príncipe responsáveis pela criação e manutenção do SIGI.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetTeam}
            className="text-[11px] text-gray-400 hover:text-primary transition"
            title="Restaurar dados originais dos autores"
          >
            Restaurar predefinições
          </button>
        </div>

        {/* Formulário Inline de Edição (Se um desenvolvedor for selecionado para editar) */}
        {editingDevId && tempDev && (
          <form
            onSubmit={handleSaveDev}
            className="bg-gray-50 dark:bg-gray-900/60 border border-primary/30 rounded-2xl p-6 shadow-sm space-y-4 animate-fade-in"
          >
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="text-primary" size={16} />
                <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  Editar Detalhes de Contacto • {tempDev.nome}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingDevId(null)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={tempDev.nome}
                  onChange={e => setTempDev({ ...tempDev, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Cargo / Especialidade
                </label>
                <input
                  type="text"
                  required
                  value={tempDev.cargo}
                  onChange={e => setTempDev({ ...tempDev, cargo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={tempDev.email}
                  onChange={e => setTempDev({ ...tempDev, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Telefone (+239)
                </label>
                <input
                  type="text"
                  value={tempDev.telefone}
                  onChange={e => setTempDev({ ...tempDev, telefone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  WhatsApp (+239...)
                </label>
                <input
                  type="text"
                  value={tempDev.whatsapp}
                  onChange={e => setTempDev({ ...tempDev, whatsapp: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  País / Localização
                </label>
                <input
                  type="text"
                  value={`${tempDev.cidade}, ${tempDev.pais}`}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800/50 text-gray-500 cursor-not-allowed"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-3">
                <label className="block font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Declaração Técnica / Bio
                </label>
                <textarea
                  rows={2}
                  value={tempDev.bio}
                  onChange={e => setTempDev({ ...tempDev, bio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingDevId(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-lg shadow transition"
              >
                <Save size={14} />
                Guardar Alterações
              </button>
            </div>
          </form>
        )}

        {/* Cards dos Dois Engenheiros */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {developers.map((dev) => (
            <div
              key={dev.id}
              className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-6 space-y-5"
            >
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-hover text-white flex items-center justify-center font-bold font-mono text-base shadow shrink-0">
                    {dev.id === 'josias' ? 'JB' : 'AA'}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-gray-900 dark:text-white">
                      {dev.nome}
                    </h4>
                    <p className="text-xs font-bold text-primary">
                      {dev.cargo}
                    </p>
                    <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                      <MapPin size={11} className="text-primary" />
                      <span>{dev.cidade}, {dev.pais}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartEdit(dev)}
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition"
                  title="Editar dados de contacto"
                >
                  <Edit3 size={13} />
                </button>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                {dev.bio}
              </p>

              {/* Contactos do Engenheiro */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Email */}
                <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-xl p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                      <Mail size={12} /> Email
                    </span>
                    <button
                      onClick={() => handleCopy(dev.email, 'Email', `email_${dev.id}`)}
                      className="text-gray-400 hover:text-primary transition"
                      title="Copiar email"
                    >
                      {copiedKey === `email_${dev.id}` ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    </button>
                  </div>
                  <p className="font-mono text-xs font-bold text-gray-900 dark:text-white break-all">
                    {dev.email}
                  </p>
                  <a
                    href={`mailto:${dev.email}?subject=Suporte%20SIGI%20-%20Sabor%20Imbat%C3%ADvel`}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline pt-0.5"
                  >
                    Enviar Mensagem
                    <ExternalLink size={10} />
                  </a>
                </div>

                {/* Telefone / WhatsApp */}
                <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-xl p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                      <Phone size={12} /> WhatsApp
                    </span>
                    <button
                      onClick={() => handleCopy(dev.telefone, 'Telefone', `tel_${dev.id}`)}
                      className="text-gray-400 hover:text-emerald-600 transition"
                      title="Copiar contacto"
                    >
                      {copiedKey === `tel_${dev.id}` ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    </button>
                  </div>
                  <p className="font-mono text-xs font-bold text-gray-900 dark:text-white">
                    {dev.telefone}
                  </p>
                  <a
                    href={`https://wa.me/${dev.whatsapp.replace(/[^0-9]/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(dev.nome)}%2C%20contacto%20sobre%20o%20sistema%20SIGI%20da%20Sabor%20Imbat%C3%ADvel.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 hover:underline pt-0.5"
                  >
                    Abrir WhatsApp
                    <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Ficha Técnica & Diagnóstico da API */}
      <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-6 space-y-4">
        <div className="border-b border-gray-100 dark:border-gray-800 pb-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Terminal size={17} className="text-primary" />
            Parâmetros de Execução & Conectividade
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Estado da comunicação de dados entre a interface web e o servidor backend.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
            <span className="text-gray-400 block font-medium">Nome do Produto</span>
            <span className="font-bold text-gray-900 dark:text-white mt-0.5 block">
              SIGI (v1.0.0)
            </span>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
            <span className="text-gray-400 block font-medium">Bundler & Engine</span>
            <span className="font-bold text-primary font-mono mt-0.5 block">
              Vite 6 + Tailwind v4
            </span>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
            <span className="text-gray-400 block font-medium">Gestão de Cache</span>
            <span className="font-bold text-gray-900 dark:text-white mt-0.5 block">
              TanStack Query v5
            </span>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
            <span className="text-gray-400 block font-medium">Sincronização</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              WebSockets em Tempo Real
            </span>
          </div>
        </div>

        {/* Diagnóstico Gateway */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Server size={15} className="text-gray-500" />
              <span className="font-bold text-gray-800 dark:text-gray-200">
                Gateway REST API Ativo:
              </span>
              <code className="px-2 py-0.5 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-mono text-[11px] text-gray-700 dark:text-gray-300">
                {activeApiUrl}
              </code>
            </div>

            <button
              onClick={() => handleCopy(activeApiUrl, 'URL da API', 'apiUrl')}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 w-fit"
            >
              {copiedKey === 'apiUrl' ? <Check size={13} /> : <Copy size={13} />}
              Copiar URL
            </button>
          </div>

          {pingMessage && (
            <div className={`flex items-center gap-2 pt-2 text-xs font-semibold ${
              pingStatus === 'success' 
                ? 'text-emerald-700 dark:text-emerald-400' 
                : 'text-red-700 dark:text-red-400'
            }`}>
              {pingStatus === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
              <span>{pingMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* 5. Histórico da Versão Inicial */}
      <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-6 space-y-4">
        <div className="border-b border-gray-100 dark:border-gray-800 pb-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock size={17} className="text-primary" />
            Lançamento do Sistema (v1.0.0)
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Primeira versão oficial do SIGI desenvolvida para a Sabor Imbatível.
          </p>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
          {RELEASE_FEATURES.map((item, idx) => (
            <div key={idx} className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-primary">
                    {item.versao}
                  </span>
                  <span aria-hidden="true" className="text-gray-300">·</span>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    {item.titulo}
                  </span>
                  <span className="text-[10px] text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-medium">
                    {item.tipo}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl">
                  {item.descricao}
                </p>
              </div>

              <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap shrink-0">
                {item.data}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PainelSobre;

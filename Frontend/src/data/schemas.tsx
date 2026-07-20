export interface FieldSchema {
  name: string;
  label: string;
  type:
    | "text"
    | "number"
    | "date"
    | "time"
    | "select"
    | "textarea"
    | "checkbox";
  options?: string[] | { label: string; value: string | number }[];
  required?: boolean;
}
const movimentoClasses: Record<string, string> = {
  "TipoMovimentoStock.ENTRADA":
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "TipoMovimentoStock.SAIDA":
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  "TipoMovimentoStock.AJUSTE":
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "TipoMovimentoStock.PERDA":
    "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  "TipoMovimentoStock.REQUISICAO":
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};
const stockStatus: Record<string, string> = {
  true: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  false: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};
const config = JSON.parse(localStorage.getItem("sigi_config") || "{}");
const UnidadeMoeda = " STN"; // Define a unidade monetária como "STN"
//formatar o valor para exibir com duas casas decimais, a unidade monetária e o símbolo de moeda, e separar os milhares com ponto e as casas decimais com vírgula
const formatarValor = (valor: number) => {
  return `${valor.toFixed(2).replace(".", ",")} ${
    config.moeda || UnidadeMoeda
  }`; // Retorna o valor formatado com a unidade monetária
};

export interface ModuleSchema {
  title: string;
  fields: FieldSchema[];
  columns: {
    key: string;
    label: string;
    render?: (val: any, item: any) => React.ReactNode;
  }[];
  columnsHistory?: {
    key: string;
    label: string;
    render?: (val: any, item: any) => React.ReactNode;
  }[];
}

export const schemas: Record<string, ModuleSchema> = {
  products: {
    title: "Produtos e Ingredientes",
    columns: [
      { key: "codigo", label: "Código" },
      { key: "nome", label: "Nome" },

      {
        key: "stock_atual",
        label: "Quantidade",
        render: (val, item) => `${Number(val)} ${item.unidade_medida_sigla}`,
      },
      {
        key: "preco_compra",
        label: "Preço de Compra",
        render: (val) => formatarValor(Number(val)),
      },
      {
        key: "preco_venda",
        label: "Preço Bruto",
        render: (val) => formatarValor(Number(val)),
      },

      {
        key: "taxa_iva",
        label: "Taxa de IVA",
        render: (val) => (val ? `${Number(val)}%` : "Isento"),
      },
      {
        key: "precoliquido",
        label: "Preço Com IVA",
        render: (val, item) => {
          const precoVenda = Number(item.preco_venda);
          const taxaIva = Number(item.taxa_iva);
          if (taxaIva) {
            const precoLiquido = precoVenda + (taxaIva / 100) * precoVenda;
            return formatarValor(precoLiquido);
          }
          return formatarValor(precoVenda);
        },
      },
      { key: "armazem_nome", label: "Armazém" },
      { key: "categoria_nome", label: "Categoria" },
      {
        key: "ativo",
        label: "Estado",
        render: (val: boolean) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              stockStatus[String(val)]
            }`}
          >
            {val ? "Ativo" : "Inativo"}
          </span>
        ),
      },
    ],

    fields: [
      { name: "codigo", label: "Código", type: "text" },
      { name: "nome", label: "Nome do Produto", type: "text", required: true },
      {
        name: "tipo",
        label: "Tipo de Produto",
        type: "select",
        options: ["Consumivel", "Acabado", "Revenda"],
        required: true,
      },
      { name: "categoria_id", label: "Categoria", type: "select" },
      { name: "unidade_medida_id", label: "Unidade de Medida", type: "select" },
      {
        name: "preco_compra",
        label: "Preço de Compra / Custo",
        type: "number",
      },
      {
        name: "preco_venda",
        label: "Preço de Venda",
        type: "number",
        required: true,
      },
      {
        name: "tempo_producao",
        label: "Tempo de Produção (min)",
        type: "date",
      },
      { name: "stock_atual", label: "Stock Atual", type: "number" },
      { name: "stock_minimo", label: "Stock Mínimo", type: "number" },
      { name: "taxa_iva_id", label: "Taxa de IVA", type: "select" },
      { name: "ativo", label: "Ativo", type: "checkbox" },
      { name: "descricao", label: "Descrição / Notas", type: "textarea" },
      { name: "data_validade", label: "Data de Validade", type: "date" },
    ],
    columnsHistory: [
      {
        key: "created_at",
        label: "Data de Criação",
        render: (val) => new Date(val).toLocaleString("pt-PT"),
      },
      {
        key: "tipo_movimento",
        label: "Tipo",
        render: (val) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              movimentoClasses[val] ?? "bg-gray-200 text-gray-600"
            }`}
          >
            {val}
          </span>
        ),
      },
      {
        key: "quantidade",
        label: "Quantidade",
        render: (val) => Number(val),
      },
      {
        key: "stock_anterior",
        label: "Stock Anterior",
        render: (val) => Number(val),
      },
      {
        key: "stock_atual",
        label: "Stock Atual",
        render: (val) => Number(val),
      },
      { key: "utilizador_nome", label: "Utilizador" },
    ],
  },
  clients: {
    title: "Clientes",
    columns: [
      { key: "nome", label: "Nome" },
      { key: "empresa", label: "Empresa" },
      { key: "nif", label: "NIF" },
      { key: "telefone", label: "Telefone" },
      { key: "email", label: "Email" },
    ],
    fields: [
      { name: "nome", label: "Nome Completo", type: "text", required: true },
      { name: "empresa", label: "Empresa", type: "text" },
      { name: "nif", label: "NIF", type: "text", required: true },
      {
        name: "telefone",
        label: "Telefone Principal",
        type: "text",
        required: true,
      },
      { name: "whatsapp", label: "WhatsApp", type: "text" },
      { name: "email", label: "E-mail", type: "text" },
      { name: "morada", label: "Morada Completa", type: "text" },
      {
        name: "observacoes",
        label: "Observações / Preferências",
        type: "textarea",
      },
    ],
  },
  materials: {
    title: "Controlo de Materiais e Aluguer",
    columns: [
      { key: "codigo", label: "Código" },
      { key: "nome", label: "Nome" },
      { key: "tipo", label: "Tipo" },
      {
        key: "quantidade_total",
        label: "Qtd Total",
        render: (val: any, item: any) =>
          `${Number(val) || 0} ${item.unidade_medida_sigla || ""}`.trim(),
      },
      {
        key: "quantidade_disponivel",
        label: "Qtd Disponível",
        render: (val: any, item: any) =>
          `${Number(val) || 0} ${item.unidade_medida_sigla || ""}`.trim(),
      },
      {
        key: "estado",
        label: "Estado",
        render: (value: string) => {
          const colors: Record<string, string> = {
            Disponivel:
              "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
            Manutencao:
              "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
            Manutenção:
              "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
            Danificado:
              "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
            "Em Uso":
              "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
          };
          const colorClass =
            colors[value] ||
            "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
          return (
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}
            >
              {value}
            </span>
          );
        },
      },
    ],
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
      { name: "codigo", label: "Código", type: "text", required: true },
      { name: "categoria", label: "Categoria", type: "text" },
      {
        name: "tipo",
        label: "Tipo",
        type: "select",
        options: ["Reutilizavel", "Consumivel"],
        required: true,
      },
      { name: "unidade_medida_id", label: "Unidade de Medida", type: "select" },
      {
        name: "quantidade_total",
        label: "Quantidade Total",
        type: "number",
        required: true,
      },
      {
        name: "quantidade_disponivel",
        label: "Quantidade disponível",
        type: "number",
        required: true,
      },
      {
        name: "quantidade_reservada",
        label: "Quantidade reservada",
        type: "number",
        required: true,
      },
      {
        name: "estado",
        label: "Estado",
        type: "select",
        options: [
          "Disponível",
          "Em Uso",
          "Manutenção",
          "Perdido",
          "Danificado",
          "Devolvido",
          "Baixa",
        ],
        required: true,
      },
      { name: "valor_unitario", label: "Valor Unitário", type: "number" },
      { name: "is_active", label: "Ativo", type: "checkbox" },
    ],
  },
  events: {
    title: "Eventos",
    columns: [
      { key: "titulo", label: "Título" },
      { key: "data_evento", label: "Data" },
      { key: "local_evento", label: "Local" },
      { key: "numero_convidados", label: "Convidados" },
      { key: "estado", label: "Estado" },
    ],
    fields: [
      {
        name: "titulo",
        label: "Título do Evento",
        type: "text",
        required: true,
      },
      {
        name: "cliente_id",
        label: "ID do Cliente",
        type: "number",
        required: true,
      },
      {
        name: "tipo_evento",
        label: "Tipo de Evento",
        type: "select",
        options: [
          "Casamento",
          "Aniversario",
          "Batizado",
          "Empresarial",
          "Catering",
          "Formatura",
          "Outro",
        ],
        required: true,
      },
      {
        name: "local_evento",
        label: "Recinto / Morada",
        type: "text",
        required: true,
      },
      {
        name: "data_evento",
        label: "Data do Evento",
        type: "date",
        required: true,
      },
      {
        name: "hora_inicio",
        label: "Hora de Início",
        type: "time",
        required: true,
      },
      { name: "hora_fim", label: "Hora de Término", type: "time" },
      {
        name: "numero_convidados",
        label: "Nº Convidados",
        type: "number",
        required: true,
      },
      {
        name: "valor_evento",
        label: "Valor do Evento",
        type: "number",
        required: true,
      },
      { name: "servico_descricao", label: "Servico Principal", type: "text" },
      { name: "valor_pago", label: "Valor Pago", type: "number" },
      { name: "descricao", label: "Descrição / Observações", type: "textarea" },
    ],
  },
  users: {
    title: "Gestão de Utilizadores",
    columns: [
      { key: "name", label: "Nome Completo" },
      { key: "email", label: "Email" },
      { key: "contact", label: "Contacto" },
      { key: "role", label: "Perfil" },
      { key: "status", label: "Estado" },
      { key: "lastAccess", label: "Último Acesso" },
    ],
    fields: [
      { name: "name", label: "Nome Completo", type: "text", required: true },
      { name: "email", label: "Email", type: "text", required: true },
      { name: "contact", label: "Telefone", type: "text", required: true },
      {
        name: "password",
        label: "Palavra-passe",
        type: "text",
        required: false,
      },
      {
        name: "confirmPassword",
        label: "Confirmar palavra-passe",
        type: "text",
        required: false,
      },
      {
        name: "role",
        label: "Perfil",
        type: "select",
        options: [
          "Administrador",
          "Atendimento",
          "Cozinha",
          "Pastelaria",
          "Armazém",
          "Bar e Restaurante",
          "Motorista",
          "Controlador de Materiais",
        ],
        required: true,
      },
      {
        name: "status",
        label: "Estado",
        type: "select",
        options: ["Ativo", "Inativo"],
        required: true,
      },
      { name: "notes", label: "Observações", type: "textarea" },
    ],
  },
  vehicles: {
    title: "Logística - Viaturas",
    columns: [
      { key: "plate", label: "Matrícula" },
      { key: "mark", label: "Marca" },
      { key: "model", label: "Modelo" },
      { key: "capacity", label: "Capacidade" },
      { key: "status", label: "Estado" },
    ],
    fields: [
      { name: "plate", label: "Matrícula", type: "text", required: true },
      { name: "mark", label: "Marca", type: "text", required: true },
      { name: "model", label: "Modelo", type: "text", required: true },
      {
        name: "capacity",
        label: "Capacidade (kg)",
        type: "number",
        required: true,
      },
      {
        name: "status",
        label: "Estado",
        type: "select",
        options: ["Disponível", "Em Serviço", "Manutenção"],
        required: true,
      },
    ],
  },
  deliveries: {
    title: "Logística - Entregas",
    columns: [
      { key: "orderId", label: "Pedido/Evento" },
      { key: "driverId", label: "Motorista" },
      { key: "vehicleId", label: "Viatura" },
      { key: "departureDate", label: "Data de Saída" },
      { key: "status", label: "Estado" },
    ],
    fields: [
      { name: "orderId", label: "ID Pedido", type: "text", required: true },
      { name: "eventId", label: "ID Evento", type: "text" },
      { name: "driverId", label: "Motorista", type: "text", required: true },
      { name: "vehicleId", label: "Viatura", type: "text", required: true },
      {
        name: "departureDate",
        label: "Data de Saída",
        type: "date",
        required: true,
      },
      { name: "arrivalDate", label: "Data de Chegada", type: "date" },
      {
        name: "status",
        label: "Estado",
        type: "select",
        options: ["Pendente", "Em Trânsito", "Entregue", "Cancelada"],
        required: true,
      },
    ],
  },
  financial: {
    title: "Gestão Financeira",
    columns: [
      { key: "type", label: "Tipo" },
      { key: "category", label: "Categoria" },
      { key: "amount", label: "Valor" },
      { key: "date", label: "Data" },
      { key: "status", label: "Estado" },
    ],
    fields: [
      {
        name: "type",
        label: "Tipo",
        type: "select",
        options: ["Receita", "Despesa"],
        required: true,
      },
      { name: "category", label: "Categoria", type: "text", required: true },
      { name: "amount", label: "Valor (STD)", type: "number", required: true },
      { name: "date", label: "Data", type: "date", required: true },
      {
        name: "status",
        label: "Estado",
        type: "select",
        options: ["Pago", "Pendente", "Parcial"],
        required: true,
      },
      {
        name: "description",
        label: "Observações / Descrição",
        type: "textarea",
      },
    ],
  },
  inventory: {
    title: "Movimentos de Armazém",
    columns: [
      { key: "productId", label: "Produto ID" },
      { key: "type", label: "Tipo de Mov." },
      { key: "quantity", label: "Quantidade" },
      { key: "date", label: "Data" },
      { key: "responsible", label: "Responsável" },
    ],
    fields: [
      {
        name: "productId",
        label: "Produto/Material ID",
        type: "text",
        required: true,
      },
      {
        name: "type",
        label: "Tipo Movimento",
        type: "select",
        options: ["Entrada", "Saída", "Ajuste", "Perda/Vencimento"],
        required: true,
      },
      { name: "quantity", label: "Quantidade", type: "number", required: true },
      {
        name: "date",
        label: "Data do Movimento",
        type: "date",
        required: true,
      },
      {
        name: "responsible",
        label: "Responsável",
        type: "text",
        required: true,
      },
      { name: "notes", label: "Observações", type: "textarea" },
    ],
  },
  requisitions: {
    title: "Requisições",
    columns: [
      { key: "sector", label: "Sector" },
      { key: "type", label: "Tipo" },
      { key: "status", label: "Estado" },
      { key: "date", label: "Data" },
    ],
    fields: [
      { name: "sector", label: "Sector", type: "text", required: true },
      {
        name: "manager",
        label: "Chefe Responsável",
        type: "text",
        required: true,
      },
      {
        name: "type",
        label: "Tipo",
        type: "select",
        options: ["Inicial", "Complementar"],
        required: true,
      },
      {
        name: "status",
        label: "Estado",
        type: "select",
        options: ["Pendente", "Aprovada", "Entregue", "Concluída"],
        required: true,
      },
      { name: "date", label: "Data", type: "date", required: true },
      { name: "notes", label: "Observações/Produtos", type: "textarea" },
    ],
  },
  shifts: {
    title: "Gestão de Turnos",
    columns: [
      { key: "sector", label: "Sector" },
      { key: "manager", label: "Chefe" },
      { key: "date", label: "Data" },
      { key: "startTime", label: "Início" },
      { key: "endTime", label: "Fim" },
      { key: "status", label: "Estado" },
    ],
    fields: [
      {
        name: "sector",
        label: "Sector",
        type: "select",
        options: [
          "Atendimento",
          "Cozinha",
          "Pastelaria",
          "Armazém",
          "Motoristas",
        ],
        required: true,
      },
      {
        name: "manager",
        label: "Chefe de Turno",
        type: "text",
        required: true,
      },
      { name: "date", label: "Data", type: "date", required: true },
      { name: "startTime", label: "Hora Início", type: "time", required: true },
      { name: "endTime", label: "Hora Fim", type: "time", required: true },
      {
        name: "status",
        label: "Estado",
        type: "select",
        options: ["Planeado", "A Decorrer", "Concluído"],
        required: true,
      },
      { name: "notes", label: "Observações", type: "textarea" },
    ],
  },
  audit: {
    title: "Auditoria de Sistema",
    columns: [
      { key: "date", label: "Data/Hora" },
      { key: "user", label: "Utilizador" },
      { key: "module", label: "Módulo" },
      { key: "operation", label: "Operação" },
      { key: "recordId", label: "Registo Afetado" },
    ],
    fields: [
      { name: "date", label: "Data e Hora", type: "text", required: true },
      { name: "user", label: "Utilizador", type: "text", required: true },
      { name: "role", label: "Perfil", type: "text", required: true },
      { name: "module", label: "Módulo", type: "text", required: true },
      {
        name: "operation",
        label: "Operação",
        type: "select",
        options: ["Criou", "Alterou", "Eliminou", "Aprovou", "Inativou"],
        required: true,
      },
      {
        name: "recordId",
        label: "ID Registo Afetado",
        type: "text",
        required: true,
      },
      { name: "oldValue", label: "Valor Anterior", type: "textarea" },
      { name: "newValue", label: "Valor Novo", type: "textarea" },
    ],
  },
  pedidos: {
    title: "Fila de Pedidos",
    columns: [
      { key: "numero", label: "Número de Pedido" },
      { key: "origem", label: "Origem" },
      { key: "tipo", label: "Tipo de Pedido" },
      { key: "valor_total", label: "Total" },
      { key: "cliente.nome", label: "Cliente" },
      { key: "data_entrega", label: "Data de Entrega" }
    ],
  },
};

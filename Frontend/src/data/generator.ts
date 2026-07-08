import { User, Client, Product, Material, Order, Event, Vehicle, Requisition, FinancialRecord, AuditLog } from "../types";

export const generateId = () => Math.random().toString(36).substring(2, 9);

export function initializeDatabase() {
  if (localStorage.getItem("sigi_db_initialized") === "v5") {
    return; // Force regenerate if not v5
  }

  const users: User[] = [
    { id: "u1", name: "Admin Sabor Imbatível", email: "admin@saborimbativel.com", contact: "9000001", role: "Administrador", status: "Ativo", lastAccess: new Date().toISOString() },
    { id: "uadmin", name: "Administrador Sigi", email: "admin@sigi.com", contact: "9000000", role: "Administrador", status: "Ativo", lastAccess: new Date().toISOString() },
    { id: "u2", name: "Ana Atendimento", email: "atendimento@saborimbativel.com", contact: "9000002", role: "Atendimento", status: "Ativo", lastAccess: new Date().toISOString() },

    { id: "u3", name: "Carlos Chefe de Cozinha", email: "cozinha@saborimbativel.com", contact: "9000003", role: "Cozinha", status: "Ativo", lastAccess: new Date().toISOString() },
    { id: "u4", name: "Marta Pasteleira", email: "pastelaria@saborimbativel.com", contact: "9000004", role: "Pastelaria", status: "Ativo", lastAccess: new Date().toISOString() },
    { id: "u5", name: "João Logística", email: "armazem@saborimbativel.com", contact: "9000005", role: "Armazém", status: "Ativo", lastAccess: new Date().toISOString() },
    { id: "u6", name: "Pedro Motorista", email: "motorista@saborimbativel.com", contact: "9000006", role: "Motorista", status: "Ativo", lastAccess: new Date().toISOString() }
  ];

  const clientCompanies = ["Banco de Poupança", "Telecom Nacional", "Seguros Plus", "Hospital Central", "Ministério das Finanças", "Universidade Agostinho Neto"];
  const clients: Client[] = Array.from({ length: 50 }, (_, i) => ({
    id: `c${i + 1}`,
    name: `Cliente ${i + 1} ${["Silva", "Santos", "Costa", "Oliveira"][Math.floor(Math.random() * 4)]}`,
    company: i < 15 ? clientCompanies[Math.floor(Math.random() * clientCompanies.length)] : undefined,
    nif: `5000${Math.floor(Math.random() * 90000) + 10000}`,
    phone: `92${Math.floor(Math.random() * 9000000) + 1000000}`,
    whatsapp: `92${Math.floor(Math.random() * 9000000) + 1000000}`,
    email: `cliente${i + 1}@exemplo.com`,
    address: `Rua Serpa Pinto, Edifício ${Math.floor(Math.random() * 100)}, Luanda`,
    district: ["Luanda", "Talatona", "Belas", "Viana"][Math.floor(Math.random() * 4)],
    notes: i % 5 === 0 ? "Cliente VIP de Catering" : ""
  }));

  const productNamesPastry = ["Bolo de Casamento (3 andares)", "Bolo de Chocolate Decorado", "Cupcakes Red Velvet (Dúzia)", "Mil Folhas Clássico", "Tarte de Amêndoa", "Cheesecake de Morango"];
  const productNamesKitchen = ["Bacalhau com Natas (Travessa)", "Arroz de Pato", "Leitão Assado Inteiro", "Coxinhas de Frango (Cento)", "Empadas de Camarão (Cento)", "Rissóis de Carne (Cento)"];
  const productResale = ["Água Mineral 500ml", "Coca-Cola 330ml", "Vinho Tinto Reserva", "Água das Pedras", "Sumo Compal Laranja", "Cerveja Cuca"];
  const ingredients = ["Farinha de Trigo T55", "Açúcar Refinado", "Ovos (Caixa)", "Manteiga sem sal", "Bacalhau Demolhado", "Peito de Frango", "Óleo Alimentar (Litro)"];
  
  const products: Product[] = [];
  let prodId = 1;
  const now = new Date().toISOString();

  productNamesPastry.forEach(name => {
    products.push({
      id: `p${prodId++}`, name, internalCode: `PST-${1000 + prodId}`, barcode: `789${10000 + prodId}`,
      category: "Produtos Acabados", subcategory: "Pastelaria", supplier: "Produção Interna", unit: "un",
      quantity: Math.floor(Math.random() * 20), minStock: 2, maxStock: 50,
      purchasePrice: Math.floor(Math.random() * 5000) + 2000, salePrice: Math.floor(Math.random() * 25000) + 10000,
      registerDate: now, updateDate: now, status: "Ativo", userId: "u1"
    });
  });

  productNamesKitchen.forEach(name => {
    products.push({
      id: `p${prodId++}`, name, internalCode: `COZ-${1000 + prodId}`, barcode: `789${20000 + prodId}`,
      category: "Produtos Acabados", subcategory: "Salgados", supplier: "Produção Interna", unit: "un",
      quantity: Math.floor(Math.random() * 50), minStock: 5, maxStock: 100,
      purchasePrice: Math.floor(Math.random() * 3000) + 1000, salePrice: Math.floor(Math.random() * 15000) + 5000,
      registerDate: now, updateDate: now, status: "Ativo", userId: "u1"
    });
  });

  productResale.forEach(name => {
    products.push({
      id: `p${prodId++}`, name, internalCode: `REV-${1000 + prodId}`, barcode: `789${30000 + prodId}`,
      category: "Revenda", subcategory: "Bebidas", supplier: "Distribuidor A", unit: "un",
      quantity: Math.floor(Math.random() * 200), minStock: 50, maxStock: 500,
      purchasePrice: Math.floor(Math.random() * 500) + 100, salePrice: Math.floor(Math.random() * 1500) + 200,
      registerDate: now, updateDate: now, status: "Ativo", userId: "u1"
    });
  });

  ingredients.forEach(name => {
    products.push({
      id: `p${prodId++}`, name, internalCode: `ING-${1000 + prodId}`, barcode: `789${40000 + prodId}`,
      category: "Ingredientes", subcategory: "Matéria Prima", supplier: "Fornecedor Alfa Lda", unit: "kg",
      quantity: Math.floor(Math.random() * 200) + 20, minStock: 50, maxStock: 500,
      purchasePrice: Math.floor(Math.random() * 1000) + 200, salePrice: 0,
      registerDate: now, updateDate: now, status: "Ativo", userId: "u1"
    });
  });

  const materialNamesReq = ["Tenda Branca 10x10", "Tenda Cristal 15x15", "Mesa Redonda 8 pax", "Cadeira Tiffany Dourada", "Prato Raso Porcelana", "Copo Cristal Vinho", "Talheres Ouro (Conjunto)", "Toalha Mesa Branca", "Bandeja de Garçom"];
  const materials: any[] = materialNamesReq.map((name, i) => {
    const qty = Math.floor(Math.random() * 500) + 50;
    return {
      id: `m${i + 1}`, name, code: `MAT-${1000+i}`, category: "Aluguer / Eventos", type: "Reutilizável",
      quantity: qty, available: qty - 10, reserved: 10,
      status: "Disponível", location: "Armazém Principal - Corredor B",
      unitValue: Math.floor(Math.random() * 25000) + 1000, acquisitionDate: new Date(Date.now() - Math.random() * 10000000000).toISOString()
    }
  });

  const eventNames = ["Casamento Silva & Mota", "Confraternização Banco de Poupança", "Gala Solidária Hospital Central", "Aniversário 50 Anos Sra. Costa", "Bodas de Ouro Oliveira", "Lançamento Produto Telecom"];
  const events: Event[] = eventNames.map((name, i) => {
    const isToday = i === 1; // force one today
    const date = isToday ? new Date() : new Date(Date.now() + (Math.random() * 30 - 5) * 86400000);
    return {
      id: `e${i + 1}`, name, clientId: `c${Math.floor(Math.random() * 30) + 1}`,
      location: ["Talatona Convention", "Ilha de Luanda", "Quinta de Belas", "Residência do Cliente"][Math.floor(Math.random() * 4)],
      date: date.toISOString().split("T")[0], startTime: "18:00", endTime: "02:00",
      guests: Math.floor(Math.random() * 400) + 50, status: isToday ? "Em Andamento" : "Agendado", notes: "Atenção a restrições alimentares VIP"
    };
  });

  // Orders only from Revenda or Acabados
  const saleProducts = products.filter(p => p.category === "Produtos Acabados" || p.category === "Revenda");
  
  const orders: Order[] = Array.from({ length: 50 }, (_, i) => {
    const isToday = i < 5;
    const dueDate = isToday ? new Date().toISOString() : new Date(Date.now() + (Math.random() * 15 - 5) * 86400000).toISOString();
    return {
      id: `o${i + 1}`, clientId: `c${Math.floor(Math.random() * 40) + 1}`,
      type: Math.random() > 0.6 ? "Composto" : "Simples",
      status: ["Agendado", "Em Produção", "Pronto", "Entregue"][Math.floor(Math.random() * 4)] as any,
      items: [{ productId: saleProducts[Math.floor(Math.random() * saleProducts.length)].id, quantity: Math.floor(Math.random() * 10) + 1 }],
      dueDate, total: Math.floor(Math.random() * 500000) + 20000,
      notes: "Criado automaticamente"
    };
  });

  const vehicles: any[] = [
    { id: "v1", plate: "LD-23-45-FG", mark: "Mercedes", model: "Sprinter", capacity: 3500, status: "Em Serviço" },
    { id: "v2", plate: "LD-99-12-HJ", mark: "Renault", model: "Master", capacity: 3000, status: "Disponível" },
    { id: "v3", plate: "LD-55-88-AB", mark: "Ford", model: "Transit", capacity: 1500, status: "Disponível" },
    { id: "v4", plate: "LD-12-34-XY", mark: "Toyota", model: "Dyna", capacity: 4000, status: "Manutenção" }
  ];

  const deliveries: any[] = Array.from({ length: 15 }, (_, i) => {
    return {
      id: `del${i+1}`,
      orderId: `o${Math.floor(Math.random() * 20)+1}`,
      eventId: Math.random() > 0.5 ? `e${Math.floor(Math.random() * 5)+1}` : "",
      driverId: "u6",
      vehicleId: `v${Math.floor(Math.random() * 3)+1}`,
      departureDate: new Date(Date.now() - (Math.random() * 5 * 86400000)).toISOString(),
      arrivalDate: new Date().toISOString(),
      status: ["Pendente", "Em Trânsito", "Entregue"][Math.floor(Math.random() * 3)]
    }
  });

  const shifts: any[] = Array.from({ length: 10 }, (_, i) => ({
    id: `sh${i+1}`,
    sector: ["Cozinha", "Pastelaria", "Armazém", "Atendimento"][Math.floor(Math.random() * 4)],
    manager: ["Carlos", "Marta", "Ana", "João"][Math.floor(Math.random() * 4)],
    date: new Date(Date.now() - (Math.random() * 5 * 86400000)).toISOString().split('T')[0],
    startTime: "08:00",
    endTime: "16:00",
    status: ["Planeado", "A Decorrer", "Concluído"][Math.floor(Math.random() * 3)],
    notes: ""
  }));

  const requisitions: any[] = Array.from({ length: 20 }, (_, i) => ({
    id: `r${i + 1}`, sector: "Cozinha", manager: "Carlos Chefe de Cozinha", type: Math.random() > 0.7 ? "Complementar" : "Inicial",
    status: ["Pendente", "Aprovada", "Entregue", "Concluída"][Math.floor(Math.random() * 4)] as any,
    date: new Date().toISOString(),
    notes: `Precisa urgente de ${ingredients[Math.floor(Math.random() * ingredients.length)]}`
  }));

  const financial: any[] = Array.from({ length: 40 }, (_, i) => {
    const type = Math.random() > 0.3 ? "Receita" : "Despesa";  
    return {
      id: `f${i+1}`,
      type,
      amount: Math.floor(Math.random() * 1000000) + 50000,
      category: type === "Receita" ? "Vendas" : (Math.random() > 0.5 ? "Fornecedores" : "Salários"),
      description: "Movimento gerado",
      date: new Date(Date.now() - (Math.random() * 30 * 86400000)).toISOString().split('T')[0],
      status: ["Pago", "Pendente", "Parcial"][Math.floor(Math.random() * 3)]
    }
  });

  const inventory: any[] = Array.from({ length: 30 }, (_, i) => {
    return {
      id: `inv${i+1}`,
      productId: `p${Math.floor(Math.random() * 20)+1}`,
      type: ["Entrada", "Saída", "Ajuste", "Perda/Vencimento"][Math.floor(Math.random() * 4)],
      quantity: Math.floor(Math.random() * 100) + 1,
      date: new Date(Date.now() - (Math.random() * 30 * 86400000)).toISOString(),
      responsible: "João Logística",
      notes: "Verificado no armazém"
    }
  });

  const auditNames = ["João", "Maria", "Carlos", "Ana", "Administrador"];
  const auditRoles = ["Atendimento", "Administrador", "Gerente", "Operador"];
  const auditModules = ["Pedidos", "Clientes", "Materiais", "Requisições", "Produtos", "Viaturas"];
  const auditOps = ["Criou", "Alterou", "Eliminou", "Aprovou", "Inativou"];

  const auditLogs: any[] = Array.from({ length: 1000 }, (_, i) => ({
    id: `aud${i+1}`,
    date: new Date(Date.now() - (Math.random() * 60 * 86400000)).toISOString(),
    user: auditNames[Math.floor(Math.random() * auditNames.length)],
    role: auditRoles[Math.floor(Math.random() * auditRoles.length)],
    module: auditModules[Math.floor(Math.random() * auditModules.length)],
    operation: auditOps[Math.floor(Math.random() * auditOps.length)],
    recordId: `Rec-${Math.floor(Math.random() * 9000)+1000}`,
    oldValue: Math.random() > 0.5 ? "Valor anterior fictício" : "",
    newValue: "Valor novo fictício"
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const data = {
    users,
    clients,
    products: products.map(p => ({ ...p, taxa_iva: "14" })),
    materials,
    orders,
    events,
    vehicles,
    deliveries,
    requisitions,
    shifts,
    financial,
    inventory,
    audit: auditLogs,
    materialIssues: [],
    vendas: [
      {
        id: 1,
        numero: "VND-2026-0001",
        cliente_id: "c1",
        cliente_nome: "Cliente 1 Silva",
        tipo_documento: "FR",
        serie_documental: "SERIE-2026",
        data_venda: new Date(Date.now() - 4 * 3600000).toISOString(),
        subtotal: 100000,
        iva_valor: 14000,
        total: 114000,
        valor_pago: 114000,
        saldo: 0,
        estado: "Pago",
        itens: [
          { id: 1, produto_id: 1, produto_nome: "Bolo de Casamento (3 andares)", quantidade: 1, preco_unitario: 100000, iva_taxa: 14, iva_valor: 14000, subtotal: 100000, total: 114000 }
        ],
        pagamentos: [
          { id: 1, data_pagamento: new Date(Date.now() - 4 * 3600000).toISOString(), valor: 114000, metodo_pagamento: "Transferência", observacao: "Pago integral no balcão" }
        ],
        auditoria: [
          { utilizador: "Ana Atendimento", acao: "Criou Venda FR", IP: "192.168.100.15", data: new Date(Date.now() - 4 * 3600000).toISOString() }
        ]
      },
      {
        id: 2,
        numero: "VND-2026-0002",
        cliente_id: "c2",
        cliente_nome: "Cliente 2 Santos",
        tipo_documento: "FT",
        serie_documental: "SERIE-2026",
        data_venda: new Date(Date.now() - 2 * 86400000).toISOString(),
        subtotal: 250000,
        iva_valor: 35000,
        total: 285000,
        valor_pago: 100000,
        saldo: 185000,
        estado: "Parcial",
        itens: [
          { id: 2, produto_id: 2, produto_nome: "Bacalhau com Natas (Travessa)", quantidade: 10, preco_unitario: 25000, iva_taxa: 14, iva_valor: 35000, subtotal: 250000, total: 285000 }
        ],
        pagamentos: [
          { id: 2, data_pagamento: new Date(Date.now() - 2 * 86400000).toISOString(), valor: 100000, metodo_pagamento: "Multicaixa", observacao: "Sinal de adjudicação" }
        ],
        auditoria: [
          { utilizador: "Carlos Chefe de Cozinha", acao: "Emitiu Fatura FT", IP: "192.168.100.22", data: new Date(Date.now() - 2 * 86400000).toISOString() }
        ]
      },
      {
        id: 3,
        numero: "VND-2026-0003",
        cliente_id: "c3",
        cliente_nome: "Cliente 3 Costa",
        tipo_documento: "PROFORMA",
        serie_documental: "SERIE-2026",
        data_venda: new Date(Date.now() - 5 * 86400000).toISOString(),
        subtotal: 50000,
        iva_valor: 7000,
        total: 57000,
        valor_pago: 0,
        saldo: 57000,
        estado: "Pendente",
        itens: [
          { id: 3, produto_id: 3, produto_nome: "Mil Folhas Clássico", quantidade: 20, preco_unitario: 2500, iva_taxa: 14, iva_valor: 7000, subtotal: 50000, total: 57000 }
        ],
        pagamentos: [],
        auditoria: [
          { utilizador: "Ana Atendimento", acao: "Gerou Proforma", IP: "192.168.100.15", data: new Date(Date.now() - 5 * 86400000).toISOString() }
        ]
      },
      {
        id: 4,
        numero: "VND-2026-0004",
        cliente_id: "c4",
        cliente_nome: "Cliente 4 Oliveira",
        tipo_documento: "NC",
        serie_documental: "SERIE-2026",
        data_venda: new Date(Date.now() - 10 * 86400000).toISOString(),
        subtotal: -10000,
        iva_valor: -1400,
        total: -11400,
        valor_pago: 0,
        saldo: -11400,
        estado: "Pago",
        itens: [
          { id: 4, produto_id: 4, produto_nome: "Arroz de Pato", quantidade: -1, preco_unitario: 10000, iva_taxa: 14, iva_valor: -1400, subtotal: -10000, total: -11400 }
        ],
        pagamentos: [],
        auditoria: [
          { utilizador: "Admin Sabor Imbatível", acao: "Retificação de Fatura NC", IP: "192.168.100.10", data: new Date(Date.now() - 10 * 86400000).toISOString() }
        ]
      },
      {
        id: 5,
        numero: "VND-2026-0005",
        cliente_id: "c5",
        cliente_nome: "Cliente 5 Santos",
        tipo_documento: "FT",
        serie_documental: "SERIE-2026",
        data_venda: new Date(Date.now() - 20 * 86400000).toISOString(),
        subtotal: 120000,
        iva_valor: 16800,
        total: 136800,
        valor_pago: 0,
        saldo: 136800,
        estado: "Pendente",
        itens: [
          { id: 5, produto_id: 1, produto_nome: "Bolo de Casamento (3 andares)", quantidade: 1, preco_unitario: 120000, iva_taxa: 14, iva_valor: 16800, subtotal: 120000, total: 136800 }
        ],
        pagamentos: [],
        auditoria: [
          { utilizador: "Ana Atendimento", acao: "Criou Fatura FT", IP: "192.168.100.15", data: new Date(Date.now() - 20 * 86400000).toISOString() }
        ]
      }
    ],
    contas_receber: [
      {
        id: 1,
        venda_id: 2,
        venda_numero: "VND-2026-0002",
        cliente_id: "c2",
        cliente_nome: "Cliente 2 Santos",
        valor_original: 285000,
        valor_pago: 100000,
        saldo: 185000,
        vencimento: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
        estado: "Parcial"
      },
      {
        id: 2,
        venda_id: 3,
        venda_numero: "VND-2026-0003",
        cliente_id: "c3",
        cliente_nome: "Cliente 3 Costa",
        valor_original: 57000,
        valor_pago: 0,
        saldo: 57000,
        vencimento: new Date(Date.now() + 10 * 86400000).toISOString().split("T")[0],
        estado: "Pendente"
      },
      {
        id: 3,
        venda_id: 5,
        venda_numero: "VND-2026-0005",
        cliente_id: "c5",
        cliente_nome: "Cliente 5 Santos",
        valor_original: 136800,
        valor_pago: 0,
        saldo: 136800,
        vencimento: new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0],
        estado: "Vencido"
      }
    ],
    fecho_diario: [
      {
        id: 1,
        numero: "FCH-2026-0001",
        data_criacao: new Date(Date.now() - 1 * 86400000).toISOString(),
        vendas_total: 114000,
        recebimentos_total: 100000,
        despesas_total: 15000,
        saldo_final: 199000,
        estado: "Processado",
        caixas_detalhes: [
          { caixa_id: 1, operador: "Ana Atendimento", saldo_inicial: 50000, receitas: 114000, despesas: 15000, saldo_final: 149000, estado: "Fechado" }
        ]
      }
    ],
    iva_rates: [
      { id: 1, codigo: "IVA0", descricao: "Isento (0%)", taxa: 0, is_active: true },
      { id: 2, codigo: "IVA7", descricao: "Simplificado (7%)", taxa: 7, is_active: true },
      { id: 3, codigo: "IVA14", descricao: "Normal (14%)", taxa: 14, is_active: true }
    ]
  };

  localStorage.setItem("sigi_db", JSON.stringify(data));
  localStorage.setItem("sigi_db_initialized", "v5");
}

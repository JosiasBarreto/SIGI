export type Role =
  | "Administrador"
  | "Atendimento"
  | "Cozinha"
  | "Pastelaria"
  | "Armazém"
  | "Bar e Restaurante"
  | "Motorista"
  | "Controlador de Materiais";

export interface User {
  id: string;
  name: string;
  email: string;
  contact: string;
  role: Role;
  status: "Ativo" | "Inativo";
  lastAccess: string;
}

export interface Client {
  id: string;
  name: string;
  company?: string;
  nif: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  district: string;
  notes?: string;
}

export type ProductCategory = "Ingredientes" | "Produtos Acabados" | "Revenda" | "Material" | "Embalagens";

export interface Product {
  id: string;
  name: string;
  internalCode: string;
  barcode: string;
  category: string;
  subcategory: string;
  supplier: string;
  unit: string;
  quantity: number;
  minStock: number;
  maxStock: number;
  purchasePrice: number;
  salePrice: number;
  expiryDate?: string;
  registerDate: string;
  updateDate: string;
  notes?: string;
  status: "Ativo" | "Inativo";
  userId: string;
}

export interface Material {
  id: string;
  name: string;
  category: string;
  type: "Reutilizável" | "Consumível";
  quantity: number;
  status: "Disponível" | "Em Uso" | "Manutenção" | "Perdido";
  location: string;
  unitValue: number;
  acquisitionDate: string;
  notes?: string;
}

export type OrderStatus =
  | "Agendado"
  | "Confirmado"
  | "Em Produção"
  | "Pronto"
  | "Entregue"
  | "Concluído"
  | "Cancelado";

export interface Order {
  id: string;
  clientId: string;
  type: "Simples" | "Composto";
  status: OrderStatus;
  items: Array<{ productId: string; quantity: number }>;
  dueDate: string;
  total: number;
  notes?: string;
}

export interface Event {
  id: string;
  name: string;
  clientId: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  guests: number;
  orderId?: string;
  status: "Agendado" | "Em Andamento" | "Concluído" | "Cancelado";
  notes?: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  mark: string;
  model: string;
  capacity: number;
  status: "Disponível" | "Em Serviço" | "Manutenção";
}

export interface Delivery {
  id: string;
  orderId: string;
  eventId?: string;
  driverId: string;
  vehicleId: string;
  departureDate: string;
  arrivalDate?: string;
  status: "Pendente" | "Em Trânsito" | "Entregue" | "Cancelada";
}

export interface Requisition {
  id: string;
  sector: string;
  manager: string;
  type: "Inicial" | "Complementar";
  status: "Pendente" | "Aprovada" | "Entregue" | "Concluída";
  date: string;
  notes?: string;
}

export interface FinancialRecord {
  id: string;
  type: "Receita" | "Despesa";
  amount: number;
  category: string;
  description: string;
  date: string;
  status: "Pago" | "Pendente" | "Parcial";
}

export interface InventoryMovement {
  id: string;
  productId: string;
  type: "Entrada" | "Saída" | "Ajuste" | "Perda/Vencimento";
  quantity: number;
  date: string;
  responsible: string;
  notes?: string;
}

export interface Shift {
  id: string;
  sector: string;
  manager: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "Planeado" | "A Decorrer" | "Concluído";
  notes?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  date: string;
  action: string;
  entity: string;
  details?: string;
}

export interface MaterialIssue {
  id: string;
  materialId: string;
  missingQuantity: number;
  responsibleId: string;
  justification: string;
  estimatedLoss: number;
  date: string;
}

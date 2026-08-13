/** Presentation labels only; API and persisted enum values remain unchanged. */
const labels: Record<string, string> = {
  'TipoMaterial.REUTILIZAVEL': 'Reutilizável', REUTILIZAVEL: 'Reutilizável', Reutilizavel: 'Reutilizável',
  'TipoMaterial.CONSUMIVEL': 'Consumível', CONSUMIVEL: 'Consumível', Consumivel: 'Consumível',
  'EstadoMaterial.DISPONIVEL': 'Disponível', DISPONIVEL: 'Disponível', Disponivel: 'Disponível',
  'EstadoMaterial.RESERVADO': 'Reservado', RESERVADO: 'Reservado', Reservado: 'Reservado',
  'EstadoMaterial.EM_USO': 'Em Uso', EM_USO: 'Em Uso',
  'EstadoMaterial.DANIFICADO': 'Danificado', DANIFICADO: 'Danificado',
  'EstadoMaterial.MANUTENCAO': 'Manutenção', MANUTENCAO: 'Manutenção', Manutencao: 'Manutenção',
};

export function enumLabel(value: unknown): string {
  const raw = String(value ?? '');
  return labels[raw] ?? raw;
}

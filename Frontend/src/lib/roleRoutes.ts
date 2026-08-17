export function getDefaultRouteForRole(role?: string): string {
    switch (role) {
      case "Administrador":
      case "Gerente":
        return "/";
      case "Atendimento":
        return "/caixa";
      case "Cozinha":
      case "Pastelaria":
        return "/producao";
      case "Armazém":
        return "/armazem";
      case "Controlador de Materiais":
        return "/controlo-materiais";
      case "Motorista":
        return "/logistica";
      case "Financeiro":
        return "/financeiro";
      default:
        return "/";
    }
  }
  
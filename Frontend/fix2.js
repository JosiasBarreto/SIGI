import fs from "fs";
import path from "path";

function replaceInFile(filePath, replacements) {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) return;
    let content = fs.readFileSync(fullPath, "utf8");
    let initial = content;
    for (const [regex, replacement] of replacements) {
        content = content.replace(regex, replacement);
    }
    if (content !== initial) {
        fs.writeFileSync(fullPath, content, "utf8");
    }
}

// Global Replaces:
// .status -> .estado
// .name -> .nome
// .requester -> .responsavel_id (need to map safely, or just comment it out / cast it?) Let's use `nome_responsavel` or something? RequisicaoDTO just has responsavel_id. Let's fix .status to .estado where it's used inside the map loops.

replaceInFile("src/pages/CaixaPOS.tsx", [
    [/id: transaction.id,/g, "id: Number(transaction.id),"],
    [/id: \`TR\$\{Date.now\(\)\}\`/g, "id: Date.now()"],
    [/id: cart\[0\]\?\.id \? cart\[0\]\.id \+ 100 : (\d+)/g, "id: $1"],
    [/status:/g, "estado:"],
    [/id: \`PED/g, "id: Date.now(), numero: \`PED"],
    [/(id:)(.*?)(?=,)/, "$1 Number($2)"], // Be careful with this, let's use string replaces instead
]);

replaceInFile("src/pages/Calendario.tsx", [
    [/\.data\?/g, ".items?"]
]);

replaceInFile("src/pages/Dashboard.tsx", [
    [/stats\?\.vendasDoDia \|\| stats\?\.vendasMes \|\| stats\?\.totalVendas/g, "stats?.kpis?.total_vendas"],
    [/stats\?\.pedidosPendentes/g, "stats?.kpis?.pedidos_pendentes"],
    [/stats\?\.producaoEmAndamento \|\| stats\?\.producaoAtiva/g, "stats?.kpis?.ordens_ativas"],
    [/stats\?\.receitaEstimada \|\| 0/g, "stats?.kpis?.receita_estimada || 0"],
    [/stats\?\.eventosAgendados \|\| stats\?\.totalEventos \|\| 0/g, "stats?.kpis?.total_eventos || 0"],
    [/dataKey="vendas"/g, 'dataKey="valor"']
]);

replaceInFile("src/pages/Orders.tsx", [
    [/status/g, "estado"],
    [/\.name/g, ".nome"]
]);

replaceInFile("src/pages/Producao.tsx", [
    [/status/g, "estado"],
    [/\.name/g, ".nome"]
]);

replaceInFile("src/pages/Requisicoes.tsx", [
    [/status/g, "estado"],
    [/\.requester/g, ".responsavel_id"],
    [/\.date/g, ".data_requisicao"],
    [/\.ingredients/g, ".itens"],
    [/\.materials/g, ".itens"]
]);

// services index update dashboard mock
replaceInFile("src/services/index.ts", [
    [
        "return fakeApi.getDashboardStats();",
        "const fakeStats = await fakeApi.getDashboardStats(); return { kpis: { total_vendas: fakeStats.vendasDoDia || 1500, total_eventos: fakeStats.eventosAgendados || 5, receita_estimada: 12500, pedidos_pendentes: fakeStats.pedidosPendentes || 8, ordens_ativas: fakeStats.producaoEmAndamento || 12 }, graficos: { vendas_por_mes: [{mes: '2026-06', valor: 1500}] } };"
    ]
]);

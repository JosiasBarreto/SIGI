import fs from 'fs';
import path from 'path';

function fixFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Replace .data with .items for queries
  content = content.replace(/(Response|Response1|Response2|Response3|\w+Response)\?\.data/g, '$1?.items');
  content = content.replace(/= data\?\.data/g, '= data?.items');
  content = content.replace(/= ordersResponse\?\.data/g, '= ordersResponse?.items');
  content = content.replace(/= shiftsResponse\?\.data/g, '= shiftsResponse?.items');
  content = content.replace(/= clientsResponse\?\.data/g, '= clientsResponse?.items');
  content = content.replace(/= productsResponse\?\.data/g, '= productsResponse?.items');
  content = content.replace(/= reqResponse\?\.data/g, '= reqResponse?.items');
  content = content.replace(/= logsResponse\?\.data/g, '= logsResponse?.items');
  content = content.replace(/= reqsResponse\?\.data/g, '= reqsResponse?.items');
  content = content.replace(/= prodsResponse\?\.data/g, '= prodsResponse?.items');
  content = content.replace(/= itemsResponse\?\.data/g, '= itemsResponse?.items');
  content = content.replace(/= suppliesResponse\?\.data/g, '= suppliesResponse?.items');
  content = content.replace(/= requisitionsResponse\?\.data/g, '= requisitionsResponse?.items');
  content = content.replace(/= transactionsResponse\?\.data/g, '= transactionsResponse?.items');
  content = content.replace(/= eventsResponse\?\.data/g, '= eventsResponse?.items');
  content = content.replace(/= orders\?\.data/g, '= orders?.items');
  
  // Custom manual replacements from lint errors:
  
  fs.writeFileSync(fullPath, content, 'utf8');
}

[
  'src/pages/CaixaPOS.tsx',
  'src/pages/Calendario.tsx',
  'src/pages/Dashboard.tsx',
  'src/pages/Financeiro.tsx',
  'src/pages/Orders.tsx',
  'src/pages/Producao.tsx',
  'src/pages/Requisicoes.tsx',
  'src/pages/Turnos.tsx'
].forEach(fixFile);

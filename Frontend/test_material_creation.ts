import apiClient from './src/api/client';

async function test() {
    try {
        const res = await apiClient.post('/v1/armazem/materiais', {
            nome: "Chapa de Teste 2",
            categoria: "Estruturas",
            tipo: "Consumivel",
            quantidade_inicial: 150,
            valor_unitario: 24.50,
            armazem_id: 2
        });
        console.log("Success with quantidade_inicial:", res.data);
    } catch (e: any) {
        console.log("Failed with quantidade_inicial:", e.response?.data);
    }

    try {
        const res = await apiClient.post('/v1/armazem/materiais', {
            nome: "Chapa de Teste 3",
            categoria: "Estruturas",
            tipo: "Consumivel",
            quantidade: 150,
            valor_unitario: 24.50,
            armazem_id: 2
        });
        console.log("Success with quantidade:", res.data);
    } catch (e: any) {
        console.log("Failed with quantidade:", e.response?.data);
    }

    try {
        const res = await apiClient.post('/v1/armazem/materiais', {
            nome: "Chapa de Teste 4",
            categoria: "Estruturas",
            tipo: "Consumivel",
            stock_atual: 150,
            valor_unitario: 24.50,
            armazem_id: 2
        });
        console.log("Success with stock_atual:", res.data);
    } catch (e: any) {
        console.log("Failed with stock_atual:", e.response?.data);
    }
}
test();

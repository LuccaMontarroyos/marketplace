import api from "./api";
import { obterToken } from "@/utils/token";


export async function criarContaStripe() {
    const token = obterToken();
    const response = await api.post('/stripe/account',{}, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    return response.data;
}

export async function gerarLinkOnBoarding() {
    const token = obterToken();
    const response = await api.get('/stripe/account-link', {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    return response.data;
}
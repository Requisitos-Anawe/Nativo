interface TraducaoInterface {
    id: string,
    texto: string,
    discurso: {
        id: string,
        data_criacao: string,
        discurso_categoria: {
            data_criacao: string,
            descricao: string,
            id: string
        },
        idioma: {
            data_criacao: string,
            nome: string,
            id: string
        },
        texto:string
    },
    idioma: {
        data_criacao: string,
        nome: string,
        id: string
    },
    usuario: string,
    data_criacao: string
}
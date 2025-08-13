import re

def limpar_cpf(cpf: str) -> str:
    """Remove tudo que não for dígito."""
    return re.sub(r"\D", "", cpf)

def validar_cpf(cpf: str) -> bool:
    """Valida CPF pelo cálculo dos dígitos verificadores."""
    cpf = limpar_cpf(cpf)

    if len(cpf) != 11 or cpf == cpf[0] * 11:
        return False

    soma1 = sum(int(cpf[i]) * (10 - i) for i in range(9))
    digito1 = (soma1 * 10 % 11) % 10
    if digito1 != int(cpf[9]):
        return False

    soma2 = sum(int(cpf[i]) * (11 - i) for i in range(10))
    digito2 = (soma2 * 10 % 11) % 10
    if digito2 != int(cpf[10]):
        return False

    return True

def formatar_cpf(cpf: str) -> str:
    """Formata CPF para XXX.XXX.XXX-XX."""
    cpf = limpar_cpf(cpf)
    return f"{cpf[:3]}.{cpf[3:6]}.{cpf[6:9]}-{cpf[9:]}"

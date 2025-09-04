import { Injectable } from '@nestjs/common';

@Injectable()
export class CpfValidationService {
  /**
   * Valida se um CPF é válido
   * @param cpf CPF a ser validado
   * @returns true se o CPF for válido, false caso contrário
   */
  isValidCPF(cpf: string): boolean {
    // Remove caracteres não numéricos
    cpf = cpf.replace(/[^\d]/g, '');

    // Verifica se tem 11 dígitos
    if (cpf.length !== 11) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;

    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) return false;

    return true;
  }

  /**
   * Formata um CPF para exibição
   * @param cpf CPF sem formatação
   * @returns CPF formatado (xxx.xxx.xxx-xx)
   */
  formatCPF(cpf: string): string {
    const cleanCPF = cpf.replace(/[^\d]/g, '');
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  /**
   * Remove a formatação de um CPF
   * @param cpf CPF formatado
   * @returns CPF apenas com números
   */
  cleanCPF(cpf: string): string {
    return cpf.replace(/[^\d]/g, '');
  }
}

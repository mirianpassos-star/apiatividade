export class NotificacaoService {
  static async enviarEmail(emailCliente: string, cotacaoId: string): Promise<void> {
    console.log(`[E-MAIL SIMULADO] Cotação #${cotacaoId} para ${emailCliente}`);
  }

  static async dispararWebhook(payload: object): Promise<void> {
    console.log("[WEBHOOK SIMULADO]", JSON.stringify(payload));
  }

  static gerarLinkWhatsApp(telefone: string, cotacaoId: string): string {
    const numero = telefone.replace(/\D/g, "");
    const texto = encodeURIComponent(
      `Olá! Gostaria de dar andamento na minha cotação #${cotacaoId}.`,
    );
    return `https://api.whatsapp.com/send?phone=${numero}&text=${texto}`;
  }
}

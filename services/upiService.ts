
// Mock API service for UPI interactions
export const UPIService = {
  /**
   * Simulates an API call to validate a VPA (Virtual Payment Address)
   */
  validateVPA: async (vpa: string): Promise<{ valid: boolean; name?: string }> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Simple mock validation logic
    if (vpa.includes('@') && vpa.length > 5) {
        // Mock name generation based on VPA
        const mockName = vpa.split('@')[0].replace('.', ' ').replace(/[0-9]/g, '').toUpperCase();
       return { valid: true, name: mockName || 'VERIFIED USER' };
    }
    return { valid: false };
  },
  
  /**
   * Generates a standard UPI deep link and returns a QR code image URL
   */
  generateQRUrl: (vpa: string, name: string, amount: number, note: string = ''): string => {
      const upiString = `upi://pay?pa=${vpa}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
      // Use public QR code API for demonstration
      return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiString)}`;
  },

  /**
   * Simulates processing a payment through a gateway
   */
  processPayment: async (amount: number, vpa: string): Promise<{ success: boolean; transactionId?: string }> => {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      
      // Simulate 90% success rate
      if (Math.random() > 0.1) {
          return { success: true, transactionId: 'UPI' + Date.now().toString() };
      }
      return { success: false };
  }
};

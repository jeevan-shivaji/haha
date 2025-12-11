
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Investment } from "../types";

// Initialize Gemini Client
// We assume process.env.API_KEY is available as per instructions
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const MODEL_FLASH = 'gemini-2.5-flash';

export const GeminiService = {
  /**
   * Chat with a financial advisor persona.
   */
  async *chatStream(history: { role: string; parts: { text: string }[] }[], newMessage: string) {
    const chat = ai.chats.create({
      model: MODEL_FLASH,
      config: {
        systemInstruction: "You are a world-class financial advisor and tax planner. Provide concise, actionable, and empathetic financial advice. Format your responses with Markdown for readability.",
      },
      history: history,
    });

    const result = await chat.sendMessageStream({ message: newMessage });
    
    for await (const chunk of result) {
      yield chunk.text;
    }
  },

  /**
   * Analyze an investment portfolio.
   */
  async analyzePortfolio(portfolio: Investment[]): Promise<string> {
    const portfolioSummary = portfolio.map(p => 
      `- ${p.name} (${p.symbol}): ${p.shares} shares @ $${p.avgCost} (Current: $${p.currentPrice})`
    ).join('\n');

    const prompt = `
      Analyze the following investment portfolio. 
      Provide 3 key strengths, 3 risks, and 3 actionable recommendations for diversification or optimization.
      
      Portfolio:
      ${portfolioSummary}
    `;

    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: prompt,
      config: {
        systemInstruction: "You are a strict and analytical investment manager."
      }
    });

    return response.text || "Unable to analyze portfolio at this time.";
  },

  /**
   * Identify potential tax deductions from a list of transactions.
   */
  async identifyTaxDeductions(transactions: Transaction[]): Promise<any[]> {
    const expenseData = transactions
      .filter(t => t.type === 'EXPENSE')
      .map(t => ({ id: t.id, description: t.description, amount: t.amount, category: t.category }));

    if (expenseData.length === 0) return [];

    const prompt = `
      Review the following list of expenses. Identify which ones are likely tax-deductible under standard US tax law for a freelancer or small business owner.
      Return a JSON array of objects.
    `;

    try {
      const response = await ai.models.generateContent({
        model: MODEL_FLASH,
        contents: `${prompt}\n${JSON.stringify(expenseData)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                transactionId: { type: Type.STRING },
                reason: { type: Type.STRING },
                confidence: { type: Type.STRING, enum: ["HIGH", "MEDIUM", "LOW"] }
              }
            }
          }
        }
      });

      const text = response.text;
      if (!text) return [];
      return JSON.parse(text);
    } catch (error) {
      console.error("Gemini Tax Analysis Error:", error);
      return [];
    }
  },

  /**
   * General categorization helper
   */
  async suggestCategory(description: string): Promise<string> {
    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: `Categorize this transaction description into one word (e.g., Food, Travel, Utilities, Salary, Software): "${description}"`,
    });
    return response.text?.trim() || "Uncategorized";
  },

  /**
   * Fetch recent news for the portfolio using Google Search Grounding
   */
  async fetchPortfolioNews(portfolio: Investment[]): Promise<{ content: string; sources: any[] }> {
    if (portfolio.length === 0) {
      return { 
        content: "Please add investments to your portfolio to view relevant market news and updates here.", 
        sources: [] 
      };
    }

    const companies = portfolio.map(p => p.name).join(', ');
    const prompt = `Find the latest important financial news and market updates for these companies: ${companies}. 
    Focus on stock performance, earnings, major announcements, or sector trends affecting them. 
    Format the output as a concise news digest with bullet points.`;

    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return {
      content: response.text || "No specific news found at this time.",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  },

  /**
   * Verify stock symbol and get details
   */
  async validateStock(symbol: string): Promise<{ isValid: boolean; name?: string; price?: number }> {
    const prompt = `Check if the stock symbol '${symbol}' represents a valid publicly traded company currently listed on a major exchange (like NYSE, NASDAQ, etc.). 
    If it is valid, provide the exact company name and the latest available stock price in USD.
    Output ONLY a single line in this format:
    VALID|Company Name|Price
    
    Example:
    VALID|Apple Inc.|175.50
    
    If it is not a valid or currently trading symbol, output:
    INVALID`;

    try {
      const response = await ai.models.generateContent({
        model: MODEL_FLASH,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text?.trim();
      if (text && text.includes('VALID|')) {
        // Simple parsing since we asked for a strict format
        // Depending on the model, it might still wrap in markdown or add text, so we search for the pattern
        const match = text.match(/VALID\|(.*?)\|([\d,.]+)/);
        if (match && match.length >= 3) {
          const priceStr = match[2].replace(/,/g, '');
          return {
            isValid: true,
            name: match[1].trim(),
            price: parseFloat(priceStr)
          };
        }
      }
      return { isValid: false };
    } catch (error) {
      console.error("Stock validation error:", error);
      return { isValid: false };
    }
  },

  /**
   * Search for stock symbols (Autocomplete)
   */
  async searchSymbols(query: string): Promise<{ symbol: string; name: string }[]> {
    if (query.length < 2) return [];

    const prompt = `Suggest up to 5 valid stock market ticker symbols matching "${query}". 
    The query could be a company name or part of a symbol.
    Return a JSON array where each object has "symbol" and "name".`;

    try {
      const response = await ai.models.generateContent({
        model: MODEL_FLASH,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                symbol: { type: Type.STRING },
                name: { type: Type.STRING }
              }
            }
          }
        }
      });
      
      const text = response.text;
      if (!text) return [];
      return JSON.parse(text);
    } catch (error) {
      console.error("Symbol search error:", error);
      return [];
    }
  }
};

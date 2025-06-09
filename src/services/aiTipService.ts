
// src/services/aiTipService.ts
import { 
  LOCAL_STORAGE_OPENROUTER_API_KEY, 
  LOCAL_STORAGE_SELECTED_OPENROUTER_MODEL, 
  DEFAULT_OPENROUTER_MODEL 
} from '../constants';
import type { Language } from '../constants'; // Import Language type

export interface AiTipError {
  key: string; // Translation key
  fallback: string; // Fallback message
  params?: Record<string, string | number>;
}

const generatePrompt = (balance: number, recentTransactionsCount: number, currencyCode: string, currencySymbol: string, language: Language): string => {
  let financialStatusDescription = "stable";
  if (balance < 0) {
    financialStatusDescription = "currently in debt";
  } else if (balance < 100) { // Assuming USD-like scale, adjust if necessary based on currency context
    financialStatusDescription = "on the lower side";
  } else if (balance > 5000) { // Adjust based on currency/user context
    financialStatusDescription = "looking healthy";
  }

  let transactionActivityDescription = "moderate";
  if (recentTransactionsCount < 5) {
    transactionActivityDescription = "low";
  } else if (recentTransactionsCount > 20) {
    transactionActivityDescription = "high";
  }
  
  const languageInstruction = language === 'zh-TW' ? '請以繁體中文回答。' : 'Please respond in English.';

  return `
    You are Clarity, the helpful AI assistant built into the ClarityLedger app. Your mission is to empower users by providing clear, encouraging, and actionable financial insights. You are a friendly guide, not a strict financial planner.

    Here's a snapshot of the user's current financial situation within ClarityLedger:
    - Current Account Balance: ${currencySymbol}${balance.toFixed(2)} ${currencyCode}
    - Recent Transaction Volume: ${transactionActivityDescription} (${recentTransactionsCount} transactions logged recently)
    - Overall Financial Standing (derived): ${financialStatusDescription}

    Based *only* on this information, generate ONE concise (2-3 sentences maximum), practical, and uplifting financial tip. The tip should be directly relevant to what the user might be experiencing and what they can do *within ClarityLedger* or with their general financial habits.

    **Key Guidelines for Your Tip:**

    1.  **Be Actionable & Specific:**
        *   Suggest a concrete step the user can take.
        *   Instead of "Save more," suggest *how* or *what to review*. For example, "Consider setting up a small, recurring transfer to your savings in ClarityLedger."
    2.  **Leverage ClarityLedger Features (Implied):**
        *   Frame advice around actions like reviewing spending categories, setting budget goals, tracking recurring items, or utilizing financial reports *if relevant to the tip*. (e.g., "ClarityLedger's reports can help you spot...")
    3.  **Maintain an Encouraging & Empathetic Tone:**
        *   Be positive, supportive, and non-judgmental, regardless of their balance.
        *   Acknowledge progress or effort where appropriate.
    4.  **Tip Focus Areas (Choose ONE relevant theme):**
        *   **Spending Habits:** Identifying patterns, potential savings.
        *   **Savings Strategies:** Building emergency funds, goal-setting.
        *   **Budgeting:** Utilizing ClarityLedger's budget features (if applicable to the tip).
        *   **Debt Management:** (If balance is negative) Small steps towards reduction.
        *   **Financial Literacy:** A small piece of useful knowledge.
        *   **Celebrating Progress:** (If balance is healthy) Reinforcing good habits.
    5.  **Strict Formatting:**
        *   **ONE tip only.**
        *   **Maximum 2-3 sentences.**
        *   **Plain text output.** No markdown, no emojis, no lists.
    6.  **Language:** ${languageInstruction}

    **Example Scenarios & Desired Output Style:**

    *   **User Situation:** Low Balance, High Transaction Volume.
        **Tip Example:** "With many recent transactions in ClarityLedger, now could be a great time to explore your expense breakdown. Identifying your top spending categories might reveal easy ways to adjust and boost your balance!"

    *   **User Situation:** Healthy Balance, Low Transaction Volume.
        **Tip Example:** "It's great to see a healthy balance in ClarityLedger! To keep the momentum, perhaps set a new savings goal within the app, or automate a small recurring deposit to watch your savings grow effortlessly."

    *   **User Situation:** Negative Balance (In Debt), Moderate Transaction Volume.
        **Tip Example:** "Managing debt takes effort, and tracking it in ClarityLedger is a solid step. Consider if there's one recurring expense you could slightly reduce this month to free up a little extra for your debt payments—every bit helps!"

    *   **User Situation:** Moderate Balance, Moderate Transaction Volume.
        **Tip Example:** "You're doing well managing your finances in ClarityLedger! To gain even more insight, try checking the monthly income vs. expense trend chart. It can offer a clear picture of your cash flow over time."

    Now, provide a tailored financial tip for the user based on their current snapshot detailed above.
  `;
};


export const getFinancialTip = async (
  balance: number, 
  recentTransactionsCount: number,
  currencyCode: string,
  currencySymbol: string,
  language: Language 
): Promise<string | AiTipError> => {
  const apiKey = localStorage.getItem(LOCAL_STORAGE_OPENROUTER_API_KEY);
  const modelName = localStorage.getItem(LOCAL_STORAGE_SELECTED_OPENROUTER_MODEL) || DEFAULT_OPENROUTER_MODEL;

  if (!apiKey) {
    return { 
        key: 'aiFinancialTip.errorApiKeyNotSet', 
        fallback: 'API Key for OpenRouter is not set. Please configure it in settings.' 
    };
  }

  const prompt = generatePrompt(balance, recentTransactionsCount, currencyCode, currencySymbol, language);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150, // Max tokens for 2-3 sentences
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})); // Catch if errorData is not JSON
      const errorMessage = errorData?.error?.message || response.statusText || 'Unknown error';
      const errorCode = errorData?.error?.code || response.status;

      console.error("OpenRouter API Error:", errorCode, errorMessage, errorData);

      if (response.status === 401) {
        return { 
            key: 'aiFinancialTip.errorInvalidApiKey', 
            fallback: 'Invalid OpenRouter API Key. Please check it in settings.' 
        };
      }
      if (response.status === 429) {
        return { 
            key: 'aiFinancialTip.errorRateLimit', 
            fallback: `Rate limit exceeded for OpenRouter model: ${modelName}. Please check your OpenRouter account.`,
            params: { model: modelName }
        };
      }
      return { 
          key: 'aiFinancialTip.errorRequestFailed', 
          fallback: `OpenRouter API request failed for model ${modelName}: ${response.status} - ${errorMessage}`,
          params: { model: modelName, status: response.status, message: errorMessage }
      };
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      console.error("OpenRouter Error: No choices returned", data);
      return { 
        key: 'aiFinancialTip.errorNoChoices',
        fallback: 'The AI model returned no choices. This might be due to content filters or an issue with the model.'
      };
    }
    
    const tipMessage = data.choices[0]?.message?.content?.trim();
    
    if (!tipMessage) {
      console.error("OpenRouter Error: Empty message content", data.choices[0]);
      return {
        key: 'aiFinancialTip.errorEmptyMessage',
        fallback: 'The AI model returned an empty message. Please try again.'
      };
    }
    
    return tipMessage;

  } catch (error: any) {
    console.error("Error fetching financial tip:", error);
    // Check if it's a network error (fetch throws TypeError for network issues)
    if (error instanceof TypeError && error.message === "Failed to fetch") { // Common browser message
        return { 
            key: 'aiFinancialTip.errorNetwork', 
            fallback: `Network error when trying to connect to OpenRouter for model ${modelName}. Please check your connection.`,
            params: { model: modelName, message: error.message }
        };
    }
    // Generic error
    return { 
        key: 'aiFinancialTip.errorDefault', 
        fallback: `Sorry, an unexpected error occurred while fetching a tip. ${error.message || ''}`,
        params: { message: error.message || 'Unknown error' }
    };
  }
};

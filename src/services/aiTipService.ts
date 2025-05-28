// src/services/aiTipService.ts
import { 
  LOCAL_STORAGE_OPENROUTER_API_KEY, 
  LOCAL_STORAGE_SELECTED_OPENROUTER_MODEL, 
  DEFAULT_OPENROUTER_MODEL 
} from '../constants';

export interface AiTipError {
  key: string; // Translation key
  fallback: string; // Fallback message
  params?: Record<string, string | number>;
}

const generatePrompt = (balance: number, recentTransactionsCount: number, currencyCode: string, currencySymbol: string): string => {
  let financialStatus = "stable";
  if (balance < 0) {
    financialStatus = "in debt";
  } else if (balance < 100) { // Assuming USD-like scale, adjust if necessary
    financialStatus = "low";
  } else if (balance > 5000) {
    financialStatus = "healthy";
  }

  let activityLevel = "moderate";
  if (recentTransactionsCount < 5) {
    activityLevel = "low";
  } else if (recentTransactionsCount > 20) {
    activityLevel = "high";
  }

  return `
    You are a friendly and insightful financial advisor.
    A user has a current balance of ${currencySymbol}${balance.toFixed(2)} ${currencyCode} and has made ${recentTransactionsCount} transactions recently.
    Their financial status can be described as ${financialStatus} and their transaction activity is ${activityLevel}.
    Provide a concise (2-3 sentences), actionable, and encouraging financial tip based on this information.
    Focus on practical advice they can implement.
    Avoid overly generic advice. Be specific if possible.
    Do not use markdown formatting in your response.
    The user is managing their personal finances.
    For example, if they have low balance and high activity, you might suggest reviewing spending habits.
    If they have a healthy balance and low activity, you might suggest looking into investment options.
  `;
};


export const getFinancialTip = async (
  balance: number, 
  recentTransactionsCount: number,
  currencyCode: string,
  currencySymbol: string
): Promise<string | AiTipError> => {
  const apiKey = localStorage.getItem(LOCAL_STORAGE_OPENROUTER_API_KEY);
  const modelName = localStorage.getItem(LOCAL_STORAGE_SELECTED_OPENROUTER_MODEL) || DEFAULT_OPENROUTER_MODEL;

  if (!apiKey) {
    return { 
        key: 'aiFinancialTip.errorApiKeyNotSet', 
        fallback: 'API Key for OpenRouter is not set. Please configure it in settings.' 
    };
  }

  const prompt = generatePrompt(balance, recentTransactionsCount, currencyCode, currencySymbol);

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
        max_tokens: 150,
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

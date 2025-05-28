import { LOCAL_STORAGE_OPENROUTER_API_KEY, LOCAL_STORAGE_SELECTED_OPENROUTER_MODEL, DEFAULT_OPENROUTER_MODEL } from '../constants';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface AiTipError {
  key: string; 
  params?: Record<string, string | number>; 
  fallback: string; 
}

export const getFinancialTip = async (
  balance: number, 
  recentTransactionsCount: number,
  currencyCode: string,
  currencySymbol: string
): Promise<string | AiTipError> => {
  const apiKey = localStorage.getItem(LOCAL_STORAGE_OPENROUTER_API_KEY);
  const selectedModel = localStorage.getItem(LOCAL_STORAGE_SELECTED_OPENROUTER_MODEL) || DEFAULT_OPENROUTER_MODEL;

  if (!apiKey) {
    return { key: "aiFinancialTip.errorApiKeyNotSet", fallback: "OpenRouter API Key is not set." };
  }

  const formattedBalance = `${currencySymbol}${balance.toFixed(2)}`;
  const prompt = `
    Provide a concise and actionable financial tip (under 60 words) for someone with a current account balance of ${formattedBalance} (currency: ${currencyCode}).
    They have made ${recentTransactionsCount} transactions recently.
    If the balance is negative, offer encouragement and a tip to improve their financial situation.
    If balance is very high, suggest smart ways to manage or grow wealth.
    Be positive and constructive. Do not include any pre-amble, just the tip.
    The tip should be general financial advice.
  `;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      console.error(`Error fetching financial tip from OpenRouter (Status: ${response.status}). Response data:`, JSON.stringify(errorData, null, 2));
      
      let errorMessageDetail = response.statusText;
      if (errorData && errorData.error && typeof errorData.error.message === 'string') {
        errorMessageDetail = errorData.error.message;
      } else if (errorData && typeof errorData.detail === 'string') {
        errorMessageDetail = errorData.detail;
      } else if (typeof errorData === 'string') {
        errorMessageDetail = errorData;
      }

      if (response.status === 401) {
        return { key: "aiFinancialTip.errorInvalidApiKey", fallback: "Invalid OpenRouter API Key."};
      }
      if (response.status === 429) {
         return { key: "aiFinancialTip.errorRateLimit", params: { model: selectedModel }, fallback: `Rate limit exceeded for OpenRouter (model: ${selectedModel}).` };
      }
      return { 
        key: "aiFinancialTip.errorRequestFailed", 
        params: { model: selectedModel, status: response.status.toString(), message: errorMessageDetail },
        fallback: `OpenRouter API request failed (model: ${selectedModel}): ${response.status} - ${errorMessageDetail}`
      };
    }

    const data = await response.json();
    
    if (data && data.choices && Array.isArray(data.choices) && data.choices.length > 0 && 
        data.choices[0] && data.choices[0].message && typeof data.choices[0].message.content === 'string') {
      return data.choices[0].message.content.trim();
    } else {
      console.error("Unexpected response structure from OpenRouter. Full response data:", JSON.stringify(data, null, 2));
      if (data && data.choices && Array.isArray(data.choices) && data.choices.length === 0) {
        return { key: "aiFinancialTip.errorNoChoices", fallback: "AI model returned no choices." };
      }
      if (data && data.choices && data.choices[0] && data.choices[0].message && 
          (data.choices[0].message.content === null || data.choices[0].message.content === undefined)) {
         return { key: "aiFinancialTip.errorEmptyMessage", fallback: "AI model returned an empty message." };
      }
      if (data && data.error && typeof data.error.message === 'string') {
        return { key: "aiFinancialTip.errorApiError", params: { message: data.error.message, model: selectedModel }, fallback: `API error: ${data.error.message} (model: ${selectedModel})` };
      }
      return { key: "aiFinancialTip.errorUnexpectedResponse", fallback: "Unexpected response structure from AI service." };
    }

  } catch (error) {
    console.error("Network or other error fetching financial tip from OpenRouter:", error);
    let message = "Network or client-side issue.";
    if (error instanceof Error) {
        message = error.message;
    }
    return { key: "aiFinancialTip.errorNetwork", params: { model: selectedModel, message }, fallback: `Error connecting to OpenRouter (model: ${selectedModel}): ${message}` };
  }
};
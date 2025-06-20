
// src/services/ocrService.ts
import Tesseract from 'tesseract.js';
import { TransactionType } from '../types';
import { Language, LOCAL_STORAGE_OPENROUTER_API_KEY, LOCAL_STORAGE_OCR_OPENROUTER_MODEL, DEFAULT_OCR_OPENROUTER_MODEL, LOCAL_STORAGE_SELECTED_OPENROUTER_MODEL, DEFAULT_OPENROUTER_MODEL } from '../constants';

export interface OCRResult {
  text: string;
  amount: number | null;
  date: string | null; // YYYY-MM-DD
  suggestedCategory: string | null;
}

// Interface for AI-enhanced extraction result
export interface AIExtractionResult {
  amount?: number | null;
  date?: string | null; // YYYY-MM-DD
  vendor?: string | null;
  category?: string | null;
  currency?: string | null; // e.g., USD, TWD
  rawResponse?: string; // The full AI response for debugging
  error?: string; // If AI processing failed
}


const COMMON_CURRENCY_SYMBOLS = ['$', '€', '£', '¥', 'NT$', 'HK$', '元', 'RM', '₹', '₱', '₩', '฿', '₫', '₪', '₽', '₺'];
const COMMON_CURRENCY_CODES = ['USD', 'EUR', 'GBP', 'JPY', 'TWD', 'HKD', 'CNY', 'MYR', 'INR', 'PHP', 'KRW', 'THB', 'VND', 'ILS', 'RUB', 'TRY'];

// More robust date patterns
const DATE_PATTERNS = [
    /(?<year>\d{4})[.\-/年](?<month>\d{1,2})[.\-/月](?<day>\d{1,2})日?/i, // YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD, YYYY年MM月DD日
    /(?<month>\d{1,2})[.\-/月](?<day>\d{1,2})[.\-/年](?<year>\d{2,4})日?/i, // MM-DD-YYYY, MM/DD/YY
    /(?<day>\d{1,2})[.\-/月](?<month>\d{1,2})[.\-/年](?<year>\d{2,4})日?/i, // DD-MM-YYYY (less common in US, common in EU/Asia)
    /(?<year>\d{4})年(?<month>\d{1,2})月(?<day>\d{1,2})/i, // Chinese specific
    /(?<month_name>Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(?<day>\d{1,2}),?\s+(?<year>\d{4})/i, // Month DD, YYYY (Capture month_name)
    /(?<day>\d{1,2})\s+(?<month_name>Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec),?\s+(?<year>\d{4})/i, // DD Month, YYYY (Capture month_name)
];

const MONTH_MAP: { [key: string]: number } = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

// Keywords that often precede or are near the total amount.
const englishAmountKeywords = [
    'total', 'amount due', 'balance due', 'grand total', 'subtotal', 'total amount', 'payment due', 'invoice total', 'receipt total'
];
const chineseAmountKeywords = [
    '總計', '合計', '總金額', '應付金額', '金額', '款項', '費用總計', '发票总额', '小計', '总额', '合计金额'
];


const parseAmount = (text: string): number | null => {
    const lines = text.split('\n');
    let bestCandidate: { value: number, score: number } | null = null;

    const currencyRegexParts = COMMON_CURRENCY_SYMBOLS.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const currencySymbolsRegexStr = `(?:${currencyRegexParts.join('|')})`;
    const amountNumberRegex = new RegExp(
        `(?:${currencySymbolsRegexStr}\\s*)?` + 
        `(\\d{1,3}(?:[,.]\\d{3})*(?:[.,]\\d{1,2})?|\\d+(?:[.,]\\d{1,2})?)` + 
        `(?:\\s*${currencySymbolsRegexStr})?`, 
        'g' 
    );


    for (const line of lines) {
        const lineLower = line.toLowerCase();
        let lineScore = 0;

        for (const keyword of englishAmountKeywords) {
            if (lineLower.includes(keyword)) {
                lineScore += 10; 
                break; 
            }
        }
        for (const keyword of chineseAmountKeywords) {
            if (lineLower.includes(keyword)) {
                lineScore += 10; 
                break;
            }
        }
        
        if (new RegExp(currencySymbolsRegexStr).test(line)) {
            lineScore += 2;
        }

        const matches = line.matchAll(amountNumberRegex);
        for (const match of matches) {
            let amountStr = match[1]; 
            if (amountStr) {
                const hasCommaDecimal = /,\d\d$/.test(amountStr) && !/\.\d\d$/.test(amountStr); 
                const hasPeriodThousandsCommaDecimal = /\.\d{3},\d\d$/.test(amountStr); 

                if (hasPeriodThousandsCommaDecimal) {
                    amountStr = amountStr.replace(/\./g, '').replace(',', '.'); 
                } else if (hasCommaDecimal && amountStr.includes('.')) { 
                     amountStr = amountStr.replace(/\./g, '').replace(',', '.');
                } else if (hasCommaDecimal) { 
                    amountStr = amountStr.replace(',', '.');
                } else { 
                    amountStr = amountStr.replace(/,/g, '');
                }
                
                const num = parseFloat(amountStr);

                if (!isNaN(num) && num > 0) { 
                    let currentScore = lineScore;
                    if ((lineScore > 0 || new RegExp(currencySymbolsRegexStr).test(line)) && amountStr.includes('.')) {
                        currentScore += 5;
                    }
                    if (lineScore < 5 && (amountStr.length > 7 || (amountStr.length >= 4 && !amountStr.includes('.')))) {
                        // This condition might wrongly penalize amounts like 1000 when no keywords are present.
                        // Let's only penalize if it doesn't look like a date to avoid date misinterpretation.
                        if (!DATE_PATTERNS.some(p => p.test(line))) { // If it's not likely a date line
                            currentScore -= 5; // Penalize long numbers without decimals if no keywords
                        }
                    }
                    // Prefer larger values if scores are equal, but be careful with very small values if a good candidate already exists
                    if (num < 1 && bestCandidate && bestCandidate.value > 10 && currentScore < (bestCandidate.score - 5)) {
                        // Avoid tiny values if a much larger, reasonably scored candidate exists
                        continue;
                    }

                    if (!bestCandidate || currentScore > bestCandidate.score) {
                        bestCandidate = { value: num, score: currentScore };
                    } else if (currentScore === bestCandidate.score && num > bestCandidate.value) {
                        // If scores are tied, prefer the larger amount (e.g. total vs. tax)
                        bestCandidate = { value: num, score: currentScore };
                    }
                }
            }
        }
    }
    return bestCandidate ? bestCandidate.value : null;
};


const parseDate = (text: string): string | null => {
    for (const pattern of DATE_PATTERNS) {
        const match = pattern.exec(text);
        if (match && match.groups) {
            let { day, month, year, month_name } = match.groups;

            let dayNum = parseInt(day, 10);
            let monthNum = parseInt(month, 10); // Will be NaN if 'month' group is undefined or not a number
            let yearNum = parseInt(year, 10);

            if (isNaN(monthNum) && month_name && MONTH_MAP[month_name.toLowerCase().substring(0,3)]) {
                monthNum = MONTH_MAP[month_name.toLowerCase().substring(0,3)];
            } else if (isNaN(monthNum) && month && MONTH_MAP[month.toLowerCase().substring(0,3)]) {
                 // Fallback for older patterns or if month_name wasn't captured but month (numeric) was intended
                 // This part is mostly defensive, assuming 'month' group should be numeric.
                 // The `month_name` check above is more specific for patterns with named months.
                monthNum = MONTH_MAP[month.toLowerCase().substring(0,3)];
            }


            if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) continue;

            if (yearNum < 100) { 
                yearNum += (yearNum > (new Date().getFullYear() % 100) + 5) ? 1900 : 2000; 
            }

            if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) continue;

            // Basic validation for days in month (doesn't account for leap year perfectly for Feb 29)
            if ((monthNum === 2 && dayNum > 29) || ([4, 6, 9, 11].includes(monthNum) && dayNum > 30)) continue;
            
            // Final check by creating a date object
            try {
              const d = new Date(yearNum, monthNum - 1, dayNum);
              // Check if the created date matches the parsed components (handles invalid dates like Feb 30)
              if (d.getFullYear() === yearNum && d.getMonth() === monthNum - 1 && d.getDate() === dayNum) {
                  return d.toISOString().split('T')[0];
              }
            } catch (e) {
              // Invalid date, continue to next pattern
              continue;
            }
        }
    }
    return null;
};


const suggestCategory = (text: string): string | null => {
  const lowerText = text.toLowerCase();
  
  // Prioritized categories and more extensive keywords
  const categoriesWithKeywords: { name: string, keywords: string[] }[] = [
    // Specific services often billed
    { name: 'Utilities', keywords: ['utility', 'electric', 'water', 'gas', 'power', 'energy', 'sanitation', 'waste', 'internet', 'comcast', 'xfinity', 'verizon fios', 'at&t u-verse', 'pg&e', 'con edison', 'duke energy', '台電', '台灣電力', '自來水', '水費', '天然氣', '瓦斯', '中華電信', '網路費', '第四台', '電費', '能源賬單', '寬頻', '固網', '電力公司', '燃氣公司', '水務公司'] },
    { name: 'Credit Card', keywords: ['visa', 'mastercard', 'master card', 'amex', 'american express', 'discover', 'credit card payment', '信用卡費', '信用卡帳單', '信用咭月結單', '卡費', '銀行月結單'] },
    { name: 'Tax', keywords: ['tax', 'irs', 'internal revenue service', 'revenue', 'hmrc', 'cra', 'ato', 'income tax', 'property tax', 'sales tax', 'vat', 'gst', '稅', '税单', '稅務', '所得稅', '營業稅', '地價稅', '房屋稅', '國稅局'] },
    // Common spending areas
    { name: 'Groceries', keywords: ['grocery', 'market', 'supermarket', 'whole foods', 'trader joe', 'safeway', 'kroger', 'walmart neighborhood market', 'target market', 'aldi', 'lidl', 'publix', 'wegmans', 'stop & shop', 'giant', 'food lion', 'heb', 'meijer', 'sprouts', 'fresh market', '全聯', 'px mart', '頂好', 'wellcome', 'citysuper', 'jasons', 'carrefour', 'rt-mart', 'costco', '愛買', '松青', '惠康', '超市', '菜市場', '食品杂货', '生鮮食品', '日常用品'] },
    { name: 'Food', keywords: ['restaurant', 'cafe', 'food', 'meal', 'takeout', 'delivery', 'mcdonalds', "mcdonald's", 'starbucks', 'subway', 'pizza hut', 'dominos', 'kfc', 'burger king', 'coffee', 'lunch', 'dinner', 'breakfast', 'brunch', '外賣', '餐廳', '咖啡廳', '膳食', '小吃', '速食', '便當', '飲料店', '手搖飲', 'foodpanda', 'ubereats', 'grabfood'] },
    { name: 'Transport', keywords: ['transport', 'uber', 'lyft', 'taxi', 'bus', 'train', 'subway', 'mrt', 'gasoline', 'petrol', 'fuel', 'parking', 'toll', 'flight', 'airline', '交通', '公車', '火車', '地鐵', '捷運', '油費', '停車費', '過路費', '計程車', '高鐵', '台鐵', '機票', '油站', '加油'] },
    { name: 'Housing', keywords: ['rent', 'mortgage', 'housing', 'strata', 'hoa', 'lease payment', '租金', '房貸', '住房費用', '管理費', '物業費'] },
    { name: 'Health', keywords: ['health', 'pharmacy', 'doctor', 'dentist', 'hospital', 'clinic', 'cvs', 'walgreens', 'rite aid', 'medical', 'vision', 'insurance premium', '健康', '藥房', '診所', '醫院', '保健品', '醫藥費', '牙醫', '看醫生', '健保費'] },
    { name: 'Shopping', keywords: ['amazon', 'target', 'walmart', 'best buy', 'ebay', 'clothing', 'electronics', 'books', 'department store', 'online shopping', '購物', '百貨公司', '網購', '服飾', '電器產品', '書店', '商場'] },
    { name: 'Entertainment', keywords: ['movie', 'cinema', 'concert', 'netflix', 'spotify', 'hulu', 'disney+', 'youtube premium', 'games', 'steam', 'playstation', 'xbox', 'nintendo', 'tickets', 'event', '娛樂', '電影院', '音樂會', '遊戲', '串流服務', '門票', 'KTV'] },
    { name: 'Education', keywords: ['education', 'school', 'college', 'university', 'tuition', 'books', 'course', 'udemy', 'coursera', 'student loan', '教育', '學費', '書本費', '課程費用', '補習班', '學貸'] },
    { name: 'Travel', keywords: ['travel', 'airline ticket', 'hotel', 'accommodation', 'airbnb', 'expedia', 'booking.com', 'vacation', 'trip', 'tourism', '旅遊', '機票', '住宿費用', '旅行社', '度假'] },
    // General
    { name: 'Other', keywords: ['other', 'miscellaneous', 'fee', 'service charge', 'donation', '其他', '雜項', '手續費', '服務費', '捐款'] }
  ];

  for (const category of categoriesWithKeywords) {
    if (category.keywords.some(keyword => lowerText.includes(keyword.toLowerCase()))) {
      return category.name;
    }
  }
  return null;
};


let worker: Tesseract.Worker | null = null;
let workerInitializing = false;
const TESSERACT_LANG_COMBINED = 'eng+chi_tra'; // Always use combined for auto-detection

const initializeWorker = async (
  onProgress?: (progress: number, status: string) => void
): Promise<Tesseract.Worker> => {
  if (worker && (worker as any).tesseractLang === TESSERACT_LANG_COMBINED && typeof worker.recognize === 'function') {
    try {
        // Ping worker or check status if possible, for now, assume it's ok if object exists and has methods
        return worker;
    } catch (e) {
        console.warn("Existing worker seems unresponsive, re-initializing.", e);
        await worker.terminate().catch(err => console.error("Error terminating unresponsive worker:", err));
        worker = null;
    }
  }
  
  if (workerInitializing) {
    // Wait for the ongoing initialization to complete
    return new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        if (!workerInitializing && worker && (worker as any).tesseractLang === TESSERACT_LANG_COMBINED && typeof worker.recognize === 'function') {
          clearInterval(interval);
          resolve(worker);
        } else if (!workerInitializing && (!worker || (worker as any).tesseractLang !== TESSERACT_LANG_COMBINED || typeof worker.recognize !== 'function')) {
            // Previous initialization might have failed or resulted in a worker for a different language
            clearInterval(interval);
            console.warn("Previous worker initialization might have failed or resulted in an unexpected state. Re-attempting initialization.");
            worker = null; // Reset worker to force new initialization
            initializeWorker(onProgress).then(resolve).catch(reject); // Retry initialization
        }
      }, 200);
      setTimeout(() => {
        clearInterval(interval);
        if (workerInitializing) { // Check again, in case it just finished
            console.error("Worker initialization timed out.");
            workerInitializing = false; // Reset flag as the attempt is over
            reject(new Error("Worker initialization timed out."));
        }
      }, 15000); // 15 seconds timeout for initialization
    });
  }

  workerInitializing = true;
  if (worker) { // If a worker exists but is not suitable (e.g. wrong language), terminate it
    try {
      await worker.terminate(); 
    } catch (termError) {
      console.warn("Error terminating existing Tesseract worker:", termError);
    }
    worker = null;
  }

  try {
    console.log(`Initializing Tesseract worker for languages: ${TESSERACT_LANG_COMBINED}`);
    const newWorker = await Tesseract.createWorker(TESSERACT_LANG_COMBINED, 1, { 
      logger: m => {
        if (onProgress && m.status === 'recognizing text') {
          onProgress(Math.round(m.progress * 100), m.status);
        }
      },
    });
    (newWorker as any).tesseractLang = TESSERACT_LANG_COMBINED; // Store language with worker instance for check
    worker = newWorker;
    workerInitializing = false;
    console.log(`Tesseract worker initialized successfully for ${TESSERACT_LANG_COMBINED}.`);
    return newWorker;
  } catch (error) {
    workerInitializing = false;
    console.error("Failed to initialize Tesseract worker:", error);
    throw error; // Re-throw to be caught by the caller
  }
};


export const recognizeImage = async (
  imageFile: File | string, 
  onProgress?: (progress: number, status: string) => void
): Promise<OCRResult> => {
  const currentWorker = await initializeWorker(onProgress);

  try {
    const { data: { text } } = await currentWorker.recognize(imageFile);
    
    const amount = parseAmount(text);
    const date = parseDate(text);
    const suggestedCategory = suggestCategory(text);

    return { text, amount, date, suggestedCategory };
  } catch (error) {
    console.error("Error during OCR processing:", error);
    // If OCR fails, terminate the worker so it gets re-initialized next time.
    if (worker) {
        await worker.terminate().catch(e => console.warn("Error terminating worker post-OCR-failure:", e));
        worker = null;
    }
    throw error; // Re-throw to be caught by the caller
  }
};

export const terminateWorker = async () => {
  if (workerInitializing) {
    // Wait a bit for initialization to potentially finish or timeout
    await new Promise(resolve => setTimeout(resolve, 500)); 
  }
  if (worker) {
    try {
        await worker.terminate();
        console.log("Tesseract worker terminated successfully.");
    } catch (error) {
        console.error("Error terminating Tesseract worker:", error);
    } finally {
        worker = null;
        workerInitializing = false;
    }
  } else {
     // Ensure the flag is reset even if worker is null (e.g., if initialization failed before worker was assigned)
     workerInitializing = false;
  }
};


const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};

export const enhanceOcrWithAI = async (
  rawOcrText: string,
  imageFile: File | undefined, 
  appLanguage: Language = 'en',
  userCurrencyCode: string,
  userCurrencySymbol: string
): Promise<AIExtractionResult> => {
  const apiKey = localStorage.getItem(LOCAL_STORAGE_OPENROUTER_API_KEY);
  const ocrModelFromStorage = localStorage.getItem(LOCAL_STORAGE_OCR_OPENROUTER_MODEL);
  const generalModelFromStorage = localStorage.getItem(LOCAL_STORAGE_SELECTED_OPENROUTER_MODEL);

  let modelToUse = DEFAULT_OCR_OPENROUTER_MODEL; 
  if (ocrModelFromStorage && ocrModelFromStorage.trim() !== '') {
    modelToUse = ocrModelFromStorage;
  } else if (generalModelFromStorage && generalModelFromStorage.trim() !== '') {
    modelToUse = generalModelFromStorage;
  }

  if (!apiKey) {
    return { error: "OpenRouter API Key is not set." };
  }

  let imageBase64: string | undefined = undefined;
  let imageMimeType: string | undefined = undefined;
  const potentiallyMultimodalModels = ['claude-3', 'gpt-4o', 'gpt-4-turbo', 'gpt-4-vision', 'llava', 'gemini', 'qwen']; 
  const isMultimodal = potentiallyMultimodalModels.some(m => modelToUse.toLowerCase().includes(m));

  if (isMultimodal && imageFile) {
    try {
      imageBase64 = await fileToBase64(imageFile);
      imageMimeType = imageFile.type;
    } catch (e) {
      console.error("Error converting image to Base64:", e);
      // Optionally return an error or proceed without image if base64 conversion fails
    }
  }
  
  const languageInstruction = appLanguage === 'zh-TW' ? `請以繁體中文進行分析與回答。` : `Analyze and respond in English.`;

  const systemPromptContent = `You are ClarityAI, an intelligent OCR and data extraction assistant specialized in analyzing financial documents like bills, receipts, and invoices from images. Your primary task is to accurately extract key information and return it in a structured JSON format.

The user's primary currency is ${userCurrencyCode} (symbol: ${userCurrencySymbol}). This is important for interpreting amounts.

**Extraction Guidelines:**

1.  **Document Understanding:** You are processing an image that is a financial document. Interpret text, layout, and common financial terms accordingly.
2.  **Target Information:**
    *   \`amount\`: The primary total amount. Look for labels like 'Total', 'Grand Total', 'Amount Due', '付款總額', '總計', '合計', '應付金額'.
    *   \`date\`: The transaction date (format as YYYY-MM-DD).
    *   \`vendor\`: The store or service provider's name (often at the top).
    *   \`category\`: A relevant spending category (e.g., Groceries, Utilities, Food).
    *   \`currency\`: The currency code (e.g., ${userCurrencyCode}, EUR, JPY) for the extracted 'amount'.

3.  **Currency Extraction Logic (Strict Order of Preference):**
    a.  **Primary Goal - User's Currency:** Search the document *first* for an amount explicitly stated in the user's currency (**${userCurrencyCode}**, symbol: **${userCurrencySymbol}**). This might be a secondary display (e.g., in parentheses). If found, extract this amount and set the 'currency' field to **"${userCurrencyCode}"**. This is the highest priority.
    b.  **Fallback - Explicit Other Currency:** If the user's currency (**${userCurrencyCode}**) is *not* found on the document, but another currency is clearly and unambiguously displayed (e.g., JPY, EUR, USD), extract the amount associated with *that* currency. Set the 'currency' field to the 3-letter code of that found currency.
    c.  **Last Resort - Assume User's Currency:** If *no currency symbols or codes are clearly identifiable* anywhere on the document, then assume any prominent numerical value you extract as the 'amount' is in the user's currency (**${userCurrencyCode}**). Set the 'currency' field to **"${userCurrencyCode}"**.
    d.  **Amount Value:** The 'amount' field in your JSON output must be the numerical value **as it appears on the document**, corresponding to the currency identified by the rules above.
    e.  **NO AI Conversion:** You **must not** perform any currency conversion on the extracted 'amount'. Only report values explicitly present or reasonably inferred as per the hierarchy above.

4.  **Data Quality:**
    *   If any piece of information is unclear, ambiguous, or not found, use \`null\` for that field in the JSON.
    *   Prioritize information that appears to be part of a final summary or total on the document.

**JSON Output Format (Strict):**
You MUST respond ONLY with a single, valid JSON object. Do not include any explanatory text before or after the JSON.
The JSON object should have the following structure:
\`\`\`json
{
  "amount": <number | null>,
  "date": "<YYYY-MM-DD | null>",
  "vendor": "<string | null>",
  "category": "<string | null>",
  "currency": "<string | null>"
}
\`\`\`
Accepted category values: "Groceries", "Utilities", "Food", "Transport", "Shopping", "Health", "Entertainment", "Travel", "Tax", "Credit Card", "Other", or \`null\`.

**Examples (user's primary currency is ${userCurrencyCode} (${userCurrencySymbol})):**

*   Document shows: "Total JPY 5,500 (equivalent to ${userCurrencySymbol}307.10 ${userCurrencyCode})".
    AI Output (prioritizing user's currency if explicitly shown):
    \`\`\`json
    {"amount": 307.10, "date": "YYYY-MM-DD", "vendor": "Vendor Name", "category": "SomeCategory", "currency": "${userCurrencyCode}"}
    \`\`\`

*   Document shows: "Price: €50.00". (User's currency ${userCurrencyCode} is not mentioned).
    AI Output (falling back to explicitly shown foreign currency):
    \`\`\`json
    {"amount": 50.00, "date": "YYYY-MM-DD", "vendor": "Vendor Name", "category": "SomeCategory", "currency": "EUR"}
    \`\`\`

*   Document shows: "Amount: 120.00" (no currency symbols or codes).
    AI Output (assuming user's currency as last resort):
    \`\`\`json
    {"amount": 120.00, "date": "YYYY-MM-DD", "vendor": "Vendor Name", "category": "SomeCategory", "currency": "${userCurrencyCode}"}
    \`\`\`

*   Document shows: "Payment Due: ${userCurrencySymbol}75.50 ${userCurrencyCode}".
    AI Output (user's currency is explicitly shown and primary):
    \`\`\`json
    {"amount": 75.50, "date": "YYYY-MM-DD", "vendor": "Vendor Name", "category": "SomeCategory", "currency": "${userCurrencyCode}"}
    \`\`\`

**Language for Analysis and Response:**
${languageInstruction}

Begin analysis.
`;

  const userMessageContent: any[] = [];

  if (isMultimodal && imageBase64 && imageMimeType) {
    userMessageContent.push({
        type: "image_url",
        image_url: {
          url: `data:${imageMimeType};base64,${imageBase64}`
        }
    });
  }
  
  let textContentForUserMessage = "Please analyze the provided data from the bill/receipt.\n";
  if (rawOcrText && rawOcrText.trim() !== "") {
    textContentForUserMessage += `If an image is also provided, prioritize information from the image. Use the following OCR text as a strong reference or if the image is absent/unclear:\n\nOCR Text:\n---\n${rawOcrText}\n---`;
  } else if (userMessageContent.length > 0) { // This means an image was added
     textContentForUserMessage = "Please analyze the provided image of a bill or receipt.";
  } else { // No image and no OCR text
     return { error: "No image or text provided for AI analysis." };
  }
  userMessageContent.push({ type: "text", text: textContentForUserMessage });


  const promptMessages = [
    { role: "system", content: systemPromptContent },
    { role: "user", content: userMessageContent }
  ];


  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: promptMessages,
        max_tokens: 500, 
        temperature: 0.1, // Reduced temperature for more deterministic output
        response_format: { type: "json_object" } 
      }),
    });

    const responseBodyText = await response.text(); 

    if (!response.ok) {
      let errorData = {};
      try {
        errorData = JSON.parse(responseBodyText); 
      } catch (e) {
        // console.warn("Response body was not JSON:", responseBodyText);
      }
      const finalErrorData = errorData as any;
      console.error("OpenRouter AI OCR Error:", response.status, finalErrorData, "Model:", modelToUse);
      return { error: `AI extraction failed: ${response.status} ${finalErrorData?.error?.message || response.statusText}`, rawResponse: responseBodyText };
    }

    const data = JSON.parse(responseBodyText); 
    const aiTextResponse = data.choices?.[0]?.message?.content;

    if (!aiTextResponse) {
      return { error: "AI returned no content.", rawResponse: JSON.stringify(data) };
    }

    try {
      let jsonStr = typeof aiTextResponse === 'string' ? aiTextResponse.trim() : JSON.stringify(aiTextResponse);
      
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) {
        jsonStr = match[2].trim(); 
      }
      
      const parsedResult: AIExtractionResult = JSON.parse(jsonStr);
      return { ...parsedResult, rawResponse: aiTextResponse };

    } catch (e) {
      console.error("Error parsing AI JSON response:", e, "\nRaw AI response string:", aiTextResponse);
      return { error: "Failed to parse AI's JSON response. See console for raw AI output.", rawResponse: aiTextResponse };
    }

  } catch (err: any) {
    console.error("Error during AI OCR enhancement:", err);
    return { error: `Network or other error during AI enhancement: ${err.message}` };
  }
};


import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import {
  Language,
  DEFAULT_LANGUAGE,
  LOCAL_STORAGE_LANGUAGE_KEY,
  LOCAL_STORAGE_DARK_MODE_KEY,
  AVAILABLE_CURRENCIES,
  DEFAULT_CURRENCY_CODE,
  LOCAL_STORAGE_SELECTED_CURRENCY_KEY
} from '../constants';
import { CurrencyDefinition } from '../types';

// Define the shape of the context data
interface AppContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  selectedCurrencyCode: string;
  setSelectedCurrencyCode: (code: string) => void;
  selectedCurrencySymbol: string;
  formatCurrency: (amount: number) => string;
  isTranslationsLoading: boolean;
}

// Create the context with a default undefined value
export const AppContext = createContext<AppContextType | undefined>(undefined);

// Define translations type
type Translations = Record<string, string | Record<string, any>>;

// Complete fallback translations for offline use - copied from locale files
const FALLBACK_TRANSLATIONS: Record<Language, Translations> = {
  'en': {
    "appName": "ClarityLedger",
    "footer": "© {year} ClarityLedger. Manage your finances with clarity.",
    "navbar": {
      "dashboard": "Dashboard",
      "settings": "Settings",
      "transactions": "Transactions",
      "reports": "Reports",
      "billScan": "Scan Bill",
      "recurring": "Recurring"
    },
    "sidebar": {
      "helpCenter": "Help Center"
    },
    "topbar": {
      "welcomeMessage": "Manage Your Finances",
      "openSidebar": "Open sidebar",
      "closeSidebar": "Close sidebar"
    },
    "reportsPage": {
      "spendingByCategoryChart": {
        "title": "Spending by Category Over Time",
        "noData": "No expense data available for the selected period to display this chart."
      },
      "filters": {
        "title": "Report Filters",
        "startDateLabel": "Start Date",
        "endDateLabel": "End Date",
        "applyButton": "Apply Filters"
      },
      "topExpenseCategoriesChart": {
        "title": "Top Expense Categories",
        "noData": "No expense data available for the selected period to display this chart."
      },
      "tabs": {
        "ariaLabel": "Report Tabs",
        "spendingTrend": "Spending Trend",
        "topCategories": "Top Categories",
        "cashFlow": "Cash Flow"
      },
      "cashFlowReport": {
        "summaryTitle": "Cash Flow Summary",
        "totalIncome": "Total Income",
        "totalExpenses": "Total Expenses",
        "netCashFlow": "Net Cash Flow",
        "incomeSourcesTitle": "Income Sources",
        "expenseCategoriesTitle": "Expense Categories",
        "categoryHeader": "Category",
        "amountHeader": "Amount",
        "noIncomeData": "No income recorded for this period.",
        "noExpenseData": "No expenses recorded for this period."
      }
    },
    "settingsPage": {
      "title": "Settings",
      "apiSettingsTitle": "API Settings",
      "apiSettingsDescription": "Configure your OpenRouter API Key and preferred model for AI-powered financial tips. Get an API key from OpenRouter.ai. Settings are stored locally in your browser.",
      "openRouterLink": "OpenRouter.ai",
      "apiKeyLabel": "OpenRouter API Key",
      "apiKeyPlaceholder": "Enter your OpenRouter API Key",
      "apiKeyHelp": "Leave blank and save to remove the key.",
      "modelNameLabel": "AI Model Name (for Financial Tips)",
      "modelNamePlaceholder": "e.g., deepseek/deepseek-chat",
      "modelNameHelp": "Enter the full model name from OpenRouter (e.g., `anthropic/claude-3-haiku-20240307`). If left empty, \"{defaultModel}\" will be used by default for AI tips.",
      "ocrModelNameLabel": "OCR AI Model Name (for Bill Scan)",
      "ocrModelNamePlaceholder": "e.g., qwen/qwen2.5-vl-72b-instruct:free",
      "ocrModelNameHelp": "Enter model for OCR enhancement (e.g., '{defaultModel}'). If empty, defaults to a specific OCR model or the financial tip model.",
      "saveButton": "Save Settings",
      "savingButton": "Saving...",
      "settingsSavedButton": "Settings Saved!",
      "successMessage": "Settings saved successfully!",
      "apiKeyRemovedMessage": "API Key removed. Model configuration updated.",
      "failureMessage": "Failed to save settings. Please try again.",
      "settingsUsageInfo": "ClarityLedger uses your OpenRouter key and specified models to provide AI features.",
      "uiSettingsTitle": "UI Settings",
      "languageLabel": "Language",
      "darkModeLabel": "Dark Mode",
      "currencySettingLabel": "Currency",
      "currencyChangedMessage": "Currency changed to {currency}.",
      "english": "English",
      "traditionalChinese": "繁體中文",
      "switchToLightMode": "Switch to Light Mode",
      "switchToDarkMode": "Switch to Dark Mode",
      "dataManagementTitle": "Data Management",
      "exportDataButton": "Export All Data",
      "exportFormatJson": "JSON",
      "exportCsvButton": "Export Transactions to CSV",
      "exportCsvSuccessMessage": "Transactions exported successfully as {filename}!",
      "exportCsvErrorMessage": "Failed to export transactions to CSV. Please try again.",
      "exportNoTransactionsMessage": "No transactions to export.",
      "importDataButton": "Import Data",
      "importConfirmTitle": "Confirm Import",
      "importConfirmMessage": "Are you sure you want to import data? This will replace ALL current transactions. This action cannot be undone.",
      "importConfirmMessageFull": "Are you sure you want to import data? This will replace ALL current transactions, budgets, recurring transaction templates, and application settings (API key, AI model, language, theme, currency, custom categories). This action cannot be undone.",
      "importConfirmButton": "Confirm Import",
      "importCancelButton": "Cancel",
      "exportSuccessMessage": "Data exported successfully as {filename}!",
      "exportSuccessMessageFull": "All data (transactions, budgets, settings, recurring templates) exported as {filename}!",
      "exportErrorMessage": "Failed to export data. Please try again.",
      "importSuccessMessage": "Data imported successfully!",
      "importSuccessInfoNavigate": "Navigate to the Dashboard to see the changes.",
      "importSuccessInfoReload": "Please refresh the page for all settings to take full effect.",
      "importProcessingMessage": "Processing import...",
      "importErrorMessageFile": "Failed to read file or invalid file type. Please select a valid JSON backup file.",
      "importErrorMessageFormat": "Invalid JSON format in backup file. Please check the file content.",
      "importErrorMessageValidation": "Invalid data structure in backup file.",
      "importInvalidDataSubText": "The backup file is not in the expected format or is corrupted. Please ensure you are using a valid ClarityLedger backup file.",
      "customCategories": {
        "title": "Category Management",
        "description": "Manage your custom income and expense categories. Default categories cannot be deleted.",
        "incomeTitle": "Income Categories",
        "expenseTitle": "Expense Categories",
        "defaultCategories": "Default Categories:",
        "yourCustomCategories": "Your Custom Categories:",
        "noCustomYet": "No custom categories added yet.",
        "addPlaceholder": "Enter new category name",
        "addButton": "Add",
        "errorEmptyName": "Category name cannot be empty.",
        "errorExists": "Category '{categoryName}' already exists.",
        "errorIsDefault": "Category '{categoryName}' is a default category and cannot be added as custom.",
        "addSuccess": "Category '{categoryName}' added successfully.",
        "deleteSuccess": "Category '{categoryName}' deleted.",
        "errorCannotDeleteDefault": "Default categories cannot be deleted here.",
        "confirmDeleteInUse": "Category '{categoryName}' is currently in use by some transactions. Deleting it will remove it from the selection list. Are you sure?"
      }
    },
    "helpCenterPage": {
      "title": "Help Center & FAQ",
      "faq": {
        "title": "Frequently Asked Questions",
        "q1": "How is my data stored?",
        "a1": "Your financial data is stored locally in your browser's storage (LocalStorage). It is not sent to any external server, ensuring your privacy.",
        "q2": "Can I use ClarityLedger offline?",
        "a2": "Yes, ClarityLedger is designed as a Progressive Web App (PWA) and can work offline once it has been loaded in your browser.",
        "q3": "How do I backup my data?",
        "a3": "You can export all your data, including transactions, budgets, recurring transaction templates, and settings, as a JSON file from the 'Data Management' section on the Settings page. You can also import this data back into the app.",
        "q4": "Are the AI Financial Tips free?",
        "a4": "ClarityLedger uses the OpenRouter API to provide AI tips. OpenRouter offers access to various AI models, some ofwhich may have free tiers or require credits. You need to provide your own OpenRouter API key in the Settings. Please check OpenRouter's pricing and terms."
      },
      "gettingStarted": {
        "title": "Getting Started Guide",
        "step": "Step {number}",
        "s1": "Navigate to the Dashboard to view your financial overview, including income, expenses, and balance summaries.",
        "s2": "Use the 'Add Transaction' button on the Dashboard to record your income and expenses. Be sure to select the correct type and category.",
        "s3": "Set monthly budgets for different expense categories in the 'Monthly Budgets' section on the Dashboard to track your spending goals. You can enable 'rollover' for budgets to carry over surplus/deficit to the next month.",
        "s4": "Manage recurring income and expenses in the 'Recurring' section to automate transaction entries.",
        "s5": "Visit the Settings page to configure your OpenRouter API key for AI financial tips, manage custom transaction categories, choose your preferred language and theme, and manage your application data (export/import)."
      },
      "contact": {
        "title": "Contact & Support",
        "p1": "{appName} is a locally-run application designed for personal use. Your data remains on your device.",
        "p2": "For general questions, please consult the FAQs above. If you encounter technical issues or have suggestions, you can (hypothetically) visit the project's GitHub page or community forum if one exists.",
        "githubLink": "Visit Project on GitHub (Example)"
      }
    },
    "dashboard": {
      "loading": "Loading dashboard data...",
      "transactionsTitle": "Transactions",
      "addTransactionButton": "Add Transaction",
      "expenseBreakdownTitle": "Expense Breakdown",
      "noExpensesForChart": "No expenses recorded yet to show a chart.",
      "noTransactions": "No transactions yet. Add one to get started!",
      "confirmDeleteTransaction": "Are you sure you want to delete this transaction?",
      "filters": {
        "title": "Filters",
        "show": "Show Filters",
        "hide": "Hide Filters",
        "keywordLabel": "Keyword Search",
        "keywordPlaceholder": "Description or Category...",
        "typeLabel": "Transaction Type",
        "typeAll": "All Types",
        "typeIncome": "Income",
        "typeExpense": "Expense",
        "startDateLabel": "Start Date",
        "endDateLabel": "End Date",
        "minAmountLabel": "Min Amount",
        "maxAmountLabel": "Max Amount",
        "tagLabel": "Tag Search",
        "tagPlaceholder": "e.g., work, important",
        "applyButton": "Apply Filters",
        "resetButton": "Reset Filters"
      },
      "budgets": {
        "title": "Monthly Budgets",
        "addBudgetButton": "Add Budget",
        "editBudgetButton": "Edit Budget",
        "noBudgetsSet": "No budgets set for this month. Click 'Add Budget' to create one.",
        "spent": "Spent",
        "target": "Target",
        "effectiveTarget": "Effective",
        "rolloverAmount": "Rollover",
        "remaining": "Remaining:",
        "overspentBy": "Overspent by:",
        "rolloverEnabledTooltip": "Rollover Enabled",
        "editButtonAriaLabel": "Edit budget for {category}",
        "deleteButtonAriaLabel": "Delete budget for {category}",
        "addBudgetModalTitle": "Add New Budget",
        "editBudgetModalTitle": "Edit Budget",
        "confirmDeleteBudget": "Are you sure you want to delete this budget?",
        "prevMonth": "Previous Month",
        "nextMonth": "Next Month",
        "previousMonthAriaLabel": "Go to previous month for budgets",
        "nextMonthAriaLabel": "Go to next month for budgets"
      },
      "addTransactionModalTitle": "Add New Transaction",
      "charts": {
        "incomeExpenseTrendTitle": "Income vs. Expense Trend (Last 6 Months)",
        "noTrendData": "Not enough data available to display trend chart."
      }
    },
    "transactionForm": {
      "modalTitle": "Add New Transaction",
      "descriptionLabel": "Description",
      "descriptionPlaceholder": "e.g., Groceries, Salary",
      "amountLabel": "Amount",
      "amountPlaceholder": "0.00",
      "typeLabel": "Type",
      "expenseButton": "Expense",
      "incomeButton": "Income",
      "categoryLabel": "Category",
      "selectCategoryPlaceholder": "Select a category...",
      "tagsLabel": "Tags (comma-separated)",
      "tagsPlaceholder": "e.g., work, personal, urgent",
      "dateLabel": "Date",
      "submitAddButton": "Add Transaction",
      "submitUpdateButton": "Update Transaction",
      "errors": {
        "descriptionRequired": "Description is required.",
        "amountRequired": "Amount is required.",
        "amountPositive": "Amount must be a positive number.",
        "dateRequired": "Date is required.",
        "categoryRequired": "Category is required."
      }
    },
    "transactionTable": {
      "category": "Category",
      "description": "Description",
      "date": "Date",
      "amount": "Amount",
      "actions": "Actions"
    },
    "budgetForm": {
      "categoryLabel": "Category",
      "selectCategoryPlaceholder": "Select an expense category...",
      "targetAmountLabel": "Target Amount",
      "monthYearLabel": "Month (YYYY-MM)",
      "editInfo": "Category and month cannot be changed when editing.",
      "allowRolloverLabel": "Allow rollover for this category",
      "submitAddButton": "Add Budget",
      "submitUpdateButton": "Update Budget",
      "errors": {
        "categoryRequired": "Category is required.",
        "amountRequired": "Target amount is required.",
        "amountPositive": "Target amount must be a positive number.",
        "monthYearInvalid": "Month format must be YYYY-MM (e.g., 2023-10).",
        "categoryBudgeted": "A budget for '{category}' already exists for this month."
      }
    },
    "transactionList": {
      "noTransactions": "No transactions yet. Add one to get started!",
      "noFilteredTransactions": "No transactions match your current filters."
    },
    "summaryDisplay": {
      "totalIncome": "Total Income",
      "totalExpenses": "Total Expenses",
      "currentBalance": "Current Balance",
      "incomeSubtext": "+X% from last month",
      "expenseSubtext": "-Y% from last month"
    },
    "categoryPieChart": {
      "noData": "No expense data to display chart."
    },
    "aiFinancialTip": {
      "title": "AI Financial Tip",
      "getNewTipButton": "Get New Tip",
      "gettingTipButton": "Getting Tip...",
      "initialMessage": "Click \"Get New Tip\" for personalized advice!",
      "infoText": "AI-generated tips are for informational purposes only. Powered by OpenRouter.",
      "errorTitle": "Tip Generation Failed",
      "errorApiKeyNotSet": "Could not fetch a tip: OpenRouter API Key is not set. Please configure it in the Settings page.",
      "errorInvalidApiKey": "Could not fetch a tip: Invalid OpenRouter API Key. Please check it in the Settings page.",
      "errorRateLimit": "Could not fetch a tip: Rate limit exceeded or quota finished for OpenRouter (model: {model}). Please check your OpenRouter account.",
      "errorRequestFailed": "OpenRouter API request failed (model: {model}): {status} - {message}",
      "errorDefault": "Sorry, I couldn't fetch a financial tip right now. {message}",
      "errorUnexpectedResponse": "Sorry, I received an unexpected response structure from the AI service while fetching a tip.",
      "errorNoChoices": "Sorry, the AI model returned no choices. This might be due to content filters, model settings, or an issue with the model. Please try a different model or prompt.",
      "errorEmptyMessage": "Sorry, the AI model returned an empty message. Please try again or a different model.",
      "errorApiError": "Sorry, an API error occurred: {message} (model: {model})",
      "errorNetwork": "Error connecting to OpenRouter (model: {model}): {message}",
      "errorGenericNetwork": "Sorry, I couldn't fetch a financial tip right now due to a network or client-side issue. Please try again later."
    },
    "billScanPage": {
      "title": "Scan Bill with OCR",
      "description": "Upload an image of your bill to automatically extract details.",
      "uploadTitle": "Upload Bill Image",
      "uploadLabel": "Upload a file",
      "dragAndDrop": "or drag and drop",
      "fileTypes": "PNG, JPG, GIF up to 10MB",
      "previewTitle": "Image Preview",
      "imagePreviewAlt": "Bill image preview",
      "processButton": "Extract Information (Standard)",
      "processButtonAI": "Extract with AI",
      "processingButton": "Extracting...",
      "resultsTitle": "Extracted Information",
      "extractedAmount": "Amount:",
      "extractedDate": "Date:",
      "extractedVendor": "Vendor:",
      "extractedCurrency": "Currency:",
      "suggestedCategory": "Suggested Category:",
      "fullText": "Full Extracted Text (Tesseract):",
      "noTextExtracted": "No text could be extracted from the image.",
      "notFound": "Not found",
      "noResultsYet": "Upload an image and click 'Extract Information' to see results.",
      "createTransactionButton": "Create Transaction",
      "transactionModalTitle": "Create Transaction from Bill",
      "defaultDescription": "Bill: {fileName}",
      "billSuffix": "Bill",
      "transactionAddedSuccess": "Transaction successfully created!",
      "errorTitle": "Error",
      "aiErrorTitle": "AI Extraction Error",
      "successTitle": "Success!",
      "errorNoImageSelected": "Please select an image file first.",
      "errorOcrFailed": "OCR processing failed: {message}",
      "errorAIFailed": "AI extraction failed: {message}",
      "errorNoDataForAI": "No OCR text or image available to send to AI for enhancement.",
      "aiEnhanceButton": "AI Enhance Extraction",
      "enhanceWithAIButton": "Enhance with AI",
      "aiProcessing": "AI Processing...",
      "aiEnhancedResultsTitle": "AI Enhanced Results",
      "aiDirectResultsTitle": "AI OCR Results",
      "tesseractResultsTitle": "Standard OCR Results",
      "tesseractResultsFallbackTitle": "Standard OCR Results (Fallback)",
      "aiErrorNotice": "AI enhancement failed. Using Standard OCR results if available.",
      "statusInitializing": "Initializing OCR engine...",
      "statusDone": "Extraction complete.",
      "statusError": "An error occurred.",
      "extractionMethodTitle": "Extraction Method",
      "methodStandardOCR": "Standard OCR",
      "methodStandardOCRDescription": "Fast, local processing using Tesseract.js.",
      "methodAIOCR": "AI OCR",
      "methodAIOCRDescription": "Slower, cloud-based AI for higher accuracy. Requires API key."
    },
    "recurringTransactionsPage": {
      "title": "Manage Recurring Transactions",
      "addRecurringButton": "Add Recurring",
      "addModalTitle": "Add Recurring Transaction",
      "editModalTitle": "Edit Recurring Transaction",
      "confirmDelete": "Are you sure you want to delete this recurring transaction template? This will not delete any transactions already generated by it.",
      "form": {
        "frequencyLabel": "Frequency",
        "startDateLabel": "Start Date",
        "endDateLabel": "End Date (Optional)",
        "isActiveLabel": "Active (auto-generate transactions)",
        "errors": {
          "startDateRequired": "Start date is required.",
          "endDateInvalid": "End date cannot be before start date."
        }
      },
      "frequencies": {
        "daily": "Daily",
        "weekly": "Weekly",
        "monthly": "Monthly",
        "yearly": "Yearly"
      },
      "list": {
        "noTemplates": "No recurring transaction templates found. Add one to get started!",
        "frequencyHeader": "Frequency",
        "nextDueDateHeader": "Next Due",
        "endDateHeader": "End Date",
        "lastGeneratedHeader": "Last Generated",
        "notGeneratedYet": "Never",
        "noEndDate": "N/A",
        "editAriaLabel": "Edit",
        "deleteAriaLabel": "Delete",
        "activateAriaLabel": "Activate",
        "deactivateAriaLabel": "Deactivate"
      }
    },
    "categories": {
      "Food": "Food",
      "Groceries": "Groceries",
      "Transport": "Transport",
      "Utilities": "Utilities",
      "Housing": "Housing",
      "Entertainment": "Entertainment",
      "Health": "Health",
      "Shopping": "Shopping",
      "Education": "Education",
      "Travel": "Travel",
      "Other": "Other",
      "Salary": "Salary",
      "Bonus": "Bonus",
      "Investment": "Investment",
      "Gift": "Gift",
      "Credit Card": "Credit Card",
      "Tax": "Tax"
    },
    "currencies": {
      "USD": "US Dollar",
      "EUR": "Euro",
      "JPY": "Japanese Yen",
      "GBP": "British Pound",
      "AUD": "Australian Dollar",
      "CAD": "Canadian Dollar",
      "CNY": "Chinese Yuan",
      "TWD": "New Taiwan Dollar",
      "HKD": "Hong Kong Dollar"
    }
  },
  'zh-TW': {
    "appName": "ClarityLedger",
    "footer": "© {year} ClarityLedger。清晰管理您的財務。",
    "navbar": {
      "dashboard": "儀表板",
      "settings": "設定",
      "transactions": "交易紀錄",
      "reports": "報告",
      "billScan": "掃描帳單",
      "recurring": "週期性交易"
    },
    "sidebar": {
      "helpCenter": "幫助中心"
    },
    "topbar": {
      "welcomeMessage": "管理您的財務",
      "openSidebar": "開啟側邊欄",
      "closeSidebar": "關閉側邊欄"
    },
    "reportsPage": {
      "spendingByCategoryChart": {
        "title": "按類別劃分之支出趨勢",
        "noData": "選定期間内無支出資料可顯示此圖表。"
      },
      "filters": {
        "title": "報告篩選器",
        "startDateLabel": "開始日期",
        "endDateLabel": "結束日期",
        "applyButton": "套用篩選"
      },
      "topExpenseCategoriesChart": {
        "title": "主要支出類別",
        "noData": "選定期間内無支出資料可顯示此圖表。"
      },
      "tabs": {
        "ariaLabel": "報告分頁",
        "spendingTrend": "支出趨勢",
        "topCategories": "主要類別",
        "cashFlow": "現金流量"
      },
      "cashFlowReport": {
        "summaryTitle": "現金流量摘要",
        "totalIncome": "總收入",
        "totalExpenses": "總支出",
        "netCashFlow": "淨現金流量",
        "incomeSourcesTitle": "收入來源",
        "expenseCategoriesTitle": "支出類別",
        "categoryHeader": "類別",
        "amountHeader": "金額",
        "noIncomeData": "此期間無收入記錄。",
        "noExpenseData": "此期間無支出記錄。"
      }
    },
    "settingsPage": {
      "title": "設定",
      "apiSettingsTitle": "API 設定",
      "apiSettingsDescription": "設定您的 OpenRouter API 金鑰和偏好模型以獲取 AI 財務提示。請至 OpenRouter.ai 取得 API 金鑰。設定將儲存在您的瀏覽器中。",
      "openRouterLink": "OpenRouter.ai",
      "apiKeyLabel": "OpenRouter API 金鑰",
      "apiKeyPlaceholder": "輸入您的 OpenRouter API 金鑰",
      "apiKeyHelp": "留空並儲存以移除金鑰。",
      "modelNameLabel": "AI 模型名稱 (財務提示用)",
      "modelNamePlaceholder": "例如：deepseek/deepseek-chat",
      "modelNameHelp": "輸入 OpenRouter 的完整模型名稱（例如：`anthropic/claude-3-haiku-20240307`）。如果留空，將預設使用 \"{defaultModel}\" 提供 AI 提示。",
      "ocrModelNameLabel": "OCR AI 模型名稱 (帳單掃描用)",
      "ocrModelNamePlaceholder": "例如：qwen/qwen2.5-vl-72b-instruct:free",
      "ocrModelNameHelp": "輸入用於 OCR 增強的模型（例如：'{defaultModel}'）。如果留空，將預設使用特定 OCR 模型或財務提示模型。",
      "saveButton": "儲存設定",
      "savingButton": "儲存中...",
      "settingsSavedButton": "設定已儲存！",
      "successMessage": "設定已成功儲存！",
      "apiKeyRemovedMessage": "API 金鑰已移除。模型配置已更新。",
      "failureMessage": "儲存設定失敗。請再試一次。",
      "settingsUsageInfo": "ClarityLedger 使用您的 OpenRouter 金鑰和指定模型來提供 AI 功能。",
      "uiSettingsTitle": "界面設定",
      "languageLabel": "語言",
      "darkModeLabel": "深色模式",
      "currencySettingLabel": "貨幣設定",
      "currencyChangedMessage": "貨幣已變更為 {currency}。",
      "english": "English",
      "traditionalChinese": "繁體中文",
      "switchToLightMode": "切換到淺色模式",
      "switchToDarkMode": "切換到深色模式",
      "dataManagementTitle": "資料管理",
      "exportDataButton": "匯出所有資料",
      "exportFormatJson": "JSON",
      "exportCsvButton": "將交易匯出為 CSV",
      "exportCsvSuccessMessage": "交易記錄已成功匯出為 {filename}！",
      "exportCsvErrorMessage": "將交易記錄匯出為 CSV 失敗。請再試一次。",
      "exportNoTransactionsMessage": "沒有可匯出的交易記錄。",
      "importDataButton": "匯入資料",
      "importConfirmTitle": "確認匯入",
      "importConfirmMessage": "您確定要匯入資料嗎？這將取代所有目前的交易記錄。此操作無法復原。",
      "importConfirmMessageFull": "您確定要匯入資料嗎？這將取代您所有目前的交易記錄、預算、週期性交易範本和應用程式設定（API 金鑰、AI 模型、語言、主題、貨幣、自訂類別）。此操作無法復原。",
      "importConfirmButton": "確認匯入",
      "importCancelButton": "取消",
      "exportSuccessMessage": "資料已成功匯出為 {filename}！",
      "exportSuccessMessageFull": "所有資料（交易、預算、設定、週期性範本）已成功匯出為 {filename}！",
      "exportErrorMessage": "匯出資料失敗。請再試一次。",
      "importSuccessMessage": "資料已成功匯入！",
      "importSuccessInfoNavigate": "請前往儀表板查看變更。",
      "importSuccessInfoReload": "請重新整理頁面以使所有設定完全生效。",
      "importProcessingMessage": "正在處理匯入...",
      "importErrorMessageFile": "讀取檔案失敗或檔案類型無效。請選擇一個有效的 JSON 備份檔案。",
      "importErrorMessageFormat": "備份檔案中的 JSON 格式無效。請檢查檔案內容。",
      "importErrorMessageValidation": "備份檔案中的資料結構無效。",
      "importInvalidDataSubText": "備份檔案格式不符合預期或已損毀。請確認您使用的是有效的 ClarityLedger 備份檔案。",
      "customCategories": {
        "title": "類別管理",
        "description": "管理您的自訂收入和支出類別。預設類別無法刪除。",
        "incomeTitle": "收入類別",
        "expenseTitle": "支出類別",
        "defaultCategories": "預設類別：",
        "yourCustomCategories": "您的自訂類別：",
        "noCustomYet": "尚未新增任何自訂類別。",
        "addPlaceholder": "輸入新類別名稱",
        "addButton": "新增",
        "errorEmptyName": "類別名稱不能為空。",
        "errorExists": "類別 '{categoryName}' 已存在。",
        "errorIsDefault": "類別 '{categoryName}' 是預設類別，不能作為自訂類別新增。",
        "addSuccess": "類別 '{categoryName}' 新增成功。",
        "deleteSuccess": "類別 '{categoryName}' 已刪除。",
        "errorCannotDeleteDefault": "預設類別無法在此刪除。",
        "confirmDeleteInUse": "類別 '{categoryName}' 目前正被某些交易使用。刪除後將從選擇列表中移除。您確定嗎？"
      }
    },
    "helpCenterPage": {
      "title": "幫助中心與常見問題",
      "faq": {
        "title": "常見問題",
        "q1": "我的資料是如何儲存的？",
        "a1": "您的財務資料儲存在您瀏覽器的本地儲存空間（LocalStorage）中。它不會被傳送到任何外部伺服器，以確保您的隱私。",
        "q2": "ClarityLedger 可以離線使用嗎？",
        "a2": "是的，ClarityLedger 設計為漸進式網頁應用程式（PWA），在瀏覽器中載入後即可離線工作。",
        "q3": "我如何備份我的資料？",
        "a3": "您可以從「設定」頁面的「資料管理」部分將所有資料（包括交易、預算、週期性交易範本和設定）匯出為 JSON 檔案。您也可以將此資料重新匯入應用程式中。",
        "q4": "AI 財務提示是免費的嗎？",
        "a4": "ClarityLedger 使用 OpenRouter API 提供 AI 提示。OpenRouter 提供對各種 AI 模型的存取，其中一些模型可能提供免費額度或需要付費。您需要在「設定」中提供您自己的 OpenRouter API 金鑰。請查閱 OpenRouter 的定價和條款。"
      },
      "gettingStarted": {
        "title": "入門指南",
        "step": "步驟 {number}",
        "s1": "前往「儀表板」查看您的財務總覽，包括收入、支出和餘額摘要。",
        "s2": "使用「儀表板」上的「新增交易」按鈕記錄您的收入和支出。請務必選擇正確的類型和類別。",
        "s3": "在「儀表板」的「每月預算」部分為不同的支出類別設定每月預算，以追踪您的支出目標。您可以為預算啟用「結轉」功能，將盈餘/赤字結轉至下個月。",
        "s4": "在「週期性交易」部分管理您的週期性收入和支出，以自動化交易登錄。",
        "s5": "前往「設定」頁面配置您的 OpenRouter API 金鑰以獲取 AI 財務提示、管理自訂交易類別、選擇您偏好的語言和主題，以及管理您的應用程式資料（匯出/匯入）。"
      },
      "contact": {
        "title": "聯絡與支援",
        "p1": "{appName} 是一款專為個人使用而設計的本機執行應用程式。您的資料會保留在您的裝置上。",
        "p2": "有關一般問題，請參閱上方的常見問題。如果您遇到技術問題或有任何建議，您可以（假設性地）造訪專案的 GitHub 頁面或社群論壇（如果有的話）。",
        "githubLink": "在 GitHub 上查看專案 (範例)"
      }
    },
    "dashboard": {
      "loading": "正在載入儀表板資料...",
      "transactionsTitle": "交易記錄",
      "addTransactionButton": "新增交易",
      "expenseBreakdownTitle": "支出分析",
      "noExpensesForChart": "尚無支出記錄可顯示圖表。",
      "noTransactions": "尚無交易記錄。新增一筆開始吧！",
      "confirmDeleteTransaction": "您確定要刪除此交易嗎？",
      "filters": {
        "title": "篩選器",
        "show": "顯示篩選器",
        "hide": "隱藏篩選器",
        "keywordLabel": "關鍵字搜尋",
        "keywordPlaceholder": "描述或類別...",
        "typeLabel": "交易類型",
        "typeAll": "所有類型",
        "typeIncome": "收入",
        "typeExpense": "支出",
        "startDateLabel": "開始日期",
        "endDateLabel": "結束日期",
        "minAmountLabel": "最小金額",
        "maxAmountLabel": "最大金額",
        "tagLabel": "標籤搜尋",
        "tagPlaceholder": "例如：工作、重要",
        "applyButton": "套用篩選",
        "resetButton": "重設篩選"
      },
      "budgets": {
        "title": "每月預算",
        "addBudgetButton": "新增預算",
        "editBudgetButton": "編輯預算",
        "noBudgetsSet": "本月尚未設定預算。點擊「新增預算」以建立。",
        "spent": "已支出",
        "target": "目標",
        "effectiveTarget": "有效目標",
        "rolloverAmount": "結轉",
        "remaining": "剩餘：",
        "overspentBy": "超支：",
        "rolloverEnabledTooltip": "已啟用結轉",
        "editButtonAriaLabel": "編輯 {category} 預算",
        "deleteButtonAriaLabel": "刪除 {category} 預算",
        "addBudgetModalTitle": "新增預算",
        "editBudgetModalTitle": "編輯預算",
        "confirmDeleteBudget": "您確定要刪除此預算嗎？",
        "prevMonth": "上個月",
        "nextMonth": "下個月",
        "previousMonthAriaLabel": "前往上個月預算",
        "nextMonthAriaLabel": "前往下個月預算"
      },
      "addTransactionModalTitle": "新增交易",
      "charts": {
        "incomeExpenseTrendTitle": "收支趨勢圖 (近6個月)",
        "noTrendData": "目前尚無足夠資料可顯示趨勢圖。"
      }
    },
    "transactionForm": {
      "modalTitle": "新增交易",
      "descriptionLabel": "描述",
      "descriptionPlaceholder": "例如：雜貨、薪水",
      "amountLabel": "金額",
      "amountPlaceholder": "0.00",
      "typeLabel": "類型",
      "expenseButton": "支出",
      "incomeButton": "收入",
      "categoryLabel": "類別",
      "selectCategoryPlaceholder": "選擇一個類別...",
      "tagsLabel": "標籤（用逗號分隔）",
      "tagsPlaceholder": "例如：工作、個人、緊急",
      "dateLabel": "日期",
      "submitAddButton": "新增交易",
      "submitUpdateButton": "更新交易",
      "errors": {
        "descriptionRequired": "描述為必填項。",
        "amountRequired": "金額為必填項。",
        "amountPositive": "金額必須是正數。",
        "dateRequired": "日期為必填項。",
        "categoryRequired": "類別為必填項。"
      }
    },
    "transactionTable": {
      "category": "類別",
      "description": "描述",
      "date": "日期",
      "amount": "金額",
      "actions": "動作"
    },
    "budgetForm": {
      "categoryLabel": "類別",
      "selectCategoryPlaceholder": "選擇一個支出類別...",
      "targetAmountLabel": "目標金額",
      "monthYearLabel": "月份 (YYYY-MM)",
      "editInfo": "編輯時無法更改類別和月份。",
      "allowRolloverLabel": "允許此類別預算結轉",
      "submitAddButton": "新增預算",
      "submitUpdateButton": "更新預算",
      "errors": {
        "categoryRequired": "類別為必填項。",
        "amountRequired": "目標金額為必填項。",
        "amountPositive": "目標金額必須是正數。",
        "monthYearInvalid": "月份格式必須是 YYYY-MM（例如：2023-10）。",
        "categoryBudgeted": "本月已存在 '{category}' 類別的預算。"
      }
    },
    "transactionList": {
      "noTransactions": "尚無交易記錄。新增一筆開始吧！",
      "noFilteredTransactions": "沒有符合目前篩選條件的交易。"
    },
    "summaryDisplay": {
      "totalIncome": "總收入",
      "totalExpenses": "總支出",
      "currentBalance": "目前餘額",
      "incomeSubtext": "較上月增加 X%",
      "expenseSubtext": "較上月減少 Y%"
    },
    "categoryPieChart": {
      "noData": "尚無支出數據可顯示圖表。"
    },
    "aiFinancialTip": {
      "title": "AI 財務小撇步",
      "getNewTipButton": "獲取新提示",
      "gettingTipButton": "獲取提示中...",
      "initialMessage": "點擊「獲取新提示」以獲得個人化建議！",
      "infoText": "AI 產生的提示僅供參考。由 OpenRouter 提供技術支援。",
      "errorTitle": "提示生成失敗",
      "errorApiKeyNotSet": "無法獲取提示：OpenRouter API 金鑰未設定。請在設定頁面中配置。",
      "errorInvalidApiKey": "無法獲取提示：OpenRouter API 金鑰無效。請在設定頁面中檢查。",
      "errorRateLimit": "無法獲取提示：OpenRouter (模型: {model}) 超出速率限制或配額已用完。請檢查您的 OpenRouter 帳戶。",
      "errorRequestFailed": "OpenRouter API 請求失敗 (模型: {model}): {status} - {message}",
      "errorDefault": "抱歉，目前無法獲取財務提示。{message}",
      "errorUnexpectedResponse": "抱歉，從 AI 服務收到了意外的回應結構。",
      "errorNoChoices": "抱歉，AI 模型沒有返回任何選擇。這可能是由於內容過濾器、模型設定或模型本身的問題。請嘗試不同的模型或提示。",
      "errorEmptyMessage": "抱歉，AI 模型返回了空訊息。請重試或嘗試不同的模型。",
      "errorApiError": "抱歉，發生 API 錯誤：{message} (模型: {model})",
      "errorNetwork": "連接 OpenRouter 時發生錯誤 (模型: {model}): {message}",
      "errorGenericNetwork": "抱歉，由於網路或客戶端問題，目前無法獲取財務提示。請稍後再試。"
    },
    "billScanPage": {
      "title": "OCR 帳單掃描",
      "description": "上傳您的帳單圖片以自動擷取詳細資訊。",
      "uploadTitle": "上傳帳單圖片",
      "uploadLabel": "上傳檔案",
      "dragAndDrop": "或拖曳至此",
      "fileTypes": "PNG, JPG, GIF (最大 10MB)",
      "previewTitle": "圖片預覽",
      "imagePreviewAlt": "帳單圖片預覽",
      "processButton": "擷取資訊 (標準)",
      "processButtonAI": "使用 AI 擷取",
      "processingButton": "擷取中...",
      "resultsTitle": "擷取結果",
      "extractedAmount": "金額：",
      "extractedDate": "日期：",
      "extractedVendor": "商家：",
      "extractedCurrency": "貨幣：",
      "suggestedCategory": "建議類別：",
      "fullText": "完整擷取文字 (Tesseract)：",
      "noTextExtracted": "無法從圖片中擷取任何文字。",
      "notFound": "未找到",
      "noResultsYet": "請上傳圖片並點擊「擷取資訊」以查看結果。",
      "createTransactionButton": "建立交易",
      "transactionModalTitle": "從帳單建立交易",
      "defaultDescription": "帳單：{fileName}",
      "billSuffix": "帳單",
      "transactionAddedSuccess": "已成功建立交易！",
      "errorTitle": "錯誤",
      "aiErrorTitle": "AI 擷取錯誤",
      "successTitle": "成功！",
      "errorNoImageSelected": "請先選擇一個圖片檔案。",
      "errorOcrFailed": "OCR 處理失敗：{message}",
      "errorAIFailed": "AI 擷取失敗：{message}",
      "errorNoDataForAI": "沒有 OCR 文字或圖片可供 AI 增強。",
      "aiEnhanceButton": "AI 增強擷取",
      "enhanceWithAIButton": "使用 AI 增強",
      "aiProcessing": "AI 處理中...",
      "aiEnhancedResultsTitle": "AI 增強結果",
      "aiDirectResultsTitle": "AI OCR 結果",
      "tesseractResultsTitle": "標準 OCR 結果",
      "tesseractResultsFallbackTitle": "標準 OCR 結果 (備用)",
      "aiErrorNotice": "AI 增強失敗。若有標準 OCR 結果，將使用該結果。",
      "statusInitializing": "正在初始化 OCR 引擎...",
      "statusDone": "擷取完成。",
      "statusError": "發生錯誤。",
      "extractionMethodTitle": "擷取方式",
      "methodStandardOCR": "標準 OCR",
      "methodStandardOCRDescription": "快速的本機處理，使用 Tesseract.js。",
      "methodAIOCR": "AI OCR",
      "methodAIOCRDescription": "較慢，雲端 AI 分析以獲取更高準確度。需 API 金鑰。"
    },
    "recurringTransactionsPage": {
      "title": "管理週期性交易",
      "addRecurringButton": "新增週期性交易",
      "addModalTitle": "新增週期性交易",
      "editModalTitle": "編輯週期性交易",
      "confirmDelete": "您確定要刪除此週期性交易範本嗎？這不會刪除已由此範本生成的任何交易。",
      "form": {
        "frequencyLabel": "頻率",
        "startDateLabel": "開始日期",
        "endDateLabel": "結束日期 (選填)",
        "isActiveLabel": "啟用 (自動生成交易)",
        "errors": {
          "startDateRequired": "開始日期為必填。",
          "endDateInvalid": "結束日期不能早於開始日期。"
        }
      },
      "frequencies": {
        "daily": "每日",
        "weekly": "每週",
        "monthly": "每月",
        "yearly": "每年"
      },
      "list": {
        "noTemplates": "找不到週期性交易範本。新增一個開始吧！",
        "frequencyHeader": "頻率",
        "nextDueDateHeader": "下次到期",
        "endDateHeader": "結束日期",
        "lastGeneratedHeader": "上次生成",
        "notGeneratedYet": "從未",
        "noEndDate": "無",
        "editAriaLabel": "編輯",
        "deleteAriaLabel": "刪除",
        "activateAriaLabel": "啟用",
        "deactivateAriaLabel": "停用"
      }
    },
    "categories": {
      "Food": "食物",
      "Groceries": "雜貨",
      "Transport": "交通",
      "Utilities": "水電瓦斯",
      "Housing": "住房",
      "Entertainment": "娛樂",
      "Health": "健康",
      "Shopping": "購物",
      "Education": "教育",
      "Travel": "旅遊",
      "Other": "其他",
      "Salary": "薪水",
      "Bonus": "獎金",
      "Investment": "投資",
      "Gift": "禮物",
      "Credit Card": "信用卡",
      "Tax": "稅金"
    },
    "currencies": {
      "USD": "美元",
      "EUR": "歐元",
      "JPY": "日圓",
      "GBP": "英鎊",
      "AUD": "澳幣",
      "CAD": "加拿大元",
      "CNY": "人民幣",
      "TWD": "新臺幣",
      "HKD": "港幣"
    }
  }
};

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [language, setCurrentLanguage] = useState<Language>(() => {
    const storedLang = localStorage.getItem(LOCAL_STORAGE_LANGUAGE_KEY);
    return (storedLang ? storedLang : DEFAULT_LANGUAGE) as Language;
  });

  const [isDarkMode, setCurrentDarkMode] = useState<boolean>(() => {
    const storedDarkMode = localStorage.getItem(LOCAL_STORAGE_DARK_MODE_KEY);
    if (storedDarkMode !== null) {
      return storedDarkMode === 'true';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [translations, setTranslations] = useState<Translations>({});
  const [isTranslationsLoading, setIsTranslationsLoading] = useState<boolean>(true);

  const [selectedCurrencyCode, setSelectedCurrencyState] = useState<string>(() => {
    const storedCurrency = localStorage.getItem(LOCAL_STORAGE_SELECTED_CURRENCY_KEY);
    return storedCurrency || DEFAULT_CURRENCY_CODE;
  });

  const [selectedCurrencySymbol, setSelectedCurrencySymbolState] = useState<string>(() => {
    // Initialize based on selectedCurrencyCode's initial value
    const initialCode = localStorage.getItem(LOCAL_STORAGE_SELECTED_CURRENCY_KEY) || DEFAULT_CURRENCY_CODE;
    const currentCurrency = AVAILABLE_CURRENCIES.find(c => c.code === initialCode);
    return currentCurrency ? currentCurrency.symbol : (AVAILABLE_CURRENCIES.find(c => c.code === DEFAULT_CURRENCY_CODE)?.symbol || '$');
  });

  useEffect(() => {
    const loadTranslations = async () => {
      setIsTranslationsLoading(true);
      let effectiveLanguage = language;
      let translationsData: Translations | null = null;

      const fetchTranslationsForLang = async (langToFetch: Language): Promise<Translations | null> => {
        // Locale files are now served from the root, typically from a 'public' or 'static' folder.
        const path = `/locales/${langToFetch}.json`; // Changed to root-relative path
        try {
          const response = await fetch(path);
          if (!response.ok) {
            console.error(`Failed to fetch translations for ${langToFetch} from ${path}. Status: ${response.status} ${response.statusText}`);
            const responseText = await response.text().catch(() => "Could not read response text.");
            console.error(`Response text for ${path}: ${responseText}`);
            return null;
          }
          return await response.json();
        } catch (error) {
          console.error(`Network or other error fetching translations for ${langToFetch} from ${path}:`, error);
          // Check if we're offline and return fallback translations
          if (!navigator.onLine || error instanceof TypeError) {
            console.warn(`Using fallback translations for ${langToFetch} due to network error (possibly offline).`);
            return FALLBACK_TRANSLATIONS[langToFetch] || FALLBACK_TRANSLATIONS[DEFAULT_LANGUAGE];
          }
          return null;
        }
      };

      translationsData = await fetchTranslationsForLang(effectiveLanguage);

      if (!translationsData) {
        console.warn(`Could not load translations for ${effectiveLanguage}. Attempting fallback to ${DEFAULT_LANGUAGE}.`);
        const previousEffectiveLanguage = effectiveLanguage;
        effectiveLanguage = DEFAULT_LANGUAGE;
        translationsData = await fetchTranslationsForLang(DEFAULT_LANGUAGE);
        if (!translationsData) {
            console.error(`CRITICAL: Failed to load even default (${DEFAULT_LANGUAGE}) translations after failing for ${previousEffectiveLanguage}. Using embedded fallback translations.`);
            // Use embedded fallback translations as last resort
            const fallbackLang = previousEffectiveLanguage in FALLBACK_TRANSLATIONS ? previousEffectiveLanguage : DEFAULT_LANGUAGE;
            setTranslations(FALLBACK_TRANSLATIONS[fallbackLang] || FALLBACK_TRANSLATIONS[DEFAULT_LANGUAGE]);
        } else {
            setTranslations(translationsData);
        }
      } else {
        setTranslations(translationsData);
      }
      setIsTranslationsLoading(false);
    };

    loadTranslations();
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setCurrentLanguage(lang);
    localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, lang);
  }, []);

  const setIsDarkMode = useCallback((isDark: boolean) => {
    setCurrentDarkMode(isDark);
    localStorage.setItem(LOCAL_STORAGE_DARK_MODE_KEY, String(isDark));
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const t = useCallback((key: string, replacements?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let current: any = translations;
    for (const k of keys) {
      if (typeof current === 'object' && current !== null && k in current) {
        current = current[k];
      } else {
        return key;
      }
    }

    let parsedString = typeof current === 'string' ? current : key;

    if (replacements && typeof parsedString === 'string') {
      let resultString = parsedString;
      Object.keys(replacements).forEach(placeholderKey => {
        const valueToInsert = String(replacements[placeholderKey]);
        const patternToReplace = `{${placeholderKey}}`;
        // Loop to replace all occurrences, similar to 'g' flag in regex
        // String.prototype.replaceAll could be used if ES2021 is target,
        // but a loop is more compatible.
        while (resultString.includes(patternToReplace)) {
            resultString = resultString.replace(patternToReplace, valueToInsert);
        }
      });
      parsedString = resultString; // Update parsedString with the result of all replacements
    }
    return parsedString;
  }, [translations]);

  const setSelectedCurrencyCode = useCallback((code: string) => {
    const currency = AVAILABLE_CURRENCIES.find(c => c.code === code);
    if (currency) {
      setSelectedCurrencyState(code);
      setSelectedCurrencySymbolState(currency.symbol);
      localStorage.setItem(LOCAL_STORAGE_SELECTED_CURRENCY_KEY, code);
    } else {
      // Fallback to default if invalid code is provided
      const defaultCurrency = AVAILABLE_CURRENCIES.find(c => c.code === DEFAULT_CURRENCY_CODE) || AVAILABLE_CURRENCIES[0];
      setSelectedCurrencyState(defaultCurrency.code);
      setSelectedCurrencySymbolState(defaultCurrency.symbol);
      localStorage.setItem(LOCAL_STORAGE_SELECTED_CURRENCY_KEY, defaultCurrency.code);
    }
  }, []);

  // Effect to update symbol if code changes externally (e.g. initial load with different stored value)
  useEffect(() => {
    const currentCurrency = AVAILABLE_CURRENCIES.find(c => c.code === selectedCurrencyCode);
    setSelectedCurrencySymbolState(currentCurrency ? currentCurrency.symbol : (AVAILABLE_CURRENCIES.find(c => c.code === DEFAULT_CURRENCY_CODE)?.symbol || '$'));
  }, [selectedCurrencyCode]);


  const formatCurrency = useCallback((amount: number): string => {
    const isJPY = selectedCurrencyCode === 'JPY';
    // For JPY, no decimals is standard.
    if (isJPY) {
        return `${selectedCurrencySymbol}${amount.toFixed(0)}`;
    }
    return `${selectedCurrencySymbol}${amount.toFixed(2)}`;
  }, [selectedCurrencySymbol, selectedCurrencyCode]);

  const contextValue: AppContextType = {
    language,
    setLanguage,
    isDarkMode,
    setIsDarkMode,
    t,
    selectedCurrencyCode,
    setSelectedCurrencyCode,
    selectedCurrencySymbol,
    formatCurrency,
    isTranslationsLoading
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the AppContext
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

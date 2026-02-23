import { GoogleGenerativeAI } from "@google/generative-ai";

// --- Helper Functions ---

const getGeminiKey = (): string => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
        console.warn("Gemini API Key missing.");
        throw new Error("Gemini API Key is missing. Please add NEXT_PUBLIC_GEMINI_API_KEY to .env.local");
    }
    return apiKey;
};

const getGeminiModel = (modelName: string = "gemini-2.5-flash-lite") => {
    const apiKey = getGeminiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: "application/json" }
    });
};

const retryWithBackoff = async <T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
    try {
        return await operation();
    } catch (error: any) {
        // Retry on 503 (Service Unavailable) or 500 (Internal Server Error) or 429 (Too Many Requests)
        const shouldRetry =
            error.message?.includes('503') ||
            error.message?.includes('high demand') ||
            error.status === 503 ||
            error.status === 500 ||
            error.status === 429;

        if (retries > 0 && shouldRetry) {
            console.warn(`Gemini Busy/Error (${error.message}). Retrying in ${delay}ms... (${retries} left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return retryWithBackoff(operation, retries - 1, delay * 2);
        }
        throw error;
    }
};

const extractJSON = (text: string): any => {
    try {
        // First try direct parse if it's clean
        return JSON.parse(text);
    } catch (e) {
        // Fallback: Find first '{' and last '}'
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');

        if (start === -1 || end === -1) {
            throw new Error("No JSON found in AI response: " + text.substring(0, 100) + "...");
        }

        const jsonString = text.substring(start, end + 1);
        try {
            return JSON.parse(jsonString);
        } catch (parseError) {
            // Last resort cleanup
            const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
            try {
                return JSON.parse(cleaned);
            } catch (finalError) {
                throw new Error("Failed to parse AI JSON response.");
            }
        }
    }
};

const getISTTime = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    };

    // Format: DD/MM/YYYY, HH:MM (approx, depends on locale)
    // Better to get parts
    const formatter = new Intl.DateTimeFormat("en-CA", { ...options, hour12: false });
    // en-CA gives YYYY-MM-DD which is great for ISO-like sorting/databases

    // We need YYYY-MM-DD for the prompt
    // And HH:MM for time

    // Let's use separate formatters to be safe
    const dateStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(now); // YYYY-MM-DD
    const timeStr = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: '2-digit', minute: '2-digit', hour12: false }).format(now);

    return { date: dateStr, time: timeStr };
};


export const aiService = {
    async parseReminderWithGemini(
        promptText: string,
        imageBase64?: string
    ): Promise<{ title?: string; amount?: number; date?: string; time?: string; transactionType?: 'income' | 'expense'; tags?: string[] }> {
        try {
            const model = getGeminiModel();
            const { date, time } = getISTTime();

            let prompt = `
            Analyze this reminder request. Extract details into a JSON object:
            - title: Short summary (string).
            - amount: Monetary amount if mentioned (number), else null.
            - date: Due date in YYYY-MM-DD. Calculate based on today: ${date}. If not found, return null.
            - time: Time in HH:MM (24hr). Current time is ${time}.
            - transactionType: "income" or "expense" (default "expense").
            - tags: Array of keywords.

            Text: "${promptText}"

            Return ONLY raw JSON.
            `;

            const parts: any[] = [prompt];

            if (imageBase64) {
                prompt = `
                Analyze this image (bill/reminder). Extract details into a JSON object:
                - title: Short summary/merchant name (string).
                - amount: Total amount (number).
                - date: Due date/Bill date in YYYY-MM-DD. Today is ${date}.
                - time: Time in HH:MM (24hr).
                - transactionType: "income" or "expense" (default "expense").
                - tags: Array of keywords.
                
                Return ONLY raw JSON.
                `;
                parts[0] = prompt;
                parts.push({
                    inlineData: {
                        data: imageBase64,
                        mimeType: "image/jpeg",
                    },
                });
            }

            const result = await retryWithBackoff(() => model.generateContent(parts));
            const text = result.response.text();

            console.log("Gemini Reminder Response:", text);
            return extractJSON(text);

        } catch (error: any) {
            console.error("Gemini Reminder Analysis Error", error);
            throw new Error(error.message || "Failed to analyze reminder");
        }
    },

    async chatWithGemini(
        prompt: string,
        conversationHistory: any[] = [],
        contextData?: { transactions?: any[], reminders?: any[] }
    ): Promise<any> {
        try {
            const model = getGeminiModel();
            const { date, time } = getISTTime();

            // create context summary from recent transactions
            let contextSummary = "";
            let uniqueCategories: string[] = [];

            if (contextData?.transactions && contextData.transactions.length > 0) {
                // Extract unique categories
                const categories = new Set<string>();
                contextData.transactions.forEach((t: any) => {
                    if (t.category) categories.add(t.category);
                });
                uniqueCategories = Array.from(categories);

                const recent = contextData.transactions.slice(0, 5).map((t: any) =>
                    `- ${t.date instanceof Date ? t.date.toISOString().split('T')[0] : t.date}: ${t.description} (${t.type}) ₹${t.amount} [${t.category}]`
                ).join("\n");
                contextSummary = `
                USER DATA CONTEXT:
                - Existing Categories: ${uniqueCategories.join(", ")}
                - Recent Transactions (Last 5):
                ${recent}
                `;
            }

            const systemPrompt = `
            You are a smart financial assistant for PocketBook. Today is ${date} (IST), current time is ${time}.
            ${contextSummary}
            
            Analyze the user's input and determine the intent. Consider the conversation history for context.
            You MUST respond with a valid JSON object.
            
            INTENT TYPES:
            1. "transaction" - User wants to log income/expense
            2. "reminder" - User wants to set a payment reminder
            3. "query" - User wants to see/analyze their data (IMPORTANT: Extract filters carefully)
            4. "edit" - User wants to modify an existing entry
            5. "delete" - User wants to remove an entry
            6. "insight" - User asks for financial advice/insights
            8. "budget_set" - User wants to set a budget
            9. "unknown" - Not related to finance
            10. "subscription" - User wants to find recurring payments
            11. "cleanup_categories" - User wants to organize/fix transaction categories
            12. "scenario_simulation" - User asks "Can I afford X?" or "What if I spend Y?"
            13. "chart" - User asks for a visual chart (bar chart)
            14. "action-card" - User needs an interactive card (e.g. to confirm something complex or a tip)
            15. "health_score" - User asks "What is my financial health score?" or "Am I financially healthy?"
            16. "greeting" - User says hi, hello, thanks, etc.
            
            For UNRELATED queries, return: { "type": "unknown", "message": "I can only help with transactions, reminders, and financial insights." }
            
            STRUCTURES:
            - transaction: { type: "transaction", transactionType: "income"|"expense", amount: number, category: string, description: string, date: "YYYY-MM-DD", tags: string[] }
            - reminder: { type: "reminder", title: string, amount: number, transactionType: "income"|"expense", date: "YYYY-MM-DD", recurrence: string, tags: string[] }
            - query: { type: "query", entity: "transaction"|"reminder", filters: { type, category, search, startDate, endDate }, operation: "sum"|"count"|"list"|"average"|"breakdown"|"compare", field: "amount"|"category"|"date", limit: number }
            - edit: { type: "edit", target: "transaction"|"reminder"|"last", searchCriteria: { description, date, amount }, changes: { amount, description, date, category } }
            - delete: { type: "delete", target: "transaction"|"reminder"|"last", searchCriteria: { description, date, amount } }
            - insight: { type: "insight", focus: "spending"|"savings"|"categories"|"trends"|"general", message: "Brief, actionable analysis of the data" }
            - budget_check: { type: "budget_check", category: string }
            - budget_set: { type: "budget_set", category: string, limit: number, period: "monthly"|"weekly" }
            - subscription: { type: "subscription" }
            - cleanup_categories: { type: "cleanup_categories" }
            - scenario_simulation: { type: "scenario_simulation", scenario_type: "one_time"|"recurring", amount: number, title: string }
            - chart: { type: "chart", title: string, chartData: [{ name: string, value: number }] }
            - action-card: { type: "action-card", title: string, description: string, amount: number, actionType: "income"|"expense"|"neutral", action: "log_transaction"|"log_reminder", payload: { amount: number, description: string, category: string, date: string, tags: [] }, confirmText: string, cancelText: string }
            - health_score: { type: "health_score" }
            - greeting: { type: "greeting", message: "A friendly response acknowledging the greeting and offering help with finance." }

            EXAMPLES:
            User: "Show me food transactions"
            JSON: { "type": "query", "entity": "transaction", "filters": { "category": "Food" }, "operation": "list", "limit": 10 }

            User: "How much did I spend on Uber?"
            JSON: { "type": "query", "entity": "transaction", "filters": { "search": "Uber" }, "operation": "sum" }

            User: "List my salary payments"
            JSON: { "type": "query", "entity": "transaction", "filters": { "category": "Salary", "type": "income" }, "operation": "list" }

            User: "Total entertainment spending last month"
            JSON: { "type": "query", "entity": "transaction", "filters": { "category": "Entertainment", "startDate": "YYYY-MM-01", "endDate": "YYYY-MM-30" }, "operation": "sum" }

            User: "Show a bar chart of my categorizations this month"
            JSON: { "type": "chart", "title": "Spending by Category", "chartData": [{ "name": "Food", "value": 1500 }] }

            User: "Last 5 transactions"
            JSON: { "type": "query", "entity": "transaction", "filters": {}, "operation": "list", "limit": 5 }

            ALWAYS include a "nextPrompts" array with 2-3 short, contextual follow-up questions.
            If relative dates ("yesterday") are used, calculate based on ${date}.
            `;

            // Limit history to last 10 messages to avoid token limits
            const recentHistory = conversationHistory.slice(-10).map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));

            const chatSession = model.startChat({
                history: [
                    { role: "user", parts: [{ text: systemPrompt }] },
                    { role: "model", parts: [{ text: "Understood. I am ready to act as the PocketBook financial assistant and will output strict JSON." }] },
                    ...recentHistory
                ],
            });

            const result = await retryWithBackoff(() => chatSession.sendMessage(prompt));
            const responseText = result.response.text();

            console.log("Gemini Chat Response:", responseText);
            return extractJSON(responseText);

        } catch (error: any) {
            console.error("aiService: Chat Error", error);
            throw new Error(error.message || "AI Chat Failed");
        }
    },

    async analyzeImageWithGemini(base64Image: string | string[]): Promise<any> {
        try {
            const model = getGeminiModel();
            const { date } = getISTTime();

            const isMulti = Array.isArray(base64Image) && base64Image.length > 1;

            let prompt = `
            Analyze this image (receipt or bill). Extract the following details into a JSON object:
            - amount: The total amount (number)
            - description: The merchant name or brief description (string)
            - date: The date on the receipt in YYYY-MM-DD format (string, or null). Today is ${date}.
            - category: Best guess category from [Food, Transport, Utilities, Entertainment, Health, Shopping, Housing, Education, Personal, Savings] or "Other" (string)
            - tags: Array of keywords (strings)

            Return ONLY raw JSON. No markdown.
            `;

            if (isMulti) {
                prompt = `
                Analyze these MULTIPLE images (receipts or bills). Combine or extract the aggregate details into a SINGLE JSON object representing the total expense:
                - amount: The SUM of the total amounts across ALL receipts (number)
                - description: A combined description, e.g. "Groceries & Cafe" or the names of the merchants separated by '&' (string)
                - date: The date of the most recent receipt in YYYY-MM-DD format (string, or null). Today is ${date}.
                - category: Best guess category representing the bulk of the expense from [Food, Transport, Utilities, Entertainment, Health, Shopping, Housing, Education, Personal, Savings] or "Other" (string)
                - tags: Array of keywords combining items from all receipts (strings)

                Return ONLY raw JSON. No markdown.
                `;
            }

            const images = Array.isArray(base64Image) ? base64Image : [base64Image];
            const imageParts = images.map(img => ({
                inlineData: {
                    data: img,
                    mimeType: "image/jpeg",
                },
            }));

            const result = await retryWithBackoff(() => model.generateContent([prompt, ...imageParts]));
            const text = result.response.text();

            console.log("Gemini Image Response:", text);
            return extractJSON(text);

        } catch (error: any) {
            console.error("Gemini Image Analysis Error", error);
            throw new Error(error.message || "Failed to analyze image");
        }
    },

    async parseTransactionWithGemini(text: string): Promise<any> {
        try {
            const model = getGeminiModel();
            const { date, time } = getISTTime();

            const prompt = `
            Analyze this financial text. Extract the details into a JSON object:
            - amount: The total amount (number).
            - description: Brief description (string).
            - date: Date in YYYY-MM-DD. Use ${date} as today.
            - category: Best guess category from [Food, Transport, Utilities, Entertainment, Health, Shopping, Housing, Education, Personal, Savings] or "Other".
            - tags: Array of keywords.
            - time: Time in HH:MM (24hr). Current time is ${time}.
            - type: "income" or "expense" (default "expense").

            Text: "${text}"

            Return ONLY raw JSON.
            `;

            const result = await retryWithBackoff(() => model.generateContent(prompt));
            const responseText = result.response.text();

            console.log("Gemini Text Response:", responseText);
            return extractJSON(responseText);

        } catch (error: any) {
            console.error("Gemini Text Analysis Error", error);
            throw new Error(error.message || "Failed to analyze text");
        }
    },

    async suggestCategories(transactions: { id: string; description: string; amount: number }[]): Promise<{ id: string; category: string }[]> {
        try {
            const model = getGeminiModel();

            const prompt = `
            Analyze these transactions and suggest a better category for each from [Food, Transport, Utilities, Entertainment, Health, Shopping, Housing, Education, Personal, Savings].
            If the current description is too vague, keep it as "Other".
            
            Transactions:
            ${JSON.stringify(transactions)}
            
            Return a JSON array of objects: { "id": "transaction_id", "category": "Suggested Category" }
            Return ONLY raw JSON.
            `;

            const result = await retryWithBackoff(() => model.generateContent(prompt));
            const text = result.response.text();

            return extractJSON(text);
        } catch (error: any) {
            console.error("Gemini Category Suggestion Error", error);
            return [];
        }
    }
};

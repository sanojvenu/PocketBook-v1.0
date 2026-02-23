import { collection, doc, setDoc, deleteDoc, query, orderBy, onSnapshot, Firestore } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface BudgetData {
    id: string;
    category: string;
    limit: number;
    period: 'monthly' | 'weekly';
    createdAt?: Date;
}

export const BudgetService = {
    _checkAuth(userId?: string) {
        if (!userId) throw new Error("User ID is required for database operations.");
        if (!db) throw new Error("Database is not initialized.");
        return db as Firestore;
    },

    subscribeBudgets(userId: string, onUpdate: (budgets: BudgetData[]) => void, onError: (error: Error) => void) {
        const firestore = this._checkAuth(userId);
        const q = query(
            collection(firestore, "users", userId, "budgets"),
            orderBy("category", "asc")
        );

        return onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as BudgetData[];
            onUpdate(data);
        }, onError);
    },

    async saveBudget(userId: string, data: Omit<BudgetData, 'id'> & { id?: string }) {
        const firestore = this._checkAuth(userId);
        const budgetId = data.id || data.category.toLowerCase().replace(/\s+/g, '-');
        const docRef = doc(firestore, "users", userId, "budgets", budgetId);

        await setDoc(docRef, {
            category: data.category,
            limit: data.limit,
            period: data.period || 'monthly',
            createdAt: data.id ? undefined : new Date()
        }, { merge: true });

        return budgetId;
    },

    async deleteBudget(userId: string, budgetId: string) {
        const firestore = this._checkAuth(userId);
        await deleteDoc(doc(firestore, "users", userId, "budgets", budgetId));
        return true;
    }
};

import { collection, doc, addDoc, deleteDoc, getDocs, writeBatch, query, onSnapshot, Firestore } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Category } from "@/hooks/useCategories"; // Type import only if possible, wait we should move the type here

export interface CategoryData {
    id: string;
    name: string;
    type: 'income' | 'expense' | 'both';
    color?: string;
    isDefault?: boolean;
}

const DEFAULT_CATEGORIES: Omit<CategoryData, 'id'>[] = [
    { name: "Salary", type: "income", color: "#10b981", isDefault: true },
    { name: "Freelance", type: "income", color: "#34d399", isDefault: true },
    { name: "Investment", type: "income", color: "#059669", isDefault: true },
    { name: "Gift", type: "income", color: "#6ee7b7", isDefault: true },
    { name: "Food", type: "expense", color: "#f43f5e", isDefault: true },
    { name: "Transport", type: "expense", color: "#f59e0b", isDefault: true },
    { name: "Rent", type: "expense", color: "#ef4444", isDefault: true },
    { name: "Bills", type: "expense", color: "#ec4899", isDefault: true },
    { name: "Shopping", type: "expense", color: "#8b5cf6", isDefault: true },
    { name: "Entertainment", type: "expense", color: "#d946ef", isDefault: true },
    { name: "Health", type: "expense", color: "#06b6d4", isDefault: true },
    { name: "Education", type: "expense", color: "#3b82f6", isDefault: true },
    { name: "Other", type: "both", color: "#9ca3af", isDefault: true },
];

export const CategoryService = {
    _checkAuth(userId?: string) {
        if (!userId) throw new Error("User ID is required for database operations.");
        if (!db) throw new Error("Database is not initialized.");
        return db as Firestore;
    },

    subscribeCategories(userId: string, onUpdate: (categories: CategoryData[]) => void) {
        const firestore = this._checkAuth(userId);
        const colRef = collection(firestore, "users", userId, "categories");
        const q = query(colRef);

        return onSnapshot(q, async (snapshot) => {
            if (snapshot.empty && !snapshot.metadata.hasPendingWrites) {
                const snapshotCheck = await getDocs(colRef);

                if (snapshotCheck.empty) {
                    console.log("Seeding default categories...");
                    const batch = writeBatch(firestore);
                    DEFAULT_CATEGORIES.forEach(cat => {
                        const newDoc = doc(colRef);
                        batch.set(newDoc, cat);
                    });
                    try {
                        await batch.commit();
                    } catch (e) {
                        console.error("Error seeding categories", e);
                    }
                }
            } else {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CategoryData[];
                data.sort((a, b) => {
                    if (a.name === 'Other') return 1;
                    if (b.name === 'Other') return -1;
                    return a.name.localeCompare(b.name);
                });
                onUpdate(data);
            }
        });
    },

    async addCategory(userId: string, name: string, type: 'income' | 'expense' | 'both', color?: string) {
        const firestore = this._checkAuth(userId);
        await addDoc(collection(firestore, "users", userId, "categories"), {
            name,
            type,
            color: color || "#9ca3af",
            isDefault: false
        });
        return true;
    },

    async deleteCategory(userId: string, id: string) {
        const firestore = this._checkAuth(userId);
        await deleteDoc(doc(firestore, "users", userId, "categories", id));
        return true;
    }
};

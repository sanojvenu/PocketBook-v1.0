import { collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where, orderBy, onSnapshot, Firestore, limit, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Transaction } from "@/types";

export const TransactionService = {

    /** Validates user and db before operations */
    _checkAuth(userId?: string) {
        if (!userId) throw new Error("User ID is required for database operations.");
        if (!db) throw new Error("Database is not initialized.");
        return db as Firestore;
    },

    async addTransaction(userId: string, data: Omit<Transaction, 'id' | 'userId'>) {
        const firestore = this._checkAuth(userId);
        const docRef = await addDoc(collection(firestore, "users", userId, "transactions"), {
            ...data,
            userId,
            createdAt: new Date()
        });
        return docRef.id;
    },

    async updateTransaction(userId: string, transactionId: string, data: Partial<Transaction>) {
        const firestore = this._checkAuth(userId);
        const docRef = doc(firestore, "users", userId, "transactions", transactionId);
        await updateDoc(docRef, data);
        return true;
    },

    async deleteTransaction(userId: string, transactionId: string) {
        const firestore = this._checkAuth(userId);
        const docRef = doc(firestore, "users", userId, "transactions", transactionId);
        await deleteDoc(docRef);
        return true;
    },

    subscribeTransactions(userId: string, callback: (transactions: Transaction[]) => void) {
        const firestore = this._checkAuth(userId);
        const q = query(
            collection(firestore, "users", userId, "transactions"),
            orderBy("date", "desc")
        );
        return onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
            callback(data);
        });
    },

    subscribeRecentTransactions(userId: string, limitCount: number, callback: (transactions: Transaction[]) => void) {
        const firestore = this._checkAuth(userId);
        const q = query(
            collection(firestore, "users", userId, "transactions"),
            orderBy("date", "desc"),
            limit(limitCount)
        );
        return onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
            callback(data);
        });
    },

    async bulkDeleteTransactions(userId: string, transactionIds: string[]) {
        const firestore = this._checkAuth(userId);
        const batch = writeBatch(firestore);
        transactionIds.forEach(id => {
            const docRef = doc(firestore, "users", userId, "transactions", id);
            batch.delete(docRef);
        });
        await batch.commit();
        return true;
    },

    async importTransactions(userId: string, transactions: Omit<Transaction, 'id'>[]) {
        const firestore = this._checkAuth(userId);
        const batch = writeBatch(firestore);
        const collectionRef = collection(firestore, "users", userId, "transactions");

        transactions.forEach((transaction) => {
            const docRef = doc(collectionRef);
            batch.set(docRef, {
                ...transaction,
                userId,
                createdAt: new Date()
            });
        });

        await batch.commit();
        return true;
    }
};

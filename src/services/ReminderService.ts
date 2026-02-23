import { collection, doc, addDoc, updateDoc, deleteDoc, Firestore, query, orderBy, onSnapshot, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Reminder } from "@/types";

export const ReminderService = {

    /** Validates user and db before operations */
    _checkAuth(userId?: string) {
        if (!userId) throw new Error("User ID is required for database operations.");
        if (!db) throw new Error("Database is not initialized.");
        return db as Firestore;
    },

    async addReminder(userId: string, data: Omit<Reminder, 'id' | 'userId'>) {
        const firestore = this._checkAuth(userId);
        const docRef = await addDoc(collection(firestore, "users", userId, "reminders"), {
            ...data,
            userId,
            createdAt: new Date() // Keeping existing behavior
        });
        return docRef.id;
    },

    async updateReminder(userId: string, reminderId: string, data: Partial<Reminder>) {
        const firestore = this._checkAuth(userId);
        const docRef = doc(firestore, "users", userId, "reminders", reminderId);
        await updateDoc(docRef, data);
        return true;
    },

    async deleteReminder(userId: string, reminderId: string) {
        const firestore = this._checkAuth(userId);
        const docRef = doc(firestore, "users", userId, "reminders", reminderId);
        await deleteDoc(docRef);
        return true;
    },

    subscribeReminders(userId: string, callback: (reminders: Reminder[]) => void) {
        const firestore = this._checkAuth(userId);
        const q = query(
            collection(firestore, "users", userId, "reminders"),
            orderBy("date", "asc")
        );
        return onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Reminder[];
            callback(data);
        });
    },

    async bulkDeleteReminders(userId: string, reminderIds: string[]) {
        const firestore = this._checkAuth(userId);
        const batch = writeBatch(firestore);
        reminderIds.forEach(id => {
            const docRef = doc(firestore, "users", userId, "reminders", id);
            batch.delete(docRef);
        });
        await batch.commit();
        return true;
    }
};

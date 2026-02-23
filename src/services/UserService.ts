import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, Firestore } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const UserService = {
    _checkAuth(userId?: string) {
        if (!userId) throw new Error("User ID is required for database operations.");
        if (!db) throw new Error("Database is not initialized.");
        return db as Firestore;
    },

    async getUserProfile(userId: string) {
        const firestore = this._checkAuth(userId);
        const docSnap = await getDoc(doc(firestore, "users", userId));
        return docSnap.exists() ? docSnap.data() : null;
    },

    async updateUserProfile(userId: string, data: any) {
        const firestore = this._checkAuth(userId);
        await updateDoc(doc(firestore, "users", userId), {
            ...data,
            updatedAt: new Date()
        });
        return true;
    },

    async syncUserProfile(userId: string, data: any) {
        const firestore = this._checkAuth(userId);
        await setDoc(doc(firestore, "users", userId), data, { merge: true });
        return true;
    },

    async checkInviteAndSetRole(email: string) {
        if (!db) return { role: "user", phoneNumber: "" };
        let newRole = "user";
        let newPhone = "";
        try {
            const inviteRef = doc(db, "user_invites", email);
            const inviteSnap = await getDoc(inviteRef);
            if (inviteSnap.exists()) {
                const data = inviteSnap.data();
                newRole = data.role || "user";
                newPhone = data.phoneNumber || "";
            } else if (email === "mail@mypocketbook.in") {
                newRole = "admin";
            }
        } catch (err) {
            console.error("Error checking invites", err);
        }

        return { role: newRole, phoneNumber: newPhone };
    },

    async deleteUserAllData(userId: string) {
        const firestore = this._checkAuth(userId);

        const transactionsRef = collection(firestore, "users", userId, "transactions");
        const remindersRef = collection(firestore, "users", userId, "reminders");
        const budgetsRef = collection(firestore, "users", userId, "budgets");
        const categoriesRef = collection(firestore, "users", userId, "categories");

        const [transSnap, remSnap, budSnap, catSnap] = await Promise.all([
            getDocs(transactionsRef),
            getDocs(remindersRef),
            getDocs(budgetsRef),
            getDocs(categoriesRef)
        ]);

        const deletePromises: Promise<void>[] = [];
        transSnap.docs.forEach(doc => deletePromises.push(deleteDoc(doc.ref)));
        remSnap.docs.forEach(doc => deletePromises.push(deleteDoc(doc.ref)));
        budSnap.docs.forEach(doc => deletePromises.push(deleteDoc(doc.ref)));
        catSnap.docs.forEach(doc => deletePromises.push(deleteDoc(doc.ref)));

        await Promise.all(deletePromises);
        await deleteDoc(doc(firestore, "users", userId));
        return true;
    }
};

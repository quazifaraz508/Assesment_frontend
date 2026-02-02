import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_APP_SECRET || 'fallback-secret-key-do-not-use-in-prod';

export const secureStorage = {
    setItem: (key, value) => {
        try {
            const encrypted = CryptoJS.AES.encrypt(JSON.stringify(value), SECRET_KEY).toString();
            localStorage.setItem(key, encrypted);
        } catch (error) {
            console.error('Error encrypting data', error);
        }
    },
    getItem: (key) => {
        try {
            const encrypted = localStorage.getItem(key);
            if (!encrypted) return null;

            const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);

            // Handle legacy plain text fallback (during migration)
            if (!decrypted) {
                try {
                    return JSON.parse(encrypted);
                } catch {
                    return encrypted;
                }
            }

            return JSON.parse(decrypted);
        } catch (error) {
            // Keep fallback for plain text if decryption fails
            try {
                const raw = localStorage.getItem(key);
                return raw ? JSON.parse(raw) : null;
            } catch {
                return null;
            }
        }
    },
    removeItem: (key) => {
        localStorage.removeItem(key);
    }
};

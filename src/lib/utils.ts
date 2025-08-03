import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (number: number | string | null | undefined): string => {
    if (number === null || number === undefined || isNaN(Number(number))) return '0 F CFA';
    return Number(number).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(/,/g, ' ') + ' F CFA';
};

export const formatDateTime = (isoString?: string): string => {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return 'Date invalide';
        const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
        return new Intl.DateTimeFormat('fr-FR', options).format(date);
    } catch {
        return 'Date invalide';
    }
};

export const formatDate = (isoString?: string): string => {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return 'Date invalide';
        const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return new Intl.DateTimeFormat('fr-FR', options).format(date);
    } catch {
        return 'Date invalide';
    }
};

export const toInputDate = (date?: Date | string): string => {
 if (!date) return '';
 const d = new Date(date);
 if (isNaN(d.getTime())) return '';
 const year = d.getFullYear();
 const month = (d.getMonth() + 1).toString().padStart(2, '0');
 const day = d.getDate().toString().padStart(2, '0');
 return `${year}-${month}-${day}`;
};

export const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
        if (!event.target?.result) {
            return reject(new Error("Failed to read file."));
        }
        const img = new Image();
        img.src = event.target.result as string;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;
            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error("Failed to get canvas context."));
            }
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
});

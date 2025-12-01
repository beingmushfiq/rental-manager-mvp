// Simple fetch-based API client (no axios dependency needed)
const USE_MOCK = import.meta.env?.VITE_USE_MOCK === 'true';
const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8000/api';

// Helper to use public routes (no auth required)
export const fetchCustomers = async () => {
    if (USE_MOCK) {
        const { getCustomers } = await import('../../services/mockDb');
        return getCustomers();
    }
    try {
        const response = await fetch(`${API_BASE_URL}/customers-public`);
        if (!response.ok) throw new Error('API request failed');
        return await response.json();
    } catch (error) {
        console.error("API Failed:", error);
        // Fallback to mock
        const { getCustomers } = await import('../../services/mockDb');
        return getCustomers();
    }
};

export const fetchItems = async () => {
    if (USE_MOCK) {
        const { getInventory } = await import('../../services/mockDb');
        return getInventory();
    }
    try {
        const response = await fetch(`${API_BASE_URL}/items-public`);
        if (!response.ok) throw new Error('API request failed');
        return await response.json();
    } catch (error) {
        console.error("API Failed:", error);
        const { getInventory } = await import('../../services/mockDb');
        return getInventory();
    }
};

// For now, other operations still use mock since they need auth
export const createCustomer = async (customerData: any) => {
    const { saveCustomer } = await import('../../services/mockDb');
    saveCustomer(customerData);
    return customerData;
};

export const createItem = async (itemData: any) => {
    const { saveInventoryItem } = await import('../../services/mockDb');
    saveInventoryItem(itemData);
    return itemData;
};

export const createRental = async (rentalData: any) => {
    const { saveRental } = await import('../../services/mockDb');
    return saveRental(rentalData);
};

export const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
    });
    
    if (!response.ok) throw new Error('Upload failed');
    return await response.json();
};

export default {
    fetchCustomers,
    fetchItems,
    createCustomer,
    createItem,
    createRental,
    uploadFile
};

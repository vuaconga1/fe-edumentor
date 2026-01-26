import React, { createContext, useContext, useState } from 'react';

const UIContext = createContext();

export const useUIContext = () => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUIContext must be used within a UIProvider');
    }
    return context;
};

export const UIProvider = ({ children }) => {
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

    const openChangePasswordModal = () => setIsChangePasswordOpen(true);
    const closeChangePasswordModal = () => setIsChangePasswordOpen(false);

    return (
        <UIContext.Provider
            value={{
                isChangePasswordOpen,
                openChangePasswordModal,
                closeChangePasswordModal,
            }}
        >
            {children}
        </UIContext.Provider>
    );
};

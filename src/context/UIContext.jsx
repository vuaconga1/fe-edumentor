import { createContext, useState } from 'react';

const UIContext = createContext();

export default UIContext;

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

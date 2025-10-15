import { useState, useEffect } from "react";
import UserContext from "./UserContext";

const UserProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        // Intentar cargar usuario desde sessionStorage al iniciar
        const userStr = sessionStorage.getItem('user');
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
        
        // Si no hay usuario en sessionStorage, usar valores por defecto para desarrollo
        return {
            nombre_completo: "Test",
            email: "test@gmail.com",
            rol: "admin",
            notificaciones: 1
        };
    });

    // Sincronizar cambios del usuario con sessionStorage
    useEffect(() => {
        if (user) {
            sessionStorage.setItem('user', JSON.stringify(user));
        }
    }, [user]);

    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};

export default UserProvider;
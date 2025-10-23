import { useState, useEffect } from "react";
import UserContext from "./UserContext";

const UserProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const normalize = (u) => {
            if (!u) return u;
            const inferRoleName = (name) => {
                if (!name) return undefined;
                const s = String(name).toLowerCase();
                if (s.includes('admin')) return 'admin';
                if (s.includes('director')) return 'director';
                if (s.includes('docen')) return 'docente';
                if (s.includes('auxil')) return 'auxiliar';
                if (s.includes('asesor')) return 'asesor_pedagogico';
                if (s.includes('jefe') && s.includes('aux')) return 'jefe_auxiliares';
                if (s.includes('tutor')) return 'tutor';
                if (s.includes('alum') || s.includes('estud') || s.includes('student')) return 'alumno';
                return s;
            };
            const inferredRoleRaw = (Array.isArray(u.roles) ? u.roles[0]?.nombre_rol : undefined) || u.nombre_rol || u.rol;
            const inferredRole = inferRoleName(inferredRoleRaw);
            return inferredRole ? { ...u, rol: inferredRole } : u;
        };

        // Intentar cargar usuario desde sessionStorage al iniciar
        const userStr = sessionStorage.getItem('user');
        if (userStr) {
            try {
                return normalize(JSON.parse(userStr));
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }

        // Si no hay usuario en sessionStorage, no setear usuario por defecto
        return null;
    });

    // Sincronizar cambios del usuario con sessionStorage
    useEffect(() => {
        if (user) {
            sessionStorage.setItem('user', JSON.stringify(user));
            if (user.rol) sessionStorage.setItem('permissions', user.rol);
        } else {
            sessionStorage.removeItem('user');
            sessionStorage.removeItem('permissions');
        }
    }, [user]);

    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};

export default UserProvider;

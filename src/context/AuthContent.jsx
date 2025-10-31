// src/context/AuthContent.jsx
import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "../supabase/supabase.config";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 🔹 Comprobar si ya hay sesión activa al iniciar
    supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user || null);
    });

    // 🔹 Suscribirse a los cambios de sesión
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      console.log("📢 Auth event:", _event);
      console.log("👤 Usuario actual:", session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => {
  return useContext(AuthContext);
};

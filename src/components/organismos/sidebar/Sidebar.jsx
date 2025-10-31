// src/components/organismos/sidebar/Sidebar.jsx
import styled from "styled-components";
import { ToggleTema } from "../../../index";
import { v } from "../../../styles/variables";
import { NavLink, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { supabase } from "../../../supabase/supabase.config.jsx";

export function Sidebar({ state, setState }) {
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUserRole() {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (!session?.user) return;

      const correo = session.user.email;
      const { data: usuario } = await supabase
        .from("usuarios")
        .select("rol")
        .eq("correo", correo)
        .single();

      setUserRole(usuario?.rol || "empleado");
    }

    fetchUserRole();
  }, []);

  // 🔹 Enlaces según rol
  const adminLinks = [
    { icon: "ic:baseline-home", label: "Inicio", to: "/admin/home" },
    { icon: "mdi:finance", label: "Dashboard", to: "/admin/finanzas" },
    { icon: "mdi:file-chart", label: "Reportes", to: "/admin/reportes" },
  ];

  const empleadoLinks = [
    { icon: "ic:baseline-home", label: "Inicio", to: "/empleado/home" },
    { icon: "mdi:cash-register", label: "Caja", to: "/empleado/caja" },
    { icon: "mdi:clock-time-four", label: "Mi horario", to: "/empleado/horarios" },
  ];

  const links = userRole === "admin" ? adminLinks : empleadoLinks;

  // 🔹 Enlace de cierre de sesión
  const secondaryLinks = [
    { icon: "mdi:logout", label: "Cerrar sesión", color: "#ff5555" },
  ];

    // 🧩 Handler general para clicks
  const handleClick = async (label, to) => {
    if (label === "Cerrar sesión") {
      const confirm = await Swal.fire({
        title: "¿Cerrar sesión?",
        text: "Se cerrará tu sesión actual.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ff5555",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, cerrar",
        cancelButtonText: "Cancelar",
        background: "#1e1e1e",
        color: "#fff",
      });

      if (!confirm.isConfirmed) return;

      // 🔹 Cierre visual con loading
      Swal.fire({
        title: "Cerrando sesión...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
        background: "#1e1e1e",
        color: "#fff",
      });

      try {
        await supabase.auth.signOut();
        localStorage.clear(); // opcional, por si guardas datos locales
        sessionStorage.clear();

        Swal.fire({
          title: "Sesión cerrada",
          text: "Has cerrado sesión correctamente.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
          background: "#1e1e1e",
          color: "#fff",
        });

        navigate("/login");
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
        Swal.fire({
          title: "Error",
          text: "No se pudo cerrar la sesión. Inténtalo nuevamente.",
          icon: "error",
          background: "#1e1e1e",
          color: "#fff",
        });
        navigate("/login");
      }

      return;
    }

    // 🚀 Navegación normal
    navigate(to);
  };


  return (
    <Main $isopen={state.toString()}>
      <span className="Sidebarbutton" onClick={() => setState(!state)}>
        {<v.iconoflechaderecha />}
      </span>

      <Container $isopen={state.toString()} className={state ? "active" : ""}>
        <div className="Logocontent">
          <div className="imgcontent">
            <img src={v.logo} />
          </div>
          <h2>ONE WAY PIZZA</h2>
        </div>

        {/* 🔹 LINKS PRINCIPALES */}
        {links.map(({ icon, label, to }) => (
          <div
            className={state ? "LinkContainer active" : "LinkContainer"}
            key={label}
            onClick={() => handleClick(label, to)}
          >
            <div className="Links">
              <section className={state ? "content open" : "content"}>
                <Icon className="Linkicon" icon={icon} />
                <span className={state ? "label_ver" : "label_oculto"}>
                  {label}
                </span>
              </section>
            </div>
          </div>
        ))}

        <Divider />

        {/* 🔹 LINK CERRAR SESIÓN */}
        {secondaryLinks.map(({ icon, label, color }) => (
          <div
            className={state ? "LinkContainer active" : "LinkContainer"}
            key={label}
            onClick={() => handleClick(label)}
          >
            <div className="Links">
              <section className={state ? "content open" : "content"}>
                <Icon color={color} className="Linkicon" icon={icon} />
                <span className={state ? "label_ver" : "label_oculto"}>
                  {label}
                </span>
              </section>
            </div>
          </div>
        ))}

        <ToggleTema />
      </Container>
    </Main>
  );
}

/* 🎨 ESTILOS */
const Container = styled.div`
  background: ${({ theme }) => theme.bgtotal};
  color: ${(props) => props.theme.text};
  position: fixed;
  padding-top: 20px;
  z-index: 2;
  height: 100%;
  width: 88px;
  transition: 0.1s ease-in-out;
  overflow-y: auto;
  overflow-x: hidden;
  border-right: 2px solid ${({ theme }) => theme.color2};

  &::-webkit-scrollbar {
    width: 6px;
    border-radius: 10px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${(props) => props.theme.colorScroll};
    border-radius: 10px;
  }

  &.active {
    width: 260px;
  }

  .Logocontent {
    display: flex;
    justify-content: center;
    align-items: center;
    padding-bottom: 60px;

    .imgcontent {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 30px;
      cursor: pointer;
      transition: 0.3s ease;
      transform: ${({ $isopen }) =>
          $isopen === "true" ? `scale(0.7)` : `scale(1.5)`}
        rotate(${({ theme }) => theme.logorotate});
      img {
        width: 100%;
        animation: flotar 1.7s ease-in-out infinite alternate;
      }
    }

    h2 {
      color: #f88533;
      display: ${({ $isopen }) => ($isopen === "true" ? `block` : `none`)};
    }
  }

  .LinkContainer {
    margin: 9px 0;
    margin-right: 10px;
    margin-left: 8px;
    transition: all 0.3s ease-in-out;
    position: relative;
    text-transform: uppercase;
    font-weight: 700;
    cursor: pointer;
  }

  .Links {
    border-radius: 12px;
    display: flex;
    align-items: center;
    text-decoration: none;
    width: 100%;
    color: ${(props) => props.theme.text};
    height: 60px;
    position: relative;

    .content {
      display: flex;
      justify-content: center;
      width: 100%;
      align-items: center;

      .Linkicon {
        display: flex;
        font-size: 33px;

        svg {
          font-size: 25px;
        }
      }

      .label_ver {
        transition: 0.3s ease-in-out;
        opacity: 1;
        display: initial;
      }

      .label_oculto {
        opacity: 0;
        display: none;
      }

      &.open {
        justify-content: start;
        gap: 20px;
        padding: 20px;
      }
    }

    &:hover {
      background: ${(props) => props.theme.bgAlpha};
    }

    &.active {
      background: ${(props) => props.theme.bg6};
      border: 2px solid ${(props) => props.theme.bg5};
      color: ${(props) => props.theme.color1};
      font-weight: 600;
    }
  }
`;

const Main = styled.div`
  .Sidebarbutton {
    position: fixed;
    top: 70px;
    left: 68px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: ${(props) => props.theme.bgtgderecha};
    box-shadow: 0 0 4px ${(props) => props.theme.bg3},
      0 0 7px ${(props) => props.theme.bg};
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    z-index: 3;
    transform: ${({ $isopen }) =>
      $isopen === "true" ? `translateX(173px) rotate(3.142rad)` : `initial`};
    color: ${(props) => props.theme.text};
  }
`;

const Divider = styled.div`
  height: 1px;
  width: 100%;
  background: ${(props) => props.theme.bg4};
  margin: ${() => v.lgSpacing} 0;
`;

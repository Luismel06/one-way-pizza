import styled, { ThemeProvider } from "styled-components";
import {
  AuthContextProvider,
  GlobalStyles,
  MyRoutes,
  Sidebar,
  useThemeStore,
  Login,
} from "./index";
import { Device } from "./styles/breakpoints";
import { useState } from "react";
import { useLocation } from "react-router-dom";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { themeStyle } = useThemeStore();
  const { pathname } = useLocation();

  // ✅ Ocultar sidebar y login en rutas públicas (Landing, Login, Callback)
  const rutasPublicas = ["/", "/login", "/auth/callback"];
  const esRutaPublica = rutasPublicas.includes(pathname);

  return (
    <ThemeProvider theme={themeStyle}>
      <AuthContextProvider>
        <GlobalStyles />
        {!esRutaPublica ? (
          <Container className={sidebarOpen ? "active" : ""}>
            <section className="contentSidebar">
              <Sidebar
                state={sidebarOpen}
                setState={() => setSidebarOpen(!sidebarOpen)}
              />
            </section>
            <section className="contentMenuambur">Menu ambur</section>
            <section className="contentRouters">
              <MyRoutes />
            </section>
          </Container>
        ) : (
          // ✅ Si es ruta pública, muestra solo el contenido del router (Landing, Login, etc.)
          <MyRoutes />
        )}
      </AuthContextProvider>
    </ThemeProvider>
  );
}

const Container = styled.main`
  display: grid;
  grid-template-columns: 1fr;
  transition: 0.1s ease-in-out;
  color: ${({ theme }) => theme.text};

  .contentSidebar {
    display: none;
    background-color: rgba(77, 43, 24, 0.5);
  }

  .contentMenuambur {
    position: absolute;
  }

  .contentRouters {
    grid-column: 1;
    width: 100%;
  }

  @media ${Device.tablet} {
    grid-template-columns: 88px 1fr;

    &.active {
      grid-template-columns: 260px 1fr;
    }

    .contentSidebar {
      display: initial;
    }

    .contentMenuambur {
      display: none;
    }

    .contentRouters {
      grid-column: 2;
    }
  }
`;

export default App;

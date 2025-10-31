import styled from "styled-components";
import { useState } from "react";
import Swal from "sweetalert2";
import { Btnsave, Footer, InputText2, Linea, Title } from "../../index";
import { v } from "../../styles/variables";
import { Device } from "../../styles/breakpoints";
import { useAuthStore } from "../../store/AuthStore.jsx";

export function LoginTemplate() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginGoogle, loginEmpleado } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      Swal.fire("Campos incompletos", "Debes llenar todos los campos", "warning");
      return;
    }
    setLoading(true);
    await loginEmpleado(email, password);
    setLoading(false);
  };

  return (
    <Container>
      <div className="card">
        <ContentLogo>
          <img src={v.logo} alt="Logo" />
        </ContentLogo>
        <Title $paddingbottom="20px">Ingresar</Title>

        {/* Login de empleados */}
        <form onSubmit={handleSubmit}>
          <InputText2>
            <input
              className="form__field"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </InputText2>
          <InputText2>
            <input
              className="form__field"
              placeholder="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </InputText2>
          <Btnsave
            titulo={loading ? "CARGANDO..." : "INGRESAR"}
            bgcolor="#fa6003"
            color="255,255,255"
            width="100%"
            type="submit"
            disabled={loading}
          />
        </form>

        <Linea>
          <span>o</span>
        </Linea>

        {/* Login de administradores (Google) */}
        <Btnsave
          funcion={loginGoogle}
          titulo="Google"
          bgcolor="#fff"
          icono={<v.iconogoogle />}
        />
      </div>
      <Footer />
    </Container>
  );
}

const Container = styled.div`
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  flex-direction: column;
  padding: 0px 10px;
  color: ${({ theme }) => theme.text};

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url("/fondo2.jpg");
    background-size: cover;
    background-position: center;
    opacity: 0.3;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }

  .card {
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;
    width: 100%;
    margin: 18px;
    @media ${Device.tablet} {
      width: 400px;
    }
  }
`;

const ContentLogo = styled.section`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px;

  img {
    width: 50%;
  }
`;

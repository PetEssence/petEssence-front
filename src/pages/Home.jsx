import { useAuth } from "../contexts/AuthContext";
import AppLayout from "../components/Layout";

export default function Home() {
  const { usuario } = useAuth();

  return (
    <AppLayout>
          <h1 className="font-bold text-primaryGreen mb-4 text-3xl">
            Bem-vindo(a) ao PetEssence 🐾
          </h1>
          <p className="text-gray-700 mb-6 text-xl">
            Olá, <b>{usuario?.displayName || usuario?.email}!</b>
          </p>
     </AppLayout>
  );
}

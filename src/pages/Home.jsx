import { useAuth } from "../contexts/AuthContext";
import AppLayout from "../components/Layout";
import PetHome from "../assets/home-petessence.png";

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

      <section className="flex flex-col items-center justify-center">
        <div className="relative">
          <img
            src={PetHome}
            className="w-full md:w-3/4 lg:w-2/3 max-w-lg h-auto object-contain mx-auto" />
        </div>
      </section>
    </AppLayout>

  );
}

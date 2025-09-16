import { useState, useEffect, useRef } from "react";
import {
  Button,
  Input,
  Form,
  message,
  DatePicker,
  Select,
  Upload,
  Modal,
} from "antd";
import AppLayout from "../../components/Layout";
import {
  collection,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  where,
  query,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import dayjs from "dayjs";
import { Navigate, useParams } from "react-router-dom";
import PetLayout from "../../components/PetLayout";
import ImageKit from "imagekit";
import { WhatsappLogoIcon } from "@phosphor-icons/react";
import { useAuth } from "../../contexts/AuthContext";

const { Option } = Select;

export default function PetMoreInfo() {
  const [pet, setPet] = useState([]);
  const [especies, setEspecies] = useState([]);
  const [racas, setRacas] = useState([]);
  const [tutoresDoPet, setTutoresDoPet] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [foto, setFoto] = useState(null);
  const [fezUploadFoto, setFezUploadFoto] = useState(false);
  const [carregandoSalvar, setCarregandoSalvar] = useState(false);
  const [ativo, setAtivo] = useState(true);
  const [usandoCamera, setUsandoCamera] = useState(false);
  const [modalAniversarioVisivel, setModalAniversarioVisivel] = useState(false);
  const [form] = Form.useForm();
  const { petId } = useParams();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const { usuario, cargoUsuario } = useAuth();

  const petCollectionRef = collection(db, "pet");
  const especieCollectionRef = collection(db, "especie");
  const racaCollectionRef = collection(db, "raca");
  const usuarioCollectionRef = collection(db, "usuario");

  const imagekit = new ImageKit({
    urlEndpoint: "https://ik.imagekit.io/petEssence",
    publicKey: import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY,
    privateKey: import.meta.env.VITE_IMAGEKIT_PRIVATE_KEY,
  });

  useEffect(() => {
    listarEspecies();
    listarUsuarios();
    listarRacas();
  }, []);

  useEffect(() => {
    if (cargoUsuario) {
      consultarPet();
    }
  }, [cargoUsuario]);

  useEffect(() => {
    carregaDadosForm();
  }, [pet]);

  const consultarPet = async () => {
    setCarregando(true);
    try {
      const docRef = doc(petCollectionRef, petId);
      const data = await getDoc(docRef);
      const dataDoc = { ...data.data(), id: data.id };
      if ((cargoUsuario == "cliente") && (dataDoc.tutorAnimal.includes(usuario.uid))) {
        setPet(dataDoc);
        carregaDadosForm();
      } else {
        return <Navigate to="/acessoNegado" replace />;
      }
    } catch (error) {
      message.error("Erro ao carregar pet");
    } finally {
      setCarregando(false);
    }
  };
  useEffect(() => {
    if (pet && usuarios.length > 0) {
      notificarAniversario(pet);
    }
  }, [pet, usuarios]);

  const carregaDadosForm = () => {
    const formData = {
      ...pet,
      foto: pet.foto,
      dataNasc: pet.dataNasc ? dayjs(pet.dataNasc) : null,
      dataCriacao: pet.dataCriacao ? dayjs(pet.dataCriacao) : null,
    };
    if (formData.foto) {
      setFoto(formData.foto);
      setFezUploadFoto(true);
    }
    setAtivo(formData.ativo);
    form.setFieldsValue(formData);
    setCarregando(false);
  };

  const listarEspecies = async () => {
    try {
      const especieData = await getDocs(especieCollectionRef);
      setEspecies(
        especieData.docs.map((doc) => ({ ...doc.data(), id: doc.id }))
      );
    } catch (error) {
      message.error("Erro ao carregar espécies");
    }
  };

  const listarUsuarios = async () => {
    try {
      const q = query(
        usuarioCollectionRef,
        where("ativo", "==", true),
        where("cargo", "==", "cliente")
      );
      const usuarioData = await getDocs(q);
      setUsuarios(
        usuarioData.docs.map((doc) => ({ ...doc.data(), id: doc.id }))
      );
    } catch (error) {
      message.error("Erro ao carregar clientes");
    }
  };

  const listarRacas = async () => {
    try {
      const racaData = await getDocs(racaCollectionRef);
      setRacas(racaData.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (error) {
      message.error("Erro ao carregar raças");
    }
  };

  const salvarPet = async () => {
    setCarregandoSalvar(true);
    try {
      const dados = await form.validateFields();
      let urlFoto = dados.foto || null;

      if (foto && !fezUploadFoto) {
        try {
          const redesenha = await redesenhaImagem(foto, 300, 300);
          const base64 = await convertParaBase64(redesenha);

          const upload = await imagekit.upload({
            file: base64,
            fileName: foto.name,
            folder: "/pets",
          });
          urlFoto = upload.url;
        } catch (err) {
          console.error("Erro ao redimensionar/upload da imagem:", err);
          message.error("Erro ao fazer upload da imagem.");
          setCarregandoSalvar(false);
          return;
        }
      }
      const dadosFormatados = {
        ...dados,
        ativo: ativo,
        dataNasc: dados.dataNasc ? dados.dataNasc.format("YYYY-MM-DD") : null,
        foto: urlFoto,
      };

      const petDoc = doc(petCollectionRef, petId);
      await updateDoc(petDoc, dadosFormatados);

      const tutoresAntigos = pet.owner || [];
      const tutoresNovos = dadosFormatados.owner || [];

      const tutoresAdicionados = tutoresNovos.filter(
        (id) => !tutoresAntigos.includes(id)
      );
      const tutoresRemovidos = tutoresAntigos.filter(
        (id) => !tutoresNovos.includes(id)
      );

      for (const tutorId of tutoresAdicionados) {
        const tutorRef = doc(usuarioCollectionRef, tutorId);
        const tutorSnap = await getDoc(tutorRef);

        if (tutorSnap.exists()) {
          const pets = tutorSnap.data().petsId || [];
          const petsAtualizados = pets.includes(petDoc.id)
            ? pets
            : [...pets, petDoc.id];

          await updateDoc(tutorRef, { petsId: petsAtualizados });
        }
      }

      for (const tutorId of tutoresRemovidos) {
        const tutorRef = doc(usuarioCollectionRef, tutorId);
        const tutorSnap = await getDoc(tutorRef);

        if (tutorSnap.exists()) {
          const pets = tutorSnap.data().petsId || [];
          const petsAtualizados = pets.filter((id) => id !== petDoc.id);

          await updateDoc(tutorRef, { petsId: petsAtualizados });
        }
      }
      setPet({ ...dadosFormatados, id: petDoc.id });
      message.success("Pet atualizado com sucesso!");
      setCarregandoSalvar(false);
    } catch (error) {
      console.error("Erro na validação:", error);
      message.error("Erro ao salvar pet");
      setCarregandoSalvar(false);
    }
  };
  const ativarInativar = (id, ativoStatus) => {
    Modal.confirm({
      title: `Confirmar ${ativoStatus ? "inativação" : "ativação"}`,
      content: `Tem certeza que deseja ${
        ativoStatus ? "desativar" : "ativar"
      } este pet?`,
      okText: "Confirmar",
      okType: "primary",
      cancelText: "Cancelar",
      okButtonProps: {
        className: "!bg-primaryGreen !hover:bg-primaryGreenHouver",
      },
      onOk: async () => {
        try {
          const petDoc = doc(petCollectionRef, id);
          const novoStatus = { ativo: !ativoStatus };
          await updateDoc(petDoc, novoStatus);
          setAtivo(!ativo);
          message.success("Pet atualizado com sucesso!");
        } catch (error) {
          message.error("Erro ao atualizar pet");
        }
      },
    });
  };

  const pegaNomeEspecie = (especieId) => {
    const especie = especies.find((s) => s.id === especieId);
    return especie ? especie.nome : "Espécie não encontrada";
  };

  const pegaNomeRaca = (racaId) => {
    const raca = racas.find((r) => r.id === racaId);
    return raca ? raca.nome : "Raça não encontrada";
  };

  const pegaNomeUsuario = (ownerId) => {
    const owner = usuarios.find((u) => u.id === ownerId);
    return owner ? owner.name : "Dono não encontrado";
  };

  const redesenhaImagem = (file, width = 300, height = 300) => {
    return new Promise((resolve, reject) => {
      const img = document.createElement("img");
      const reader = new FileReader();

      reader.onload = (e) => {
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");

          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            resolve(blob);
          }, file.type || "image/jpeg");
        };
        img.src = e.target.result;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const convertParaBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const notificarAniversario = (pet) => {
    if (!pet?.dataNasc) return;
    const dataNasc = dayjs(pet.dataNasc).format("DD/MM");
    const diaAtual = dayjs().format("DD/MM");

    if (dataNasc === diaAtual) {
      const tutores =
        pet.tutorAnimal?.map((tutorId) => {
          const tutor = usuarios.find((u) => u.id === tutorId);
          return tutor ? tutor : { id: tutorId, nome: "Tutor não encontrado" };
        }) || [];

      setTutoresDoPet(tutores);
      setModalAniversarioVisivel(true);
    }
  };

  useEffect(() => {
    if (usandoCamera && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          videoRef.current.srcObject = stream;
        })
        .catch((err) => {
          console.error("Erro ao acessar câmera:", err);
          setUsandoCamera(false);
        });
    }
  }, [usandoCamera]);

  const capturaFoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      const novoArquivo = new File([blob], "photo.jpg", { type: "image/jpeg" });
      setFoto(novoArquivo);
      setFezUploadFoto(false);
      fechaCamerfa();
    }, "image/jpeg");
  };

  const fechaCamerfa = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setUsandoCamera(false);
  };

  return (
    <AppLayout>
      <Modal
        title={`🎉 Hoje é aniversário de ${pet?.nome}!`}
        open={modalAniversarioVisivel}
        onCancel={() => setModalAniversarioVisivel(false)}
        footer={null}
      >
        <p className="mb-4">Escolha para qual tutor deseja enviar mensagem:</p>
        <div className="flex flex-col gap-3">
          {tutoresDoPet.length > 0 ? (
            tutoresDoPet.map((tutor) => (
              <div
                key={tutor.id}
                className="flex justify-between items-center p-2 rounded"
              >
                <span>{tutor.nome}</span>
                <Button
                  type="primary"
                  icon={<WhatsappLogoIcon size={20} />}
                  className="!bg-green-500 !hover:bg-green-600"
                  onClick={() => {
                    const url = `https://api.whatsapp.com/send/?phone=55${
                      tutor.celular
                    }&text=${encodeURIComponent(
                      `Olá ${tutor.nome}! Hoje é aniversário do(a) ${pet.nome}! Venha na loja física resgatar seu mimo!🎉`
                    )}`;
                    window.open(url, "_blank");
                  }}
                >
                  Enviar mensagem
                </Button>
              </div>
            ))
          ) : (
            <p className="text-gray-500">Nenhum tutor encontrado.</p>
          )}
        </div>
      </Modal>

      <PetLayout petId={pet.id} />
      <div className="space-y-6 flex items-center justify-center w-full">
        <Form
          form={form}
          layout="vertical"
          className="mt-4 flex flex-col w-2/5"
          onFinish={salvarPet}
        >
          <Form.Item
            label="Foto do pet"
            name="foto"
            className="flex justify-center items-center"
          >
            <div className="flex justify-center items-center flex-col gap-5">
              {foto && !usandoCamera && (
                <div className="mt-2 w-[300px] h-[300px] rounded overflow-hidden">
                  <img
                    src={fezUploadFoto ? foto : URL.createObjectURL(foto)}
                    alt="preview"
                    className="w-[300px] h-[300px] object-cover rounded"
                  />
                </div>
              )}

              <Upload
                beforeUpload={(file) => {
                  setFezUploadFoto(false);
                  setFoto(file);
                  return false;
                }}
                maxCount={1}
                showUploadList={false}
              >
                <Button>Selecionar Imagem</Button>
              </Upload>
              <p>ou</p>
              {!usandoCamera && (
                <Button onClick={() => setUsandoCamera(true)}>
                  Usar câmera
                </Button>
              )}
              {usandoCamera && (
                <div className="flex flex-col items-center gap-3">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="rounded w-[300px] h-[300px] bg-black object-cover overflow-hidden"
                  ></video>
                  <div className="flex gap-3">
                    <Button type="primary" onClick={capturaFoto}>
                      Capturar Foto
                    </Button>
                    <Button danger onClick={fechaCamerfa}>
                      Cancelar
                    </Button>
                  </div>
                  <canvas ref={canvasRef} className="hidden"></canvas>
                </div>
              )}
            </div>
          </Form.Item>

          <Form.Item
            label="Nome"
            name="nome"
            rules={[{ required: true, message: "Por favor, insira o nome!" }]}
          >
            <Input />
          </Form.Item>

          <div className="w-full flex gap-8 justify-between">
            <Form.Item
              label="Sexo"
              name="sexo"
              className="w-3/6"
              rules={[
                { required: true, message: "Por favor, selecione o gênero!" },
              ]}
            >
              <Select
                placeholder="Selecione o gênero"
                defaultValue={pet.sexo}
                options={[
                  { value: "femea", label: "Fêmea" },
                  { value: "macho", label: "Macho" },
                  { value: "outros", label: "Outros" },
                ]}
              ></Select>
            </Form.Item>
            <Form.Item
              label="Data de nascimento ou estimativa"
              tooltip="Indique a data de nascimento ou uma possível data que o pet tenha nascido"
              name="dataNasc"
              className="w-3/6"
              rules={[
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    if (value.isAfter(dayjs())) {
                      return Promise.reject("A data não pode ser no futuro!");
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <DatePicker
                format="DD/MM/YYYY"
                style={{ width: "100%" }}
                placeholder="Selecione uma data"
                disabledDate={(current) =>
                  current && current > dayjs().endOf("day")
                }
              />
            </Form.Item>
          </div>

          <div className="w-full flex gap-8 justify-between">
            <Form.Item
              label="Espécie"
              name="especie"
              className="w-3/6"
              rules={[
                {
                  required: true,
                  message: "Por favor, selecione a espécie!",
                },
              ]}
            >
              <Select
                placeholder="Selecione a espécie"
                defaultValue={pegaNomeEspecie(pet.especie)}
              >
                {especies.map((especie) => (
                  <Option key={especie.id} value={especie.id}>
                    {especie.nome}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Raça"
              className="w-3/6"
              name="raca"
              rules={[
                { required: true, message: "Por favor, selecione a raça!" },
              ]}
            >
              <Select
                placeholder="Selecione a raça"
                defaultValue={pegaNomeRaca(pet.raca)}
              >
                {racas.map((raca) => (
                  <Option key={raca.id} value={raca.id}>
                    {raca.nome}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <Form.Item
            label="Tutor"
            name="tutorAnimal"
            rules={[
              { required: true, message: "Por favor, selecione um tutor!" },
            ]}
          >
            <Select
              placeholder="Selecione um ou mais tutores"
              defaultValue={pet.tutorAnimal?.map((id) => pegaNomeUsuario(id))}
              mode="multiple"
            >
              {usuarios.map((usuario) => (
                <Option key={usuario.id} value={usuario.id}>
                  {usuario.nome}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label={null}>
            <div className="flex justify-between">
              <Button danger onClick={() => ativarInativar(pet.id, ativo)}>
                {ativo ? "Desativar" : "Ativar"}
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={carregandoSalvar}
              >
                Confirmar
              </Button>
            </div>
          </Form.Item>
        </Form>
      </div>
    </AppLayout>
  );
}

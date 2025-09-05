import { useState, useEffect, useRef } from "react";
import {
  Card,
  Button,
  Input,
  Tag,
  Modal,
  Form,
  message,
  DatePicker,
  Select,
  Avatar,
  Upload,
} from "antd";
import {
  ClearOutlined,
  FilterOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import AppLayout from "../../components/Layout";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  addDoc,
  where,
  query,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import ImageKit from "imagekit";

const { Meta } = Card;
const { Option } = Select;

export default function Pet() {
  const [pets, setPets] = useState([]);
  const [especies, setEspecies] = useState([]);
  const [racas, setRacas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchRaca, setSearchRaca] = useState(null);
  const [searchEspecie, setSearchEspecie] = useState(null);
  const [searchUsuario, setSearchUsuario] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [file, setFile] = useState(null);
  const [savingLoading, setSavingLoading] = useState(false);
  const [usingCamera, setUsingCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const petCollectionRef = collection(db, "pet");
  const especieCollectionRef = collection(db, "especie");
  const racaCollectionRef = collection(db, "raca");
  const usuarioCollectionRef = collection(db, "usuario");
  const isFilterActive = searchText || searchRaca || searchEspecie || searchUsuario;

  const imagekit = new ImageKit({
    urlEndpoint: "https://ik.imagekit.io/petEssence",
    publicKey: import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY,
    privateKey: import.meta.env.VITE_IMAGEKIT_PRIVATE_KEY,
  });

  useEffect(() => {
    loadEspecies();
    loadRacas();
    loadUsuarios();
    loadPets();
  }, []);

  const loadPets = async () => {
    setLoading(true);
    try {
      const data = await getDocs(petCollectionRef);
      setPets(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (error) {
      message.error("Erro ao carregar pets");
    } finally {
      setLoading(false);
    }
  };

  const loadEspecies = async () => {
    try {
      const especieData = await getDocs(especieCollectionRef);
      setEspecies(
        especieData.docs.map((doc) => ({ ...doc.data(), id: doc.id }))
      );
    } catch (error) {
      message.error("Erro ao carregar espécies");
    }
  };

  const loadUsuarios = async () => {
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

  const loadRacas = async () => {
    try {
      const racaData = await getDocs(racaCollectionRef);
      setRacas(racaData.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (error) {
      message.error("Erro ao carregar raças");
    }
  };

  const handleAddPet = () => {
    form.resetFields();
    setFile(null);
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      setSavingLoading(true);
      const values = await form.validateFields();
      let photoUrl = values.foto || null;
      if (file) {
        try {
          const resized = await resizeImage(file, 300, 300);
          const base64 = await convertToBase64(resized);

          const upload = await imagekit.upload({
            file: base64,
            fileName: file.name,
            folder: "/pets",
          });
          photoUrl = upload.url;
        } catch (err) {
          console.error("Erro ao redimensionar/upload da imagem:", err);
          message.error("Erro ao fazer upload da imagem.");
          return;
        }
      }
      const formattedValues = {
        ...values,
        foto: photoUrl,
        dataNasc: values.dataNasc
          ? values.dataNasc.format("YYYY-MM-DD")
          : null,
      };

      const docRef = await addDoc(petCollectionRef, {
        ...formattedValues,
        dataCriacao: new Date().toISOString().split("T")[0],
        ativo: true,
      });

      for (const ownerId of formattedValues.tutorAnimal) {
        const ownerDocRef = doc(usuarioCollectionRef, ownerId);
        const ownerSnap = await getDoc(ownerDocRef);

        if (ownerSnap.exists()) {
          const existingPets = ownerSnap.data().petsId || [];

          const updatedPets = existingPets.includes(docRef.id)
            ? existingPets
            : [...existingPets, docRef.id];

          await updateDoc(ownerDocRef, { petsId: updatedPets });
        }
      }
      setPets([
        ...pets,
        {
          id: docRef.id,
          ...formattedValues,
          dataCriacao: new Date().toISOString().split("T")[0],
          ativo: true,
        },
      ]);
      message.success("Pet adicionado com sucesso!");
      setIsModalVisible(false);
      form.resetFields();
      setFile(null);
      setSavingLoading(false);
    } catch (error) {
      console.error("Erro na validação:", error);
      message.error("Erro ao salvar pet.");
      setSavingLoading(false);
    }
  };

  const resizeImage = (file, width = 300, height = 300) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
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

  const convertToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const filteredPet = pets.filter((pet) => {
    const matchName = pet.nome.toLowerCase().includes(searchText.toLowerCase());
    const matchRaca = !searchRaca || pet.raca === searchRaca;
    const matchEspecie = !searchEspecie || pet.especie === searchEspecie;
    const matchTutor = !searchUsuario || pet.tutorAnimal.includes(searchUsuario);

    return matchName && matchRaca && matchEspecie && matchTutor;
  });

  const handleClearFilters = () => {
    setSearchText("");
    setSearchRaca(null);
    setSearchEspecie(null);
    setSearchUsuario(null);
  };

  const getSpecieName = (specieId) => {
    const specie = especies.find((s) => s.id === specieId);
    return specie ? specie.nome : "Espécie não encontrada";
  };

  const getBreedName = (breedId) => {
    const breed = racas.find((r) => r.id === breedId);
    return breed ? breed.nome : "Raça não encontrada";
  };

  const getOwnerName = (ownerId) => {
    const owner = usuarios.find((u) => u.id === ownerId);
    return owner ? owner.nome : "Dono não encontrado";
  };

  useEffect(() => {
    if (usingCamera && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          videoRef.current.srcObject = stream;
        })
        .catch((err) => {
          console.error("Erro ao acessar câmera:", err);
          setUsingCamera(false);
        });
    }
  }, [usingCamera]);

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      const newFile = new File([blob], "photo.jpg", { type: "image/jpeg" });
      setFile(newFile);
      stopCamera();
    }, "image/jpeg");
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setUsingCamera(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Pets</h1>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPet}>
            Cadastrar Pet
          </Button>
        </div>

        <Card>
          <div className="mb-4 flex gap-5">
            <Input
              placeholder="Buscar Pet..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="max-w-sm"
            />
            <Select
              placeholder="Filtre por raça"
              className="w-52"
              allowClear={true}
              value={searchRaca}
              prefix={<FilterOutlined />}
              onChange={(e) => setSearchRaca(e)}
            >
              {racas.map((raca) => (
                <Option key={raca.id} value={raca.id}>
                  {raca.nome}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="Filtre por espécie"
              className="w-52"
              allowClear={true}
              value={searchEspecie}
              prefix={<FilterOutlined />}
              onChange={(e) => setSearchEspecie(e)}
            >
              {especies.map((e) => (
                <Option key={e.id} value={e.id}>
                  {e.nome}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="Filtre por tutor"
              className="w-52"
              allowClear={true}
              value={searchUsuario}
              prefix={<FilterOutlined />}
              onChange={(e) => setSearchUsuario(e)}
            >
              {usuarios.map((u) => (
                <Option key={u.id} value={u.id}>
                  {u.name}
                </Option>
              ))}
            </Select>
            {isFilterActive && (
              <Button
                icon={<ClearOutlined />}
                onClick={() => handleClearFilters()}
                type="primary"
              >
                Limpar Filtros
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPet.length > 0 ? (
              filteredPet.map((pet) => (
                <Link to={`/${pet.id}`} key={pet.id}>
                  <Card
                    key={pet.id}
                    hoverable
                    className="w-full"
                    cover={
                      <Avatar
                        shape="square"
                        size="large"
                        src={pet.foto}
                        className="object-contain"
                        style={{ minHeight: 200, maxHeight: 200 }}
                      />
                    }
                  >
                    <Meta
                      title={
                        <div className="flex items-center justify-between">
                          <span className="truncate">{pet.nome}</span>
                          {pet.ativo ? (
                            <Tag color="green" size="small">
                              Ativo
                            </Tag>
                          ) : (
                            <Tag color="red" size="small">
                              Inativo
                            </Tag>
                          )}
                        </div>
                      }
                      description={
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500 truncate">
                            Tutores:{" "}
                            {pet.tutorAnimal.map((id) => getOwnerName(id) + " - ")}
                          </div>
                          <div className="text-xs text-gray-400">
                            Raça: {getBreedName(pet.raca)}
                          </div>
                          <div className="text-xs text-gray-400">
                            Espécie: {getSpecieName(pet.especie)}
                          </div>
                        </div>
                      }
                    />
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-300 py-8">
                Não há registros.
              </div>
            )}
          </div>
        </Card>

        <Modal
          title={"Cadastrar Pet"}
          open={isModalVisible}
          onOk={handleModalOk}
          okText="Confirmar"
          cancelText="Cancelar"
          confirmLoading={savingLoading}
          onCancel={() => setIsModalVisible(false)}
          width={600}
        >
          <Form form={form} layout="vertical" className="mt-4 flex flex-col">
            <Form.Item
              label="Foto do pet"
              name="foto"
              className="flex justify-center items-center"
            >
              <div className="flex justify-center items-center flex-col gap-5">
                {file && !usingCamera && (
                  <img
                    src={URL.createObjectURL(file)}
                    alt="preview"
                    className="mt-2 object-cover rounded w-[300px] h-[300px]"
                  />
                )}
                <Upload
                  beforeUpload={(file) => {
                    setFile(file);
                    return false;
                  }}
                  maxCount={1}
                  showUploadList={false}
                >
                  <Button>Selecionar Imagem</Button>
                </Upload>
                <p>ou</p>

                {!usingCamera && (
                  <Button onClick={() => setUsingCamera(true)}>
                    Usar câmera
                  </Button>
                )}

                {usingCamera && (
                  <div className="flex flex-col items-center gap-3">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="rounded w-[300px] h-[300px] bg-black object-cover"
                    ></video>
                    <div className="flex gap-3">
                      <Button type="primary" onClick={capturePhoto}>
                        Capturar Foto
                      </Button>
                      <Button danger onClick={stopCamera}>
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
                  { required: true, message: "Por favor, selecione o sexo!" },
                ]}
              >
                <Select
                  placeholder="Selecione o sexo"
                  defaultValue={undefined}
                  options={[
                    { value: "femea", label: "Fêmea" },
                    { value: "macho", label: "Macho" },
                    { value: "outros", label: "Outro" },
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
                <Select placeholder="Selecione a espécie">
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
                <Select placeholder="Selecione a raça" defaultValue={undefined}>
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
                defaultValue={undefined}
                mode="multiple"
              >
                {usuarios.map((usuario) => (
                  <Option key={usuario.id} value={usuario.id}>
                    {usuario.nome}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AppLayout>
  );
}

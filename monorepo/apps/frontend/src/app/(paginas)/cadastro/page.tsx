"use client";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { IconCamera, IconEye, IconEyeOff, IconUpload } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

// Validação com Zod
const schema = z.object({
    nome: z.string().min(1, "Nome é obrigatório").regex(/^[^\d]*$/, "O nome não pode conter números"),
    email: z.string().email("Email inválido"),
    senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
    confirmSenha: z.string(),
    celular: z
        .string()
        .min(10, "Celular inválido")
        .max(15, "Celular inválido")
        .regex(/^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/, "Formato de celular inválido"),
    cpf: z
        .string()
        .length(11, "CPF deve conter 11 dígitos")
        .regex(/^\d{11}$/, "CPF deve conter apenas números"),
    imagem: z.any().optional(),
}).refine((data)=> data.senha === data.confirmSenha, {
    message: 'As senhas não coincidem',
    path: ["confirmSenha"],
}
);

type FormInputs = z.infer<typeof schema>;

export default function FormularioDeCadastro() {
    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<FormInputs>({
        resolver: zodResolver(schema),
    });

    const [preview, setPreview] = useState<string | null>(null);
    const [cameraAtiva, setCameraAtiva] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);


    const onSubmit = async (data: FormInputs) => {
        const formData = new FormData();
        formData.append("nome", data.nome);
        formData.append("email", data.email);
        formData.append("senha", data.senha);
        formData.append("celular", data.celular);
        formData.append("cpf", data.cpf);
        if (data.imagem?.[0]) {
            formData.append("imagem", data.imagem[0]);
        }

        // await fetch("http://localhost:3001/usuarios/cadastro", {
        //   method: "POST",
        //   body: formData,
        // });

        alert("Cadastro enviado!");
    };

    const ligarCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream);
            setCameraAtiva(true);
        } catch (error) {
            alert("Erro ao acessar a câmera. Verifique as permissões.");
            console.error(error);
        }
    };

    const desligarCamera = () => {
        stream?.getTracks().forEach(track => track.stop());
        setStream(null);
        setCameraAtiva(false);
    };

    const handleCapturePhoto = () => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (canvas && video) {
            const context = canvas.getContext("2d");
            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], "foto_perfil.jpg", {
                            type: "image/jpeg",
                        });
                        const dt = new DataTransfer();
                        dt.items.add(file);
                        setValue("imagem", dt.files);
                        setPreview(URL.createObjectURL(file));
                        desligarCamera(); // desliga a câmera depois da foto
                    }
                }, "image/jpeg");
            }
        }
    };


    const removerImagem = () => {
        setPreview(null);
        setValue("imagem", undefined);
        setCameraAtiva(false);
        if (videoRef.current?.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach((track) => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    return (
        <div className="login h-min-lvh flex justify-center items-start">
            <Link href={"/"}><Image src={"/LogoMarketplace.png"} alt={"Logo do marketplace"} width={120} height={120}/></Link>
            <form onSubmit={handleSubmit(onSubmit)} className="rounded-md max-w-xl mx-auto py-15 flex flex-col gap-4 w-[600px]">
                <h2 className="text-2xl font-semibold">Cadastre-se</h2>
                <div className="input-field">
                    <input {...register("nome")} placeholder="Nome" className="border p-2 rounded" />
                {errors.nome && <span className="text-gray-400 font-semibold text-sm">{errors.nome.message}</span>}
                </div>

                <div className="input-field">
                    <input {...register("email")} placeholder="Email" type="email" className="border p-2 rounded" />
                {errors.email && <span className="text-gray-400 font-semibold text-sm">{errors.email.message}</span>}
                </div>

                <div className="input-field">
                    <input {...register("celular")} maxLength={11} placeholder="Celular (ex: 81999998888)" className="border p-2 rounded" />
                    {errors.celular && <span className="text-gray-400 font-semibold text-sm">{errors.celular.message}</span>}
                </div>

                <div className="input-field">
                <input {...register("cpf")} maxLength={11} placeholder="CPF (somente números)" className="border p-2 rounded" />
                {errors.cpf && <span className="text-gray-400 font-semibold text-sm">{errors.cpf.message}</span>}
                </div>

                <div className="input-field relative">
                    <input
                        {...register("senha")}
                        placeholder="Senha"
                        type={showPassword ? "text" : "password"}
                        className="border p-2 rounded w-full pr-12"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                        {showPassword ? <IconEye size={20} /> : <IconEyeOff size={20} />}
                    </button>
                {errors.senha && <span className="text-gray-400 font-semibold text-sm mr-10">{errors.senha.message}</span>}
                </div>

                <div className="input-field relative">
                    <input
                        {...register("confirmSenha")}
                        placeholder="Confirme sua senha"
                        type={showPassword ? "text" : "password"}
                        className="border p-2 rounded w-full pr-12"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                        {showPassword ? <IconEye size={20} /> : <IconEyeOff size={20} />}
                    </button>
                {errors.confirmSenha && <span className="text-gray-400 font-semibold text-sm mr-10">{errors.confirmSenha.message}</span>}
                </div>

                {!preview && (
                    <>
                        <label className="font-semibold">Escolha uma imagem para foto de perfil (opcional):</label>

                        <div className="flex gap-4 items-center">
                            <div>
                                <input
                                    id="fileUpload"
                                    type="file"
                                    accept="image/*"
                                    {...register("imagem")}
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setPreview(URL.createObjectURL(file));
                                            const dt = new DataTransfer();
                                            dt.items.add(file);
                                            setValue("imagem", dt.files);
                                        }
                                    }}
                                />
                                <label
                                    htmlFor="fileUpload"
                                    className="flex items-center gap-2 bg-none px-4 py-2 rounded cursor-pointer border hover:bg-gray-200 hover:text-green-950 transition-colors"
                                >
                                    <IconUpload size={20} /> Escolher arquivo
                                </label>
                            </div>

                            <button
                                type="button"
                                onClick={ligarCamera}
                                className="flex items-center gap-2 bg-none px-4 py-2 rounded border hover:bg-gray-200 hover:text-green-950 transition-colors"
                            >
                                <IconCamera size={20} /> Tirar foto
                            </button>
                        </div>

                        <span className="text-sm text-gray-400 font-semibold">
                            {preview ? "Imagem selecionada!" : "Nenhuma imagem selecionada"}
                        </span>

                        {cameraAtiva && (
                            <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex flex-col items-center justify-center">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className="w-120 h-100 rounded-xl border-1 border-gray-300"
                                />
                                <div className="flex gap-2 mt-4">
                                    <button
                                        type="button"
                                        onClick={handleCapturePhoto}
                                        className="bg-verde text-white py-2 px-4 rounded"
                                    >
                                        Tirar Foto
                                    </button>
                                    <button
                                        type="button"
                                        onClick={desligarCamera}
                                        className="bg-gray-400 text-white py-2 px-4 rounded"
                                    >
                                        Fechar Câmera
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
                

                <canvas ref={canvasRef} className="hidden text-" />

                {preview && (
                    <div className="flex flex-col items-center gap-5">
                        <p className="font-semibold">Prévia da imagem:</p>
                        <img src={preview} alt="Prévia" className="w-32 h-32 rounded-full object-cover border-pink-400" />
                        <button type="button" onClick={removerImagem} className="bg-gray-400 py-2 px-4 rounded cursor-pointer w-50">
                            Remover imagem
                        </button>
                    </div>
                )}

                <button type="submit" className="botao-azul text-white py-2 rounded">
                    Cadastrar
                </button>
            </form>
        </div>
    );
}


// export default function page() {
//     return (
//         <div className="bg-verde h-lvh flex items-center justify-center">
//             <div className="w-1/2 bg-white h-1/2 rounded-xl">
//                 <h1>Cadastre-se</h1>
//                 <input placeholder="Nome" className="py-2 px-10"/>
//             </div>
//         </div>
//     )
// };

'use client';
import { useState } from 'react';
import { IconPencil, IconTrash, IconArrowNarrowDown } from '@tabler/icons-react';
import { z } from "zod";
import { enderecoSchema as schema } from "@/../../packages/shared/schemas/enderecos";

type Endereco = z.infer<typeof schema>;

export default function Page() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [enderecos, setEnderecos] = useState<Endereco[]>([
    {
      logradouro: 'Rua A',
      numero: '123',
      complemento: 'Apartamento 101',
      cep: '12345-678',
      bairro: 'Centro',
      cidade: 'Cidade A',
      estado: 'SP',
    },
    {
      logradouro: 'Av. B',
      numero: '456',
      complemento: 'Casa',
      cep: '23456-789',
      bairro: 'Alvorada',
      cidade: 'Cidade B',
      estado: 'RJ',
    },
  ]);

  const [editandoIndex, setEditandoIndex] = useState<number | null>(null);
  const [enderecoEditado, setEnderecoEditado] = useState<Endereco>({ ...enderecos[0] });

  const handleEditar = (index: number) => {
    setEditandoIndex(index);
    setEnderecoEditado({ ...enderecos[index] });
  };

  const handleSalvar = (index: number) => {
    const enderecoLimpo = {
      ...enderecoEditado,
      cep: enderecoEditado.cep.replace(/\D/g, ''),
    }

    const result = schema.safeParse(enderecoLimpo);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    const novos = [...enderecos];
    novos[index] = enderecoEditado;
    setEnderecos(novos);
    setEditandoIndex(null);
    setErrors({});
  };

  const handleExcluir = (index: number) => {
    const novos = [...enderecos];
    novos.splice(index, 1);
    setEnderecos(novos);


    if (editandoIndex === index) {
      setEditandoIndex(null);
    }
  };

  const formatarCEP = (cep: string) => {
    return cep.replace(/^(\d{5})(\d{3})$/, '$1-$2');
  }

  const handleChange = (campo: string, valor: string) => {
    setEnderecoEditado((prev) => ({ ...prev, [campo]: valor }));
  };

  return (
    <div className="bg-white min-h-screen py-10 px-4 texto-azul">
      <h2 className="text-3xl font-bold text-center mb-10">Meus Endereços</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {enderecos.map((endereco, index) => (
          <div
            key={index}
            className="border rounded-lg p-6 shadow-sm bg-white flex flex-col justify-between"
          >
            {editandoIndex === index ? (
              <div className="space-y-2">
                <input
                  className="border px-2 py-1 w-full"
                  placeholder='Logradouro'
                  value={enderecoEditado.logradouro}
                  onChange={(e) => handleChange('logradouro', e.target.value)}
                /> {errors.logradouro && <p className="text-red-500 text-sm">{errors.logradouro}</p>}
                <input
                  className="border px-2 py-1 w-full"
                  placeholder='Número'
                  value={enderecoEditado.numero}
                  onChange={(e) => handleChange('numero', e.target.value)}
                /> {errors.numero && <p className="text-red-500 text-sm">{errors.numero}</p>}
                <input
                  className="border px-2 py-1 w-full"
                  placeholder='Complemento'
                  value={enderecoEditado.complemento}
                  onChange={(e) => handleChange('complemento', e.target.value)}
                /> {errors.complemento && <p className="text-red-500 text-sm">{errors.complemento}</p>}
                <input
                  type='text'
                  maxLength={9}
                  value={formatarCEP(enderecoEditado.cep)}
                  onChange={(e) => handleChange('cep', e.target.value)}
                  className='border px-2 py-1 w-full'
                  placeholder='CEP'
                />
                {errors.cep && <p className="text-red-500 text-sm">{errors.cep}</p>}
                <input
                  className="border px-2 py-1 w-full"
                  placeholder='Bairro'
                  value={enderecoEditado.bairro}
                  onChange={(e) => handleChange('bairro', e.target.value)}
                /> {errors.bairro && <p className="text-red-500 text-sm">{errors.bairro}</p>}
                <input
                  className="border px-2 py-1 w-full"
                  placeholder='Cidade'
                  value={enderecoEditado.cidade}
                  onChange={(e) => handleChange('cidade', e.target.value)}
                /> {errors.cidade && <p className="text-red-500 text-sm">{errors.cidade}</p>}
                <input
                  className="border px-2 py-1 w-full"
                  maxLength={2}
                  placeholder='Estado(Sigla Ex: PE, SP, RJ)'
                  value={enderecoEditado.estado}
                  onChange={(e) => handleChange('estado', e.target.value)}
                /> {errors.estado && <p className="text-red-500 text-sm">{errors.estado}</p>}
              </div>
            ) : (
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">
                  {endereco.logradouro}, {endereco.numero}
                </h3>
                <p>{endereco.complemento}</p>
                <p>CEP {endereco.cep}</p>
                <p>{endereco.bairro}</p>
                <p>
                  {endereco.cidade}, {endereco.estado}
                </p>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              {editandoIndex === index ? (
                <button
                  onClick={() => handleSalvar(index)}
                  className="flex items-center px-3 gap-2 border rounded bg-green-100 hover:bg-green-200"
                >
                  <IconArrowNarrowDown size={20} /> Salvar
                </button>
              ) : (
                <button
                  onClick={() => handleEditar(index)}
                  className="flex items-center px-2 gap-2 border rounded bg-gray-100 hover:bg-gray-200"
                >
                  <IconPencil size={20} /> Editar
                </button>
              )}
              <button
                onClick={() => handleExcluir(index)}
                className="flex items-center px-3 py-1 border rounded bg-red-100 hover:bg-red-200"
              >
                <IconTrash size={20} /> Excluir
              </button>
            </div>
          </div>
        ))}
        <div
          onClick={() => {
            const novo = {
              logradouro: '',
              numero: '',
              complemento: '',
              cep: '',
              bairro: '',
              cidade: '',
              estado: '',
            };
            setEnderecos([...enderecos, novo]);
            setEnderecoEditado(novo);
            setEditandoIndex(enderecos.length);
            setErrors({});
          }}
          className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition"
        >
          <p>Adicione um novo endereço</p>
          <span className="text-4xl text-gray-400">+</span>
        </div>

      </div>
    </div>
  );
}
"use client";
import { useState } from "react";
import { NumericFormat } from "react-number-format";

export default function InputPreco() {
    const [preco, setPreco] = useState('');

    return (
        <div className="w-full">
            <NumericFormat
                value={preco}
                onValueChange={(values) => setPreco(values.value)}
                thousandSeparator="."
                decimalSeparator=","
                prefix="R$ "
                decimalScale={2}
                fixedDecimalScale
                allowNegative={false}
                className="w-9/11 bg-white border-2 border-gray-400 rounded-xl px-4 py-2 "
                placeholder="R$ "
            />
        </div>
    )
};

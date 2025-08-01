"use client";
import { NumericFormat } from "react-number-format";

export interface InputPrecoProps {
    value: number;
    onChange: (value: number) => void;
}

export default function InputPreco({ value, onChange }: InputPrecoProps) {
    return (
        <div className="w-full">
            <NumericFormat
                value={value}
                onValueChange={(values) => {
                    const raw = values.floatValue;
                    onChange(raw || 0);
                }}
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

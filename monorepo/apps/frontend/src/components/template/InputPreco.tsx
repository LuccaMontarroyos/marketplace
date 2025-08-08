"use client";
import { NumericFormat } from "react-number-format";

export interface InputPrecoProps {
    value: number;
    onChange: (value: number) => void;
    className: string;
}

export default function InputPreco({ value, onChange, className }: InputPrecoProps) {
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
                className={className}
                placeholder="R$ "
            />
        </div>
    )
};

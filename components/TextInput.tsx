export const TextInput = ({
    value,
    onChange,
    placeholder,
    type = 'text'
}: {
    value: string | number;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
}) => (
    <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-6 px-3 text-xs bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700 rounded-lg 
            text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#423CAB]/50 focus:border-[#423CAB]
            placeholder:text-gray-400 dark:placeholder:text-gray-500"
    />
);
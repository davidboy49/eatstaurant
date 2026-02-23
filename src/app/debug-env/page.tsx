export const metadata = {
    robots: {
        index: false,
        follow: false,
    },
};

const firebaseEnvKeys = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

const maskValue = (value: string) => {
    if (!value) {
        return "(empty)";
    }

    if (value.length <= 8) {
        return `${value[0] ?? ""}***${value[value.length - 1] ?? ""}`;
    }

    return `${value.slice(0, 4)}***${value.slice(-4)}`;
};

export default function DebugEnvPage() {
    const rows = firebaseEnvKeys.map((key) => {
        const rawValue = process.env[key] ?? "";
        const trimmedValue = rawValue.trim();

        return {
            key,
            isSet: rawValue.length > 0,
            hasWhitespacePadding: rawValue !== trimmedValue,
            hasWrappingQuotes:
                (trimmedValue.startsWith('"') && trimmedValue.endsWith('"')) ||
                (trimmedValue.startsWith("'") && trimmedValue.endsWith("'")),
            preview: maskValue(trimmedValue),
            length: trimmedValue.length,
        };
    });

    return (
        <main style={{ padding: 24, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
            <h1 style={{ marginBottom: 8 }}>Firebase env debug</h1>
            <p style={{ marginBottom: 16 }}>
                Temporary diagnostics page. It shows whether Firebase client env vars are present in the deployed runtime.
            </p>
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead>
                    <tr>
                        <th style={{ borderBottom: "1px solid #ddd", textAlign: "left", padding: "8px 4px" }}>Key</th>
                        <th style={{ borderBottom: "1px solid #ddd", textAlign: "left", padding: "8px 4px" }}>Set</th>
                        <th style={{ borderBottom: "1px solid #ddd", textAlign: "left", padding: "8px 4px" }}>Length</th>
                        <th style={{ borderBottom: "1px solid #ddd", textAlign: "left", padding: "8px 4px" }}>Whitespace</th>
                        <th style={{ borderBottom: "1px solid #ddd", textAlign: "left", padding: "8px 4px" }}>Quoted</th>
                        <th style={{ borderBottom: "1px solid #ddd", textAlign: "left", padding: "8px 4px" }}>Preview</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.key}>
                            <td style={{ borderBottom: "1px solid #f0f0f0", padding: "8px 4px" }}>{row.key}</td>
                            <td style={{ borderBottom: "1px solid #f0f0f0", padding: "8px 4px" }}>{row.isSet ? "yes" : "no"}</td>
                            <td style={{ borderBottom: "1px solid #f0f0f0", padding: "8px 4px" }}>{row.length}</td>
                            <td style={{ borderBottom: "1px solid #f0f0f0", padding: "8px 4px" }}>
                                {row.hasWhitespacePadding ? "yes" : "no"}
                            </td>
                            <td style={{ borderBottom: "1px solid #f0f0f0", padding: "8px 4px" }}>
                                {row.hasWrappingQuotes ? "yes" : "no"}
                            </td>
                            <td style={{ borderBottom: "1px solid #f0f0f0", padding: "8px 4px" }}>{row.preview}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </main>
    );
}

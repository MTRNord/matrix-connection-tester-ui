export type Status = "ok" | "fail" | "warn";

export interface CardData {
    id: string;
    label: string;
    subtitle?: string;
    status?: Status;
    content?: {
        name: string;
        status?: Status;
    }[];
    children?: CardData[];
    metadata?: Record<string, string>;
}

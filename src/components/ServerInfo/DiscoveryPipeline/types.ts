export type Status = "ok" | "fail" | "warn";

export interface CardData {
    id: string;
    label: string;
    status: Status;
    content?: string;
    children?: CardData[];
}

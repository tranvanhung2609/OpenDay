export interface Device {
    id: string;
    name: string;
    type: string;
    location: string;
    wifi: string;
    ip: string;
    createdAt: string;
    updatedAt?: string;
}
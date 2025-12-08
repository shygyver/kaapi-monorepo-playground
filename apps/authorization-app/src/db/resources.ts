export interface Resource {
    id: number;
    title: string;
    content?: string | undefined;
    createdBy?: string | undefined;
}

export const RESOURCES: Resource[] = [
    { id: 1, title: 'Project Plan' },
    { id: 2, title: 'Budget Report' },
];
